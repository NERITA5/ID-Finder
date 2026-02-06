"use server";

import { db } from "../../lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * SERVER ACTION: createFoundIdReport
 * Handles saving found ID metadata to the PostgreSQL database via Prisma.
 */
export async function createFoundIdReport(data: {
  idType: string;
  imageUrl: string;
  region: string;
  locationDetail: string;
  notes?: string;
}) {
  // 1. Authenticate the user (using await for the latest Clerk API)
  const { userId } = await auth();
  const user = await currentUser(); 

  if (!userId) {
    return { success: false, error: "You must be logged in to report a found ID." };
  }

  try {
    // 2. Create the record in the database
    // Ensure your prisma schema model is named 'foundID'
    const report = await db.foundID.create({
      data: {
        idType: data.idType,
        imageUrl: data.imageUrl,
        region: data.region,
        locationDetail: data.locationDetail,
        notes: data.notes || null,
        reporterId: userId,
        // Construct a readable name for the finder
        reporterName: user?.firstName 
          ? `${user.firstName} ${user.lastName || ""}`.trim() 
          : "Anonymous Finder",
        status: "AVAILABLE",
      },
    });

    // 3. Trigger a revalidation of the cache
    // This makes the new report appear on the dashboard instantly without a manual refresh
    revalidatePath("/dashboard");
    revalidatePath("/search");
    
    return { 
      success: true, 
      id: report.id 
    };

  } catch (error) {
    // Log the error for server-side debugging
    console.error("PRISMA DB ERROR:", error);
    
    return { 
      success: false, 
      error: "Failed to save the report to the database. Check your connection or schema." 
    };
  }
}