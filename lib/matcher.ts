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
    // Fuzzy type matching (e.g., "National" matches "National ID" or "National Card")
    const baseType = newItem.idType.split(" ")[0]; 

    // 1. FETCH CANDIDATES
    const candidates = isLostReport
      ? await prisma.foundID.findMany({
          where: {
            idType: { contains: baseType, mode: 'insensitive' },
            status: { in: ["AVAILABLE"] }
          },
        })
      : await prisma.lostID.findMany({
          where: {
            idType: { contains: baseType, mode: 'insensitive' },
            status: "LOST"
          },
        });

    const scoredMatches = candidates.map((candidate: any) => {
      let score = 0;

      // --- 1. ID NUMBER (50 Points) ---
      // Strip spaces/dashes. OCR often fails here, so manual entry is king.
      if (newItem.idNumber && candidate.idNumber) {
        const cleanNew = newItem.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        const cleanCand = candidate.idNumber.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
        if (cleanNew === cleanCand) score += 50;
      }

      // --- 2. FULL NAME (25 Points) ---
      // Case-insensitive & trimmed
      const name1 = newItem.fullName.toLowerCase().trim();
      const name2 = candidate.fullName.toLowerCase().trim();
      
      if (name1 === name2) {
        score += 25; 
      } else {
        const parts1 = name1.split(/\s+/).filter(p => p.length > 1);
        const parts2 = name2.split(/\s+/).filter(p => p.length > 1);
        const common = parts1.filter(p => parts2.includes(p));
        if (common.length >= 2) score += 20; 
      }

      // --- 3. DATE OF BIRTH (15 Points) ---
      if (newItem.dateOfBirth && candidate.dateOfBirth) {
        if (newItem.dateOfBirth.trim() === candidate.dateOfBirth.trim()) {
          score += 15;
        }
      }

      // --- 4. DATE OF ISSUE (10 Points) ---
      if (newItem.dateOfIssue && candidate.dateOfIssue) {
        if (newItem.dateOfIssue.trim() === candidate.dateOfIssue.trim()) {
          score += 10;
        }
      }

      // --- 5. PLACE OF BIRTH (5 Points) ---
      if (newItem.placeOfBirth && candidate.placeOfBirth) {
        if (newItem.placeOfBirth.toLowerCase().trim() === candidate.placeOfBirth.toLowerCase().trim()) {
          score += 5;
        }
      }

      return { ...candidate, matchScore: score };
    });

    // THRESHOLD: 60 Points
    // Requires (ID Number + Name) OR (Name + DOB + DOI + POB)
    const finalResults = scoredMatches
      .filter((match) => match.matchScore >= 60)
      .sort((a, b) => b.matchScore - a.matchScore);

    return finalResults;

  } catch (error) {
    console.error("Match check failed:", error);
    return [];
  }
}