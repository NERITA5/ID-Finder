import { prisma } from "./prisma";

/**
 * Matcher Utility
 * Searches for cross-table matches between LostID and FoundID records.
 */
export async function checkMatches(newItem: {
  idType: string;
  fullName: string;
  status: "LOST" | "FOUND";
  idNumber?: string;
}) {
  try {
    // 1. If we just reported a LOST ID, search the FOUND table
    if (newItem.status === "LOST") {
      return await prisma.foundID.findMany({
        where: {
          idType: newItem.idType,
          OR: [
            { 
              reporterName: { 
                contains: newItem.fullName, 
                mode: "insensitive" 
              } 
            },
            ...(newItem.idNumber ? [
              { 
                notes: { 
                  contains: newItem.idNumber, 
                  mode: "insensitive" as any // FIXED: Cast to any to bypass QueryMode strictness
                } 
              }
            ] : []),
          ],
          status: "AVAILABLE",
        },
      });
    }

    // 2. If we just reported a FOUND ID, search the LOST table
    if (newItem.status === "FOUND") {
      return await prisma.lostID.findMany({
        where: {
          idType: newItem.idType,
          fullName: { 
            contains: newItem.fullName, 
            mode: "insensitive" 
          },
          ...(newItem.idNumber ? { idNumber: newItem.idNumber } : {}),
          status: "LOST",
        },
      });
    }

    return [];
  } catch (error) {
    console.error("Match check failed:", error);
    return [];
  }
}