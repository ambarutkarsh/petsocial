import config from "@/data/petHealthScoringConfig.json";

export const HEALTH_CONFIG: any = config;

const SCALE: Record<number, { label: string; tone: string }> = {
  1: { label: "Poor", tone: "text-destructive" },
  2: { label: "Below Average", tone: "text-accent" },
  3: { label: "Fair", tone: "text-accent" },
  4: { label: "Good", tone: "text-secondary" },
  5: { label: "Excellent", tone: "text-secondary" },
};

export const SCORE_COLORS: Record<number, string> = {
  1: "bg-destructive/15 text-destructive",
  2: "bg-accent/15 text-accent",
  3: "bg-accent/15 text-accent",
  4: "bg-secondary/15 text-secondary",
  5: "bg-secondary/20 text-secondary",
};

export const SCORE_LABELS = SCALE;

const clamp = (n: number, min = 1, max = 5) => Math.max(min, Math.min(max, n));
const round = (n: number) => clamp(Math.round(n));

const boolTo5 = (v: any) => (v === true ? 5 : v === false ? 1 : 3);
const num = (v: any, fallback = 3) =>
  typeof v === "number" && !isNaN(v) ? v : fallback;

function activityMinutesScore(petType: string, minutes: number, age: number) {
  if (!minutes && minutes !== 0) return 3;
  const refMap: Record<string, [number, number]> = {
    Canine: age >= 8 ? [20, 45] : [45, 90],
    Feline: age >= 8 ? [10, 30] : [20, 45],
    "Small Pet": [15, 60],
    Equine: [60, 180],
    Avian: [30, 120],
    Reptile: [10, 60],
    Aquatic: [30, 240],
    Insect: [5, 60],
    Others: [10, 60],
  };
  const [lo, hi] = refMap[petType] || [20, 60];
  if (minutes >= lo && minutes <= hi) return 5;
  if (minutes >= lo * 0.6 && minutes <= hi * 1.4) return 4;
  if (minutes >= lo * 0.3 && minutes <= hi * 1.8) return 3;
  if (minutes > 0) return 2;
  return 1;
}

function preventiveScore(input: any) {
  const map: Record<string, number> = {
    up_to_date: 5,
    not_applicable: 5,
    due_soon: 4,
    unknown: 3,
    overdue: 1,
  };
  const v = map[input.vaccination_status] ?? 3;
  const d = map[input.deworming_status] ?? 3;
  const recencyBonus =
    typeof input.last_vet_visit_days_ago === "number" && input.last_vet_visit_days_ago < 365 ? 0.5 : 0;
  return clamp(Math.round((v + d) / 2 + recencyBonus));
}

export interface SnapshotResult {
  overall_health_score: number;
  overall_health_label: string;
  overall_health_reason: string;
  body_condition_score: number;
  body_condition_label: string;
  body_condition_reason: string;
  activity_score: number;
  activity_label: string;
  activity_reason: string;
  hydration_score: number;
  hydration_label: string;
  hydration_reason: string;
  recommended_cta: string;
  emergency: boolean;
}

export function calculatePetHealthSnapshot(input: any): SnapshotResult {
  const petType = input.pet_type || "Others";
  const age = num(input.age_years, 3);

  // Body Condition
  const bcsRaw = clamp(num(input.body_condition_score, 3));
  const bcsMap = HEALTH_CONFIG.score_calculation.body_condition.mapping[String(bcsRaw)];
  const body_condition_score = bcsMap?.score ?? 3;
  const body_condition_label = SCALE[body_condition_score].label;
  const body_condition_reason = `Body condition ${bcsRaw}/5 — ${bcsMap?.label || "—"}.`;

  // Activity
  const energy = num(input.energy_level, 3);
  const mobility = num(input.mobility, 3);
  const minScore = activityMinutesScore(petType, num(input.activity_minutes_per_day, 0), age);
  const tolerance = num(
    input.exercise_tolerance ?? input.playfulness ?? input.activity_in_enclosure ?? input.movement_normal ?? input.swimming_normal,
    3,
  );
  const activity_score = round(
    energy * 0.35 + mobility * 0.25 + minScore * 0.25 + tolerance * 0.15,
  );
  const activity_label = SCALE[activity_score].label;
  const activity_reason =
    activity_score >= 4
      ? "Energy, mobility and activity look healthy."
      : activity_score === 3
      ? "Activity is fair — try gentle daily routines."
      : "Low activity / mobility — consider a vet check-up.";

  // Hydration
  const hydrationRule = HEALTH_CONFIG.score_calculation.hydration.rules.find((r: any) =>
    r.pet_types.includes(petType),
  ) || HEALTH_CONFIG.score_calculation.hydration.rules[0];
  const signals: number[] = hydrationRule.signals.map((sig: string) => {
    const v = input[sig];
    if (typeof v === "boolean") return boolTo5(v);
    if (typeof v === "number") return clamp(v);
    return 3;
  });
  const hydration_score = round(signals.reduce((a, b) => a + b, 0) / signals.length);
  const hydration_label = SCALE[hydration_score].label;
  const hydration_reason =
    hydration_score >= 4
      ? "Hydration signals look normal."
      : hydration_score === 3
      ? "Hydration is borderline — monitor water intake."
      : "Hydration concerns detected.";

  // Overall
  const appetite = num(input.appetite, 3);
  const breathing = num(input.breathing, 3);
  const stool = num(input.stool_or_waste_quality, 3);
  const preventive = preventiveScore(input);
  const w = HEALTH_CONFIG.score_calculation.overall_health.weights;
  let overall =
    body_condition_score * w.body_condition_score_transformed +
    activity_score * w.activity_score +
    hydration_score * w.hydration_score +
    appetite * w.appetite +
    breathing * w.breathing +
    stool * w.stool_or_waste_quality +
    preventive * w.preventive_care_status;

  const flags: string[] = Array.isArray(input.medical_flags) ? input.medical_flags : [];
  const penalties = HEALTH_CONFIG.score_calculation.overall_health.red_flag_penalty;
  for (const f of flags) {
    if (penalties[f]) overall += penalties[f];
  }

  const emergencyFlags = ["laboured_breathing", "seizure", "bloating"];
  const emergency = flags.some((f) => emergencyFlags.includes(f));
  let overall_health_score = round(overall);
  if (emergency) overall_health_score = 1;

  const overall_health_label = SCALE[overall_health_score].label;
  const overall_health_reason = emergency
    ? "Emergency symptom reported — consult a vet immediately."
    : overall_health_score >= 4
    ? "Vitals and behavior look normal — keep up the routine."
    : overall_health_score === 3
    ? "Some areas to improve — track weekly."
    : "Multiple concerns — book a vet visit.";

  const recommended_cta = emergency || overall_health_score <= 2
    ? "Book a Vet"
    : overall_health_score === 3
    ? "Track weekly"
    : "Keep tracking weekly";

  return {
    overall_health_score,
    overall_health_label,
    overall_health_reason,
    body_condition_score,
    body_condition_label,
    body_condition_reason,
    activity_score,
    activity_label,
    activity_reason,
    hydration_score,
    hydration_label,
    hydration_reason,
    recommended_cta,
    emergency,
  };
}

export function getPetTypeInputs(petType: string) {
  return HEALTH_CONFIG.pet_type_specific_inputs[petType]?.additional_inputs || [];
}

export function humanizeKey(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
