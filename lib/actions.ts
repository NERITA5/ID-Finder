"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma"; 
import { checkMatches } from "./matcher"; 
import { pusherServer } from "./pusher"; 
import { v4 as uuidv4 } from "uuid";

/**
 * 1. QR VAULT & SECURITY
 */

// PUBLIC ACTION: Used by the Finder (Guest) to see if a QR is valid
export async function getVaultBySlug(slug: string) {
  try {
    // No auth() check here because guests need to access this
    const vault = await prisma.userVault.findUnique({
      where: { qrSlug: slug },
      select: {
        id: true,
        userId: true, // Needed to know who to notify
        createdAt: true,
      }
    });
    return vault;
  } catch (error) {
    console.error("Database error fetching public vault:", error);
    return null;
  }
}

export async function getOrCreateQRVault() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    let vault = await prisma.userVault.findUnique({
      where: { userId }
    });

    if (!vault) {
      vault = await prisma.userVault.create({
        data: {
          userId,
          qrSlug: uuidv4(),
        }
      });
    }

    return { success: true, qrSlug: vault.qrSlug };
  } catch (error) {
    console.error("Vault Error:", error);
    return { success: false, error: "Failed to access secure vault" };
  }
}

/**
 * 2. REPORTING ACTIONS (LOST & FOUND)
 */
export async function createLostReport(formData: {
  idType: string;
  fullName: string;
  idNumber?: string;
  placeOfBirth?: string;
  lastLocation: string;
  description: string;
  dateLost?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const newReport = await prisma.lostID.create({
      data: {
        userId,
        idType: formData.idType,
        fullName: formData.fullName,
        idNumber: formData.idNumber || null,
        placeOfBirth: formData.placeOfBirth || null,
        lastLocation: formData.lastLocation,
        description: formData.description,
        status: "LOST",
        dateLost: formData.dateLost ? new Date(formData.dateLost) : new Date(),
      },
    });

    // Run matcher logic
    const matches = await checkMatches({
      idType: formData.idType,
      fullName: formData.fullName,
      idNumber: formData.idNumber,
      placeOfBirth: formData.placeOfBirth,
      status: "LOST",
    });

    if (matches && matches.length > 0) {
      await prisma.notification.create({
        data: {
          userId,
          title: "Possible Match Found!",
          message: `We found matching records for your ${formData.idType}.`,
          type: "MATCH",
          metadata: { reportId: matches[0].id } as any
        },
      });
      await pusherServer.trigger(`user-alerts-${userId}`, "new-notification", {});
    }

    revalidatePath("/dashboard");
    revalidatePath("/my-reports");
    return { success: true, id: newReport.id, matchCount: matches?.length || 0 };
  } catch (error) {
    console.error("Lost Report Error:", error);
    return { success: false, error: "Database submission failed" };
  }
}

export async function reportFoundId(formData: {
  idType: string;
  fullName: string;
  idNumber?: string;
  placeOfBirth?: string;
  imageUrl: string;
  region: string;
  locationDetail: string;
  reporterName: string;
  targetOwnerId?: string; // Comes from the Vault Slug scan
}) {
  try {
    const { userId: reporterId } = await auth();

    const newFoundItem = await prisma.foundID.create({
      data: {
        idType: formData.idType,
        fullName: formData.fullName,
        idNumber: formData.idNumber || null,
        placeOfBirth: formData.placeOfBirth || null,
        imageUrl: formData.imageUrl,
        region: formData.region,
        locationDetail: formData.locationDetail,
        reporterName: formData.reporterName,
        reporterId: reporterId || "anonymous", 
        status: "AVAILABLE",
      },
    });

    // 1. Direct Notification if QR was scanned
    if (formData.targetOwnerId) {
      await prisma.notification.create({
        data: {
          userId: formData.targetOwnerId,
          title: "Your Protected ID was Found!",
          message: `Someone scanned your QR sticker and reported your ${formData.idType} found in ${formData.region}.`,
          type: "MATCH",
          metadata: { reportId: newFoundItem.id, senderId: reporterId || "anonymous" } as any
        }
      });
      await pusherServer.trigger(`user-alerts-${formData.targetOwnerId}`, "new-notification", {});
    }

    // 2. Global Matching (for people who didn't use QR)
    const directMatches = await prisma.lostID.findMany({
      where: {
        idType: formData.idType,
        status: "LOST",
        OR: [
          { idNumber: formData.idNumber },
          { fullName: { contains: formData.fullName, mode: 'insensitive' } }
        ]
      }
    });

    if (directMatches.length > 0) {
      await Promise.all(
        directMatches.map(async (match) => {
          // Skip if we already notified them via the targetOwnerId logic
          if (match.userId === formData.targetOwnerId) return;

          await prisma.notification.create({
            data: {
              userId: match.userId,
              title: "Possible ID Match Found!",
              message: `A ${formData.idType} matching your name was found in ${formData.region}.`,
              type: "MATCH",
              metadata: { reportId: newFoundItem.id, senderId: reporterId || "anonymous" } as any
            },
          });
          await pusherServer.trigger(`user-alerts-${match.userId}`, "new-notification", {});
        })
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/my-reports");
    return { success: true, matchCount: directMatches.length };
  } catch (error) {
    console.error("Found ID Error:", error);
    return { success: false };
  }
}

/**
 * 3. NOTIFICATIONS & CHAT
 */
export async function getNotifications() {
  const { userId } = await auth();
  if (!userId) return [];
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function markNotificationsAsRead() {
  const { userId } = await auth();
  if (!userId) return;
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  revalidatePath("/dashboard");
}

export async function startChat(reportId: string, targetUserId: string) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId) throw new Error("Unauthorized");
    if (currentUserId === targetUserId) throw new Error("Self-chat disabled");

    let chat = await prisma.chat.findFirst({
      where: { participants: { hasEvery: [currentUserId, targetUserId] } }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          reportId,
          participants: [currentUserId, targetUserId],
          ownerId: targetUserId, 
          finderId: currentUserId,
        }
      });
    }

    return { success: true, chatId: chat.id };
  } catch (error) {
    return { success: false };
  }
}

export async function sendMessage(chatId: string, text: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const message = await prisma.message.create({
      data: { chatId, senderId: userId, text },
    });

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    await pusherServer.trigger(chatId, "incoming-message", message);

    updatedChat.participants.forEach((pId) => {
      pusherServer.trigger(`user-chats-${pId}`, "update-conversation", updatedChat);
    });

    return { success: true, message };
  } catch (error) {
    return { success: false };
  }
}

export async function getUserChats() {
  const { userId } = await auth();
  if (!userId) return [];
  return await prisma.chat.findMany({
    where: { participants: { has: userId } },
    include: { 
      messages: { orderBy: { createdAt: 'desc' }, take: 1 } 
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getChatMessages(chatId: string) {
  return await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * 4. SEARCH & MANAGEMENT
 */
export async function getReportById(id: string) {
  try {
    let report = await prisma.lostID.findUnique({ where: { id } });
    
    if (!report) {
      const foundReport = await prisma.foundID.findUnique({ where: { id } });
      if (foundReport) {
        return {
          ...foundReport,
          lastLocation: `${foundReport.region}, ${foundReport.locationDetail}`,
          status: "FOUND",
        };
      }
    }
    return report;
  } catch (error) {
    return null;
  }
}

export async function searchReports(query: string) {
  if (!query || query.length < 2) return [];
  return await prisma.lostID.findMany({
    where: {
      OR: [
        { fullName: { contains: query, mode: 'insensitive' } },
        { idNumber: { contains: query, mode: 'insensitive' } },
        { idType: { contains: query, mode: 'insensitive' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
    take: 30, 
  });
}

export async function markAsRecovered(reportId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false };
  await prisma.lostID.update({
    where: { id: reportId, userId },
    data: { status: "RETURNED" }, 
  });
  revalidatePath("/dashboard");
  revalidatePath("/my-reports");
  return { success: true };
}

export async function deleteReport(reportId: string, type: 'LOST' | 'FOUND') {
  const { userId } = await auth();
  if (!userId) return { success: false };

  if (type === 'LOST') {
    await prisma.lostID.delete({ where: { id: reportId, userId } });
  } else {
    await prisma.foundID.delete({ where: { id: reportId, reporterId: userId } });
  }

  revalidatePath("/dashboard");
  revalidatePath("/my-reports");
  return { success: true };
}

export async function getUserReports() {
  const { userId } = await auth();
  if (!userId) return { lost: [], found: [] };
  
  const [lost, found] = await Promise.all([
    prisma.lostID.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.foundID.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
    })
  ]);

  return { lost, found };
}

export async function getRecentReports() {
  return await prisma.lostID.findMany({
    where: { status: "LOST" },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}