import { prisma } from "./prisma";

export async function checkMatches(newItem: {
  idType: string;
  fullName: string;
  status: "LOST" | "FOUND";
  idNumber?: string;
  dateOfBirth?: string;
  dateOfIssue?: string;
  placeOfBirth?: string;
}) {
  try {
    const isLostReport = newItem.status === "LOST";
    const typeSearch = newItem.idType?.trim().substring(0, 4) || ""; 

    console.log(`--- MATCH CHECK START ---`);

    // 1. FETCH CANDIDATES 
    // This uses 'as any' to prevent the Enum build error you saw earlier
    const candidates = isLostReport
      ? await prisma.foundID.findMany({
          where: {
            idType: { contains: typeSearch, mode: 'insensitive' },
            status: "AVAILABLE" as any
          },
        })
      : await prisma.lostID.findMany({
          where: {
            idType: { contains: typeSearch, mode: 'insensitive' },
            status: "LOST" as any
          },
        });

    console.log(`Candidates found in DB: ${candidates.length}`);

    const scoredMatches = candidates.map((candidate: any) => {
      let score = 0;

      // --- 1. ID NUMBER (60 Points) ---
      if (newItem.idNumber && candidate.idNumber) {
        const cleanNew = newItem.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cleanCand = candidate.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        
        if (cleanNew === cleanCand) {
          score += 60;
        } else if (cleanNew.includes(cleanCand) || cleanCand.includes(cleanNew)) {
          if (cleanNew.length > 5) score += 40; 
        }
      }

      // --- 2. FULL NAME (30 Points) ---
      const name1 = newItem.fullName.toLowerCase().trim();
      const name2 = candidate.fullName.toLowerCase().trim();
      
      if (name1 === name2) {
        score += 30; 
      } else {
        const parts1 = name1.split(/\s+/).filter(p => p.length > 2);
        const parts2 = name2.split(/\s+/).filter(p => p.length > 2);
        const common = parts1.filter(p => parts2.includes(p));
        if (common.length >= 1) score += 15;
        if (common.length >= 2) score += 15; 
      }

      // --- 3. DATE OF BIRTH (15 Points) ---
      if (newItem.dateOfBirth && candidate.dateOfBirth) {
        if (newItem.dateOfBirth.trim() === candidate.dateOfBirth.trim()) {
          score += 15;
        }
      }

      // --- 4. DOI / POB (10 Points) ---
      if (newItem.dateOfIssue && candidate.dateOfIssue && newItem.dateOfIssue.trim() === candidate.dateOfIssue.trim()) {
        score += 5;
      }
      if (newItem.placeOfBirth && candidate.placeOfBirth && newItem.placeOfBirth.toLowerCase().trim() === candidate.placeOfBirth.toLowerCase().trim()) {
        score += 5;
      }

      return { ...candidate, matchScore: score };
    });

    const finalResults = scoredMatches
      .filter((match) => match.matchScore >= 35)
      .sort((a, b) => b.matchScore - a.matchScore);

    console.log(`Final Results Count: ${finalResults.length}`);
    console.log(`--- MATCH CHECK END ---`);

    return finalResults;

  } catch (error) {
    console.error("CRITICAL: Match check failed:", error);
    return [];
  }
}