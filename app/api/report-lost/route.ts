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
      dateOfBirth,   // NEW
      dateOfIssue,   // NEW
      placeOfBirth,  // NEW
      description, 
      imageUrl, 
      lastLocation, 
      dateLost, 
      qrCodeId 
    } = body;

    // 3. Create the Lost ID Record in PostgreSQL
    // This stores the data exactly as the user typed it for the owner's record
    const lostRecord = await prisma.lostID.create({
      data: {
        userId,
        idType,
        fullName,
        idNumber: idNumber || null,
        dateOfBirth: dateOfBirth || null,   // NEW
        dateOfIssue: dateOfIssue || null,   // NEW
        placeOfBirth: placeOfBirth || null, // NEW
        description: description || "",
        imageUrl: imageUrl || null,
        lastLocation,
        dateLost: new Date(dateLost),
        status: "LOST",
        qrCodeId: qrCodeId || null,
      },
    });

    // 4. TRIGGER AUTO-MATCH ENGINE
    // We pass ALL fields to the matcher. 
    // The matcher handles .toLowerCase() so it's NOT case-sensitive.
    const potentialMatches = await checkMatches({ 
      fullName, 
      idNumber, 
      idType, 
      dateOfBirth,
      dateOfIssue,
      placeOfBirth,
      status: "LOST" 
    });

    // 5. Return Response with Match Data
    return NextResponse.json({
      success: true,
      record: lostRecord,
      matchFound: potentialMatches.length > 0,
      matches: potentialMatches,
      message: potentialMatches.length > 0 
        ? `Great news! We found ${potentialMatches.length} potential matches for your ID!` 
        : "Report filed successfully. We will notify you the moment a match is found."
    });

  } catch (error) {
    console.error("[REPORT_LOST_POST_ERROR]", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}