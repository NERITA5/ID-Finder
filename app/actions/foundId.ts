"use server";

import { db } from "../../lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * SERVER ACTION: reportFoundId
 * Handles saving found ID metadata including OCR results to PostgreSQL.
 */
export async function reportFoundId(data: {
  idType: string;
  fullName: string;    // Added: Required by your schema
  idNumber: string;    // Added: Required by your schema
  imageUrl: string;
  region: string;
  locationDetail: string;
  notes?: string;
}) {
  // 1. Authenticate the user
  const { userId } = await auth();
  const user = await currentUser(); 

  if (!userId) {
    return { success: false, error: "You must be logged in to report a found ID." };
  }

  try {
    // 2. Create the record in the database
    // Field names here MUST match your schema.prisma exactly
    const report = await db.foundID.create({
      data: {
        idType: data.idType,
        fullName: data.fullName,       // Map the OCR name
        idNumber: data.idNumber,       // Map the OCR ID number
        imageUrl: data.imageUrl,
        region: data.region,
        locationDetail: data.locationDetail,
        notes: data.notes || null,
        reporterId: userId,
        // Construct a readable name for the finder from Clerk data
        reporterName: user?.firstName 
          ? `${user.firstName} ${user.lastName || ""}`.trim() 
          : "Anonymous Finder",
        status: "AVAILABLE",
      },
    });

    // 3. Revalidate paths to clear stale data
    revalidatePath("/dashboard");
    revalidatePath("/search");
    revalidatePath("/");
    
    return { 
      success: true, 
      id: report.id 
    };

  } catch (error) {
    console.error("PRISMA DB ERROR:", error);
    
    return { 
      success: false, 
      error: "Database check failed. Ensure fullName and idNumber exist in your schema." 
    };
  }
}