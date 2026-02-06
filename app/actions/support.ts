"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Action to send/create a support ticket
 */
export async function sendSupportEmail(formData: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const ticket = await prisma.supportTicket.create({
      data: formData,
    });

    // Revalidate the admin view so the new ticket shows up
    revalidatePath("/admin/support");

    return { success: true, id: ticket.id };
  } catch (error) {
    console.error("Error creating ticket:", error);
    return { success: false, error: "Failed to create ticket" };
  }
}

/**
 * Action to delete a support ticket
 * Fixed: Converted string id to number to match Prisma schema
 */
export async function deleteTicket(id: string) {
  try {
    await prisma.supportTicket.delete({
      where: { 
        id: Number(id) // Fix: Cast string to number
      },
    });

    // This refreshes the page so the ticket disappears from the list
    revalidatePath("/admin/support");

    return { success: true };
  } catch (error) {
    console.error("Error deleting ticket:", error);
    return { success: false, error: "Failed to delete ticket" };
  }
}