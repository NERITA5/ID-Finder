import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Use your global prisma instance

export async function POST(req: Request) {
  try {
    const { lostId } = await req.json();

    if (!lostId) {
      return new NextResponse("Lost ID is required", { status: 400 });
    }

    // 1. Find the lost ID record
    const record = await prisma.lostID.findUnique({
      where: { id: lostId },
    });

    if (!record) {
      return new NextResponse("Record not found", { status: 404 });
    }

    // 2. Optimization: Don't notify if the item is already returned
    if (record.status === "RETURNED") {
      return NextResponse.json({ success: true, message: "Item already recovered" });
    }

    // 3. Create a notification for the owner
    // This will appear on their Dashboard in the "Recent Alerts" section
    await prisma.notification.create({
      data: {
        userId: record.userId,
        title: "🚨 QR CODE SCANNED!",
        message: `Your ${record.idType} was just scanned! Someone may have found it. Coordinate the return via your dashboard.`,
        type: "MATCH",
      },
    });

    return NextResponse.json({ 
      success: true, 
      ownerId: record.userId // Helpful for debugging/tracking
    });

  } catch (error) {
    console.error("API Notification Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}