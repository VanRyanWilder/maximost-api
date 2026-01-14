export const CIVILIAN_TO_SOVEREIGN: Record<string, string> = {
  "journaling": "After-Action Report (AAR)",
  "habit tracker": "Tactical Protocol",
  "motivation": "Momentum / Discipline",
  "goals": "Objectives",
  "routine": "The Rig",
  "failed": "Data Point",
  "wellness": "Performance Readiness",
  "user": "Operator"
};

export const applySavageFilter = (input: string) => {
  const words = Object.keys(CIVILIAN_TO_SOVEREIGN);
  const found = words.find(w => input.toLowerCase().includes(w));

  if (found) {
    return {
      status: "LINGUISTIC_ERROR",
      correction: `Correction: We use '${CIVILIAN_TO_SOVEREIGN[found]}' here. Civilian terminology is a friction point. Re-submit your report.`
    };
  }
  return null; // Passed
};
