"use server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Submit a new fraud report
 * ADJUSTMENT: Ensured evidenceUrl is explicitly mapped from imageUrl
 */
export async function submitFraudReport(formData: {
  description: string;
  imageUrl?: string;
  issueType: string;
}) {
  try {
    // Log for debugging: ensure the URL is actually arriving here
    console.log("Receiving Image URL:", formData.imageUrl);

    const report = await prisma.fraudReport.create({
      data: {
        description: formData.description,
        evidenceUrl: formData.imageUrl || null, // Mapping front-end 'imageUrl' to DB 'evidenceUrl'
        issueType: formData.issueType,
        status: "PENDING",
      },
    });

    revalidatePath("/admin/reports");
    return { success: true, id: report.id };
  } catch (error) {
    console.error("Prisma Submission Error:", error);
    return { success: false, error: "Database connection failed" };
  }
}

/**
 * Mark a report as Resolved
 */
export async function resolveReport(reportId: number) {
  try {
    await prisma.fraudReport.update({
      where: { id: reportId },
      data: { status: "RESOLVED" },
    });

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    console.error("Failed to resolve report:", error);
    return { success: false };
  }
}

/**
 * Permanently delete a report
 */
export async function deleteReport(reportId: number) {
  try {
    await prisma.fraudReport.delete({
      where: { id: reportId },
    });

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete report:", error);
    return { success: false };
  }
}

/**
 * Ban User Action (NEW)
 * This is currently a 'soft-ban' logic that marks the report. 
 * If you have a User model, you would update user.isBanned here.
 */
export async function banUser(reportId: number) {
  try {
    await prisma.fraudReport.update({
      where: { id: reportId },
      data: { status: "BANNED" }, // Custom status to indicate action taken
    });

    revalidatePath("/admin/reports");
    return { success: true };
  } catch (error) {
    console.error("Failed to ban user:", error);
    return { success: false };
  }
}