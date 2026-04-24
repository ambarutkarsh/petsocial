// Helper utilities for the Pet Care feature.
// All logic is data-driven from src/data/petcare-data.json — no API calls.

export type AgeBucket = "Baby" | "Young" | "Adult" | "Senior";
export type Weather = "summer" | "monsoon" | "winter";

/** Maps the user-facing age bucket to the JSON ageGroup key for a given pet type. */
export function mapAgeToGroup(petType: string, age: AgeBucket): string {
  if (age === "Baby") {
    if (petType === "Canine") return "puppy";
    if (petType === "Feline") return "kitten";
    return "puppy";
  }
  if (age === "Young" || age === "Adult") return "adult";
  return "senior";
}

/** Returns true when the toxic_to list applies to this pet type. */
export function appliesToPet(toxicTo: string[] | undefined, petType: string): boolean {
  if (!toxicTo || toxicTo.length === 0) return true;
  return toxicTo.includes(petType) || toxicTo.includes("All");
}

export const SEVERITY_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "bg-[hsl(0_85%_96%)]", text: "text-[hsl(0_70%_45%)]", border: "border-l-[hsl(0_70%_55%)]" },
  HIGH:     { bg: "bg-[hsl(20_90%_94%)]", text: "text-[hsl(20_80%_42%)]", border: "border-l-[hsl(20_80%_55%)]" },
  MEDIUM:   { bg: "bg-[hsl(40_95%_92%)]", text: "text-[hsl(35_80%_38%)]", border: "border-l-[hsl(35_80%_55%)]" },
  LOW:      { bg: "bg-muted",             text: "text-muted-foreground",  border: "border-l-border" },
};

export function severityClass(s?: string) {
  return SEVERITY_CLASSES[s ?? "LOW"] ?? SEVERITY_CLASSES.LOW;
}
