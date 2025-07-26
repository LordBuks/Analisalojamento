import { AthleteOccurrence } from "../data/athleteData";

export interface AgeCategoryOccurrenceAnalysis {
  ageCategory: string;
  occurrenceType: string;
  count: number;
}

export const analyzeByAgeCategoryAndOccurrenceType = (occurrences: AthleteOccurrence[]): AgeCategoryOccurrenceAnalysis[] => {
  const analysisMap = new Map<string, AgeCategoryOccurrenceAnalysis>();

  occurrences.forEach(occurrence => {
    const key = `${occurrence.CAT}-${occurrence.TIPO}`;
    if (analysisMap.has(key)) {
      const existing = analysisMap.get(key)!;
      existing.count++;
      analysisMap.set(key, existing);
    } else {
      analysisMap.set(key, {
        ageCategory: occurrence.CAT,
        occurrenceType: occurrence.TIPO,
        count: 1,
      });
    }
  });

  return Array.from(analysisMap.values());
};


