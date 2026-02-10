"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma"; 
import { checkMatches } from "./matcher"; 
import { pusherServer } from "./pusher"; 
import { v4 as uuidv4 } from "uuid";

/**
 * 1. QR VAULT & SECURITY LAYER
 */
export async function getVaultBySlug(slug: string) {
  try {
    return await prisma.userVault.findUnique({
      where: { qrSlug: slug },
      select: {
        id: true,
        userId: true, 
        createdAt: true,
      }
    });
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
  dateOfBirth?: string;
  dateOfIssue?: string;
  placeOfBirth?: string;
  lastLocation: string;
  description: string;
  imageUrl?: string;
  dateLost?: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Check for existing found items that match this new lost report
    const matches = await checkMatches({
      idType: formData.idType,
      fullName: formData.fullName,
      idNumber: formData.idNumber,
      dateOfBirth: formData.dateOfBirth,
      dateOfIssue: formData.dateOfIssue,
      placeOfBirth: formData.placeOfBirth,
      status: "LOST", // Tells matcher to search the FoundID table
    });

    const hasMatch = matches && matches.length > 0;
    const initialStatus = hasMatch ? "MATCHED" : "LOST";

    const newReport = await prisma.lostID.create({
      data: {
        userId,
        idType: formData.idType,
        fullName: formData.fullName,
        idNumber: formData.idNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        dateOfIssue: formData.dateOfIssue || null,
        placeOfBirth: formData.placeOfBirth || null,
        lastLocation: formData.lastLocation,
        description: formData.description,
        imageUrl: formData.imageUrl || null,
        status: initialStatus,
        dateLost: formData.dateLost ? new Date(formData.dateLost) : new Date(),
      },
    });

    // If matches found, notify both the Owner and the Finder(s)
    if (hasMatch) {
      await Promise.all(
        matches.map(async (match) => {
          // Update the existing Found item to MATCHED
          await prisma.foundID.update({
            where: { id: match.id },
            data: { status: "MATCHED" as any }
          });

          // Notify the person who just reported it Lost (The Owner)
          const ownerNotification = await prisma.notification.create({
            data: {
              userId,
              title: "Instant Match Found!",
              message: `A ${formData.idType} matching your details was already reported found in ${match.region}.`,
              type: "MATCH",
              metadata: { reportId: match.id, senderId: match.reporterId } as any
            },
          });
          await pusherServer.trigger(`user-alerts-${userId}`, "new-notification", ownerNotification);

          // Notify the Finder (If they are a registered user)
          if (match.reporterId && match.reporterId !== "anonymous") {
            const finderNotification = await prisma.notification.create({
              data: {
                userId: match.reporterId,
                title: "Your Found Item was Claimed!",
                message: `The owner of the ${formData.idType} you found has just reported it lost.`,
                type: "MATCH",
                metadata: { reportId: newReport.id, senderId: userId } as any
              },
            });
            await pusherServer.trigger(`user-alerts-${match.reporterId}`, "new-notification", finderNotification);
          }
        })
      );
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/my-reports");
    return { success: true, id: newReport.id, matchCreated: hasMatch, matchCount: matches?.length || 0 };
  } catch (error) {
    console.error("Lost Report Error:", error);
    return { success: false, error: "Database submission failed" };
  }
}

export async function reportFoundId(formData: {
  idType: string;
  fullName: string;
  idNumber?: string;
  dateOfBirth?: string;
  dateOfIssue?: string;
  placeOfBirth?: string;
  imageUrl: string;
  backImageUrl?: string;
  region: string;
  locationDetail: string;
  reporterName: string;
  targetOwnerId?: string; 
  vaultSlug?: string;     
}) {
  try {
    const { userId: reporterId } = await auth();

    const newFoundItem = await prisma.foundID.create({
      data: {
        idType: formData.idType,
        fullName: formData.fullName,
        idNumber: formData.idNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        dateOfIssue: formData.dateOfIssue || null,
        placeOfBirth: formData.placeOfBirth || null,
        imageUrl: formData.imageUrl,
        backImageUrl: formData.backImageUrl || null,
        region: formData.region,
        locationDetail: formData.locationDetail,
        reporterName: formData.reporterName,
        reporterId: reporterId || "anonymous", 
        status: "AVAILABLE",
      },
    });

    let matchCreated = false;

    // 1. DIRECT QR SCAN LOGIC
    if (formData.targetOwnerId) {
      matchCreated = true;
      const notification = await prisma.notification.create({
        data: {
          userId: formData.targetOwnerId,
          title: "Your Protected ID was Found!",
          message: `Someone scanned your QR sticker and reported your ${formData.idType} found in ${formData.region}.`,
          type: "MATCH",
          metadata: { 
            reportId: newFoundItem.id, 
            senderId: reporterId || "anonymous",
            vaultSlug: formData.vaultSlug 
          } as any
        }
      });

      // Update any corresponding LOST records for this user
      await prisma.lostID.updateMany({
        where: { userId: formData.targetOwnerId, idType: formData.idType, status: "LOST" },
        data: { status: "MATCHED" }
      });

      // Mark the found item itself as matched
      await prisma.foundID.update({
        where: { id: newFoundItem.id },
        data: { status: "MATCHED" as any }
      });

      await pusherServer.trigger(`user-alerts-${formData.targetOwnerId}`, "new-notification", notification);
    }

    // 2. GLOBAL SYSTEM MATCHING (Fuzzy Search)
    const matches = await checkMatches({
      idType: formData.idType,
      fullName: formData.fullName,
      idNumber: formData.idNumber,
      dateOfBirth: formData.dateOfBirth,
      dateOfIssue: formData.dateOfIssue,
      placeOfBirth: formData.placeOfBirth,
      status: "FOUND", // Tells matcher to search the LostID table
    });

    if (matches.length > 0) {
      matchCreated = true;
      await Promise.all(
        matches.map(async (match) => {
          await prisma.lostID.update({
            where: { id: match.id },
            data: { status: "MATCHED" }
          });

          // Mark current item as matched
          await prisma.foundID.update({
            where: { id: newFoundItem.id },
            data: { status: "MATCHED" as any }
          });

          if (match.userId === formData.targetOwnerId) return;

          const notification = await prisma.notification.create({
            data: {
              userId: match.userId,
              title: "We Found a Match!",
              message: `A ${formData.idType} matching your details was found in ${formData.region}.`,
              type: "MATCH",
              metadata: { 
                reportId: newFoundItem.id, 
                senderId: reporterId || "anonymous" 
              } as any
            },
          });
          await pusherServer.trigger(`user-alerts-${match.userId}`, "new-notification", notification);
        })
      );
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/my-reports");
    return { success: true, matchCreated, matchCount: matches.length };
  } catch (error) {
    console.error("Found ID Error:", error);
    return { success: false };
  }
}

/**
 * 3. CHAT SYSTEM
 */
export async function startChat(reportId: string, targetUserId: string) {
  try {
    const { userId: currentUserId } = await auth();
    if (!currentUserId || currentUserId === targetUserId) throw new Error("Invalid chat request");

    let chat = await prisma.chat.findFirst({
      where: { 
        participants: { hasEvery: [currentUserId, targetUserId] } 
      }
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
 * 4. NOTIFICATIONS & UTILS
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
  revalidatePath("/notifications");
}

export async function clearAllNotifications() {
  const { userId } = await auth();
  if (!userId) return { success: false };
  await prisma.notification.deleteMany({ where: { userId } });
  revalidatePath("/notifications");
  return { success: true };
}

/**
 * 5. SEARCH & DATA RETRIEVAL
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
        { placeOfBirth: { contains: query, mode: 'insensitive' } },
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
    where: { 
      status: { in: ["LOST", "MATCHED"] } 
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
}