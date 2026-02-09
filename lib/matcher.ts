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
    
    // Normalize inputs for the database query
    const searchType = newItem.idType.trim();
    
    // 1. FETCH CANDIDATES
    // We use 'mode: insensitive' to ensure 'National ID' matches 'national id'
    const candidates = isLostReport
      ? await prisma.foundID.findMany({
          where: { 
            idType: { equals: searchType, mode: 'insensitive' },
            // Matches both "AVAILABLE" and "FOUND" to be safe
            status: { in: ["AVAILABLE", "FOUND"] } 
          },
        })
      : await prisma.lostID.findMany({
          where: { 
            idType: { equals: searchType, mode: 'insensitive' },
            status: "LOST" 
          },
        });

    // Debugging: Log how many records were actually pulled from the DB
    console.log(`[Matching] Found ${candidates.length} potential ${isLostReport ? 'FOUND' : 'LOST'} candidates in DB.`);

    // 2. SCORING LOGIC
    const scoredMatches = candidates.map((candidate: any) => {
      let score = 0;

      // --- ID NUMBER MATCHING (70 Points) ---
      if (newItem.idNumber && candidate.idNumber) {
        // Remove all non-alphanumeric characters (dashes, spaces, dots) for comparison
        const cleanNewId = newItem.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cleanCandId = candidate.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();

        if (cleanNewId === cleanCandId) {
          score += 70;
        }
      }

      // --- NAME MATCHING (Max 25 Points) ---
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

      // --- PLACE OF BIRTH MATCHING (10 Points) ---
      if (newItem.placeOfBirth && candidate.placeOfBirth) {
        const inputPOB = newItem.placeOfBirth.toLowerCase().trim();
        const candPOB = candidate.placeOfBirth.toLowerCase().trim();
        if (inputPOB === candPOB) score += 10;
      }

      return { ...candidate, matchScore: score };
    });

    // 3. FILTER & SORT
    const finalResults = scoredMatches
      .filter((match) => match.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log(`[Matching] Results after scoring: ${finalResults.length}`);
    return finalResults;

  } catch (error) {
    console.error("Match check failed:", error);
    return [];
  }
}