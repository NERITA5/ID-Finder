import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { checkMatches } from "../../../lib/matcher";

export async function POST(req: Request) {
  try {
    // 1. Authenticate the User via Clerk
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Parse the Request Body
    const body = await req.json();
    const { 
      idType, 
      fullName, 
      idNumber, 
      description, 
      imageUrl, 
      lastLocation, 
      dateLost, 
      qrCodeId 
    } = body;

    // 3. Create the Lost ID Record in PostgreSQL
    const lostRecord = await prisma.lostID.create({
      data: {
        userId,
        idType,
        fullName,
        idNumber: idNumber || null,
        description: description || "",
        imageUrl: imageUrl || null,
        lastLocation,
        dateLost: new Date(dateLost),
        status: "LOST",
        qrCodeId: qrCodeId || null,
      },
    });

    // 4. TRIGGER AUTO-MATCH ENGINE
    // FIXED: Added idType and status to match the utility's expected object structure
    const potentialMatches = await checkMatches({ 
      fullName, 
      idNumber, 
      idType, 
      status: "LOST" 
    });

    // 5. Return Response with Match Data
    return NextResponse.json({
      success: true,
      record: lostRecord,
      matchFound: potentialMatches.length > 0,
      matches: potentialMatches,
      message: potentialMatches.length > 0 
        ? `We found ${potentialMatches.length} potential matches for your ID!` 
        : "Report filed. We will notify you when a match is found."
    });

  } catch (error) {
    console.error("[REPORT_LOST_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}