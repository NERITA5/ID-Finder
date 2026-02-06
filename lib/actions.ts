"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { prisma } from "./prisma"; 
import { checkMatches } from "./matcher"; 
import { pusherServer } from "./pusher"; 

/**
 * 1. CREATE LOST ID REPORT
 */
export async function createLostReport(formData: {
  idType: string;
  fullName: string;
  lastLocation: string;
  description: string;
}) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const newReport = await prisma.lostID.create({
      data: {
        userId,
        idType: formData.idType,
        fullName: formData.fullName,
        lastLocation: formData.lastLocation,
        description: formData.description,
        status: "LOST",
        dateLost: new Date(), // FIXED: Added missing required field 'dateLost'
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/my-reports");
    return { success: true, id: newReport.id };
  } catch (error) {
    console.error("Failed to create lost report:", error);
    return { success: false, error: "Database submission failed" };
  }
}

/**
 * 2. REPORT FOUND ID & TRIGGER MATCHER
 */
export async function reportFoundId(formData: {
  idType: string;
  fullName: string;
  imageUrl: string;
  region: string;
  locationDetail: string;
  reporterName: string;
}) {
  try {
    const { userId: reporterId } = await auth();

    const newFoundItem = await prisma.foundID.create({
      data: {
        idType: formData.idType,
        imageUrl: formData.imageUrl,
        region: formData.region,
        locationDetail: formData.locationDetail,
        reporterId: reporterId || "anonymous", 
        reporterName: formData.reporterName,
        status: "FOUND",
      },
    });

    // FIXED: Added status and idNumber to match the updated checkMatches signature
    const matches = await checkMatches({
      idType: formData.idType,
      fullName: formData.fullName,
      status: "FOUND", 
    });

    if (matches && matches.length > 0) {
      await Promise.all(
        matches.map((match: any) =>
          prisma.notification.create({
            data: {
              userId: match.userId,
              title: "Possible Match Found!",
              message: `A ${formData.idType} matching your name was found in ${formData.region}.`,
              type: "MATCH",
            },
          })
        )
      );
    }

    revalidatePath("/dashboard");
    revalidatePath("/");
    return { success: true, matchCount: matches?.length || 0 };
  } catch (error) {
    console.error("Found ID reporting failed:", error);
    return { success: false };
  }
}

/**
 * 3. FETCH RECENT REPORTS
 */
export async function getRecentReports() {
  try {
    return await prisma.lostID.findMany({
      where: { status: "LOST" },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  } catch (error) {
    return [];
  }
}

/**
 * 4. FETCH SPECIFIC USER REPORTS
 */
export async function getUserReports() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.lostID.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    return [];
  }
}

/**
 * 5. SEARCH REPORTS
 */
export async function searchReports(query: string) {
  try {
    if (!query || query.length < 2) return [];

    return await prisma.lostID.findMany({
      where: {
        OR: [
          { fullName: { contains: query, mode: 'insensitive' } },
          { idType: { contains: query, mode: 'insensitive' } },
          { lastLocation: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 30, 
    });
  } catch (error) {
    console.error("Search Action Error:", error);
    return [];
  }
}

/**
 * 6. NOTIFICATION ACTIONS
 */
export async function getNotifications() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    return [];
  }
}

export async function markNotificationsAsRead() {
  try {
    const { userId } = await auth();
    if (!userId) return;

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    revalidatePath("/dashboard");
    revalidatePath("/notifications");
  } catch (error) {
    console.error("Failed to update notifications:", error);
  }
}

/**
 * 7. MANAGEMENT ACTIONS
 */
export async function markAsRecovered(reportId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.lostID.update({
      where: { id: reportId, userId: userId },
      data: { status: "RETURNED" }, // FIXED: Changed from "RECLAIMED" to match Enum
    });

    revalidatePath("/my-reports");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function deleteReport(reportId: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    await prisma.lostID.delete({
      where: { id: reportId, userId: userId },
    });

    revalidatePath("/my-reports");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

/**
 * 8. FETCH SINGLE REPORT
 */
export async function getReportById(id: string) {
  try {
    return await prisma.lostID.findUnique({
      where: { id },
    });
  } catch (error) {
    return null;
  }
}

/**
 * 9. CHAT & MESSAGING ACTIONS
 */
export async function sendMessage(chatId: string, text: string) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId: userId,
        text,
      },
    });

    await pusherServer.trigger(chatId, "incoming-message", message);

    revalidatePath(`/chat/${chatId}`);
    return { success: true, message };
  } catch (error) {
    console.error("Failed to send message:", error);
    return { success: false };
  }
}

export async function getChatMessages(chatId: string) {
  try {
    return await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
    });
  } catch (error) {
    console.error("Failed to fetch messages:", error);
    return [];
  }
}

/**
 * 10. FETCH ALL CONVERSATIONS FOR USER
 */
export async function getUserChats() {
  try {
    const { userId } = await auth();
    if (!userId) return [];

    return await prisma.chat.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { finderId: userId }
        ]
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  } catch (error) {
    console.error("Failed to fetch user chats:", error);
    return [];
  }
}

/**
 * 11. START OR GET EXISTING CHAT
 */
export async function startChat(reportId: string, finderId: string) {
  try {
    const { userId: ownerId } = await auth();
    if (!ownerId) throw new Error("Unauthorized");

    let chat = await prisma.chat.findFirst({
      where: {
        reportId,
        OR: [
          { AND: [{ ownerId }, { finderId }] },
          { AND: [{ ownerId: finderId }, { finderId: ownerId }] }
        ]
      }
    });

    if (!chat) {
      chat = await prisma.chat.create({
        data: {
          reportId,
          ownerId,
          finderId,
        }
      });
    }

    return { success: true, chatId: chat.id };
  } catch (error) {
    console.error("Failed to start chat:", error);
    return { success: false };
  }
}