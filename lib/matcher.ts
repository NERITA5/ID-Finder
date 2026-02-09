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
    const targetStatus = isLostReport ? "AVAILABLE" : "LOST";

    const candidates = isLostReport
      ? await prisma.foundID.findMany({
          where: { idType: newItem.idType, status: targetStatus },
        })
      : await prisma.lostID.findMany({
          where: { idType: newItem.idType, status: targetStatus },
        });

    const scoredMatches = candidates.map((candidate: any) => {
      let score = 0;

      // 1. ID NUMBER (70 Points)
      if (
        newItem.idNumber && 
        candidate.idNumber && 
        newItem.idNumber.trim().replace(/\s/g, "") === candidate.idNumber.trim().replace(/\s/g, "")
      ) {
        score += 70;
      }

      // 2. FULL NAME (Max 25 Points)
      const inputName = newItem.fullName.toLowerCase().trim();
      const candName = candidate.fullName.toLowerCase().trim();
      
      if (inputName === candName) {
        score += 25; 
      } else {
        // Split names to check if at least two parts match (e.g., First and Last)
        const inputParts = inputName.split(/\s+/);
        const candParts = candName.split(/\s+/);
        const commonParts = inputParts.filter(part => candParts.includes(part));
        
        if (commonParts.length >= 2) {
          score += 20; 
        } else if (candName.includes(inputName) || inputName.includes(candName)) {
          score += 15;
        }
      }

      // 3. PLACE OF BIRTH (10 Points)
      if (
        newItem.placeOfBirth && 
        candidate.placeOfBirth && 
        newItem.placeOfBirth.toLowerCase().trim() === candidate.placeOfBirth.toLowerCase().trim()
      ) {
        score += 10;
      }

      return { ...candidate, matchScore: score };
    });

    // We keep the threshold at 30. 
    // This requires (ID Number match) OR (Exact Name + POB) OR (Split Name Match + POB)
    return scoredMatches
      .filter((match) => match.matchScore >= 30)
      .sort((a, b) => b.matchScore - a.matchScore);

  } catch (error) {
    console.error("Match check failed:", error);
    return [];
  }
}