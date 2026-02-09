import { prisma } from "./prisma";

export async function checkMatches(newItem: {
  idType: string;
  fullName: string;
  status: "LOST" | "FOUND";
  idNumber?: string;
  placeOfBirth?: string;
}) {
  try {
    const isLostReport = newItem.status === "LOST";
    
    // Standardize the search term (e.g., "National ID Card" becomes "National")
    // This allows "National ID" and "National ID Card" to find each other.
    const baseType = newItem.idType.split(" ")[0]; 

    console.log(`[DEBUG] Searching for ${newItem.status} match. Type: ${newItem.idType}, Num: ${newItem.idNumber}`);

    // 1. FETCH CANDIDATES (The "Fuzzy" Fetch)
    const candidates = isLostReport
      ? await prisma.foundID.findMany({
          where: {
            idType: { contains: baseType, mode: 'insensitive' },
            status: { in: ["AVAILABLE", "FOUND"] } // Checks both just in case
          },
        })
      : await prisma.lostID.findMany({
          where: {
            idType: { contains: baseType, mode: 'insensitive' },
            status: "LOST"
          },
        });

    console.log(`[DEBUG] DB returned ${candidates.length} potential candidates.`);

    const scoredMatches = candidates.map((candidate: any) => {
      let score = 0;

      // --- ID NUMBER (70 Points) ---
      // We remove ALL non-alphanumeric characters (dashes, spaces, etc)
      if (newItem.idNumber && candidate.idNumber) {
        const cleanNew = newItem.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cleanCand = candidate.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        
        if (cleanNew === cleanCand) {
          score += 70;
        }
      }

      // --- FULL NAME (Max 25 Points) ---
      const inputName = newItem.fullName.toLowerCase().trim();
      const candName = candidate.fullName.toLowerCase().trim();
      
      if (inputName === candName) {
        score += 25; 
      } else {
        const inputParts = inputName.split(/\s+/).filter(p => p.length > 1);
        const candParts = candName.split(/\s+/).filter(p => p.length > 1);
        const commonParts = inputParts.filter(part => candParts.includes(part));
        
        if (commonParts.length >= 2) {
          score += 20; 
        } else if (candName.includes(inputName) || inputName.includes(candName)) {
          score += 15;
        }
      }

      // --- PLACE OF BIRTH (10 Points) ---
      if (newItem.placeOfBirth && candidate.placeOfBirth) {
        if (newItem.placeOfBirth.toLowerCase().trim() === candidate.placeOfBirth.toLowerCase().trim()) {
          score += 10;
        }
      }

      return { ...candidate, matchScore: score };
    });

    const finalResults = scoredMatches
      .filter((match) => match.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log(`[DEBUG] Final matches after scoring: ${finalResults.length}`);
    return finalResults;

  } catch (error) {
    console.error("Match check failed:", error);
    return [];
  }
}