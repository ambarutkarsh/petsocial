/**
 * Pet Recommender — pure matching logic.
 *
 * All functions are side-effect-free and unit-testable. Data comes from
 * /src/data/intent-taxonomy.json and /src/data/breed-database.json — never
 * hardcode breed/intent data here.
 */
import Fuse from "fuse.js";
import taxonomyJson from "@/data/intent-taxonomy.json";
import breedJson from "@/data/breed-database.json";

// ---------- Types ----------

export type Tier = "tier1" | "tier2" | "tier3";

export interface Intent {
  id: string;
  label: string;
  keywords: string[];
  primaryCategory: string;
  subCategoryTags: string[];
  weight: number;
}

export interface CategoryMeta {
  label: string;
  icon: string;
}

export interface Taxonomy {
  intents: Intent[];
  categories: Record<string, CategoryMeta>;
  matchingRules: {
    strategy: string;
    fuzzyThreshold: number;
    minKeywordsForMatch: number;
    tieBreaker: string;
    fallbackCategory: string;
  };
}

export interface BreedAttributes {
  spaceNeed: number;
  energyLevel: number;
  groomingNeed: number;
  noiseLevel: number;
  trainability: number;
  climateTolerance: number;
  kidFriendliness: number;
  firstTimeOwnerFriendly: number;
  guardingAbility: number;
  independence: number;
}

export type AttributeKey = keyof BreedAttributes;

export const ATTRIBUTE_KEYS: AttributeKey[] = [
  "spaceNeed",
  "energyLevel",
  "groomingNeed",
  "noiseLevel",
  "trainability",
  "climateTolerance",
  "kidFriendliness",
  "firstTimeOwnerFriendly",
  "guardingAbility",
  "independence",
];

export interface CostRange {
  tier1: [number, number];
  tier2: [number, number];
  tier3: [number, number];
}

export interface BreedCosts {
  purchase: CostRange;
  monthlyFood: CostRange;
  monthlyGrooming: [number, number];
  monthlyVetAverage: [number, number];
  oneTimeSetup: [number, number];
  annualVaccination: [number, number];
}

export interface SuitabilityFlags {
  apartmentFriendly?: boolean;
  hotClimateOk?: boolean;
  noviceFriendly?: boolean;
  goodWithKids?: boolean;
  goodWithOtherPets?: boolean;
  adoptionRecommended?: boolean;
}

export interface Breed {
  id: string;
  name: string;
  category: string;
  subCategoryTags: string[];
  attributes: BreedAttributes;
  lifeExpectancyYears: string;
  adultWeightKg: string;
  costs: BreedCosts;
  suitabilityFlags: SuitabilityFlags;
}

export interface BreedDatabase {
  breeds: Breed[];
  pinCodeToTier: {
    strategy: string;
    description: string;
    sampleMap: Record<string, { city: string; tier: Tier }>;
  };
}

export const taxonomy: Taxonomy = taxonomyJson as unknown as Taxonomy;
export const database: BreedDatabase = breedJson as unknown as BreedDatabase;

// ---------- Lifestyle answer types ----------

export type HomeType = "apartment" | "house_yard" | "farmhouse";
export type AloneHours = "0-2" | "3-5" | "6-8" | "9+";
export type Climate = "hot_humid" | "hot_dry" | "moderate" | "cool";
export type Experience = "first_time" | "had_before" | "experienced";
export type Household =
  | "just_me"
  | "couple"
  | "family_young_kids"
  | "family_teens"
  | "multi_gen";
export type Activity = "sedentary" | "moderate" | "active" | "very_active";

export interface LifestyleAnswers {
  homeType: HomeType;
  aloneHours: AloneHours;
  climate: Climate;
  experience: Experience;
  household: Household;
  activity: Activity;
}

// ---------- Intent matching ----------

export interface IntentMatchResult {
  intentId: string | null;
  primaryCategory: string;
  subCategoryTags: string[];
  confidence: number; // 0..1
}

/**
 * Fuzzy-match user free-text against intent keyword arrays. We score each
 * intent by the best (lowest) Fuse score across its keywords, weighted by
 * the intent's `weight`. Falls back to taxonomy.matchingRules.fallbackCategory.
 */
export function matchIntent(
  userText: string,
  tax: Taxonomy = taxonomy
): IntentMatchResult {
  const text = (userText ?? "").trim().toLowerCase();
  if (!text) {
    return {
      intentId: null,
      primaryCategory: tax.matchingRules.fallbackCategory,
      subCategoryTags: [],
      confidence: 0,
    };
  }

  let best: { intent: Intent; score: number } | null = null;

  for (const intent of tax.intents) {
    // Each keyword is a discrete searchable record.
    const fuse = new Fuse(intent.keywords, {
      threshold: tax.matchingRules.fuzzyThreshold,
      includeScore: true,
      ignoreLocation: true,
    });
    const hits = fuse.search(text);
    if (hits.length === 0) continue;

    // Lower fuse score = better match. Combine with weight.
    const rawScore = hits[0].score ?? 1;
    const weighted = (1 - rawScore) * intent.weight;

    if (!best || weighted > (1 - best.score) * best.intent.weight) {
      best = { intent, score: rawScore };
    }
  }

  if (!best) {
    return {
      intentId: null,
      primaryCategory: tax.matchingRules.fallbackCategory,
      subCategoryTags: [],
      confidence: 0,
    };
  }

  return {
    intentId: best.intent.id,
    primaryCategory: best.intent.primaryCategory,
    subCategoryTags: best.intent.subCategoryTags,
    confidence: Math.max(0, Math.min(1, (1 - best.score) * best.intent.weight)),
  };
}

// ---------- PIN → Tier ----------

export interface TierResult {
  city: string;
  tier: Tier;
}

export function getTierFromPin(
  pin: string,
  pinMap: BreedDatabase["pinCodeToTier"] = database.pinCodeToTier
): TierResult {
  const clean = (pin ?? "").replace(/\D/g, "");
  if (clean.length < 3) return { city: "Unknown", tier: "tier2" };
  const prefix = clean.slice(0, 3);
  const hit = pinMap.sampleMap[prefix];
  if (hit) return { city: hit.city, tier: hit.tier };
  return { city: "Unknown", tier: "tier2" };
}

// ---------- User preference vector ----------

/**
 * Map lifestyle answers to a 10-dim vector aligned with breed attributes.
 * Each value is on the same 1–10 scale as breed attributes — the score is
 * the *desired* level for each attribute.
 */
export function buildUserPreferenceVector(
  a: LifestyleAnswers
): BreedAttributes {
  // spaceNeed: how much space the pet needs ↔ how much space user has
  const spaceNeed =
    a.homeType === "apartment" ? 3 : a.homeType === "house_yard" ? 7 : 10;

  // independence: how independent the pet should be ↔ alone hours
  const independence =
    a.aloneHours === "0-2"
      ? 3
      : a.aloneHours === "3-5"
      ? 5
      : a.aloneHours === "6-8"
      ? 8
      : 10;

  // climateTolerance: heat tolerance preferred for hot climates
  const climateTolerance =
    a.climate === "hot_humid" || a.climate === "hot_dry"
      ? 9
      : a.climate === "moderate"
      ? 6
      : 4;

  // firstTimeOwnerFriendly: high for novices, lower for experienced
  const firstTimeOwnerFriendly =
    a.experience === "first_time"
      ? 9
      : a.experience === "had_before"
      ? 6
      : 3;

  // kidFriendliness
  const kidFriendliness =
    a.household === "family_young_kids"
      ? 10
      : a.household === "family_teens" || a.household === "multi_gen"
      ? 8
      : a.household === "couple"
      ? 5
      : 4;

  // energyLevel: matches user's activity
  const energyLevel =
    a.activity === "sedentary"
      ? 3
      : a.activity === "moderate"
      ? 5
      : a.activity === "active"
      ? 8
      : 10;

  // trainability: preferred high if first-time or family with kids
  const trainability =
    a.experience === "first_time" ? 8 : a.household === "family_young_kids" ? 7 : 5;

  // groomingNeed: most users prefer lower grooming; low value preferred
  const groomingNeed = 3;

  // noiseLevel: apartment dwellers and multi-gen prefer quieter pets
  const noiseLevel =
    a.homeType === "apartment" || a.household === "multi_gen" ? 3 : 5;

  // guardingAbility: drives via intent (not lifestyle); neutral default
  const guardingAbility = 5;

  return {
    spaceNeed,
    energyLevel,
    groomingNeed,
    noiseLevel,
    trainability,
    climateTolerance,
    kidFriendliness,
    firstTimeOwnerFriendly,
    guardingAbility,
    independence,
  };
}

// ---------- Hard filters ----------

export interface HardFilters {
  apartment: boolean;
  hotClimate: boolean;
  firstTimer: boolean;
}

export function deriveHardFilters(a: LifestyleAnswers): HardFilters {
  return {
    apartment: a.homeType === "apartment",
    hotClimate: a.climate === "hot_humid" || a.climate === "hot_dry",
    firstTimer: a.experience === "first_time",
  };
}

// ---------- Scoring ----------

export interface ScoredBreed {
  breed: Breed;
  score: number; // 0..100, higher = better
  reasons: string[]; // 2–3 "why this fits you" bullets
}

const ATTRIBUTE_LABELS: Record<AttributeKey, string> = {
  spaceNeed: "space needs",
  energyLevel: "energy level",
  groomingNeed: "grooming needs",
  noiseLevel: "noise level",
  trainability: "trainability",
  climateTolerance: "climate tolerance",
  kidFriendliness: "kid-friendliness",
  firstTimeOwnerFriendly: "beginner-friendliness",
  guardingAbility: "guarding ability",
  independence: "independence when alone",
};

/**
 * Score breeds by closeness of attribute vector to user preference vector
 * (weighted Manhattan distance, normalized to 0–100). Filter by category +
 * hard filters. Returns sorted descending by score.
 */
export function scoreBreeds(
  breeds: Breed[],
  category: string,
  preferenceVector: BreedAttributes,
  hardFilters: HardFilters,
  intentTags: string[] = []
): ScoredBreed[] {
  // 1. Category filter ("any" means no filter)
  let pool =
    category === "any"
      ? [...breeds]
      : breeds.filter((b) => b.category === category);

  // Special handling for "small_mammal_or_fish" (starter pets)
  if (category === "small_mammal_or_fish") {
    pool = breeds.filter(
      (b) => b.category === "small_mammal" || b.category === "aquatic"
    );
  }

  // Special handling for "aquatic_exotic"
  if (category === "aquatic_exotic") {
    pool = breeds.filter(
      (b) => b.category === "aquatic" || b.subCategoryTags.includes("display")
    );
  }

  if (pool.length === 0) pool = [...breeds];

  // 2. Apply hard filters but relax if it leaves <3 breeds
  const apply = (preds: Array<(b: Breed) => boolean>): Breed[] =>
    preds.reduce((acc, p) => acc.filter(p), pool);

  const filters: Array<(b: Breed) => boolean> = [];
  if (hardFilters.apartment) {
    filters.push((b) => b.suitabilityFlags.apartmentFriendly !== false);
  }
  if (hardFilters.hotClimate) {
    filters.push((b) => b.suitabilityFlags.hotClimateOk !== false);
  }

  let filtered = apply(filters);

  if (hardFilters.firstTimer) {
    const withNovice = filtered.filter(
      (b) => b.suitabilityFlags.noviceFriendly !== false
    );
    if (withNovice.length >= 3) filtered = withNovice;
  }

  if (filtered.length < 3) {
    // Relax: keep category filter but drop hard filters
    filtered = pool;
  }

  // 3. Score by attribute closeness
  // Weights — emphasize the attributes the user actually expressed via
  // lifestyle (we boost matching axes).
  const weights: Record<AttributeKey, number> = {
    spaceNeed: 1.2,
    energyLevel: 1.2,
    groomingNeed: 0.8,
    noiseLevel: 1.0,
    trainability: 0.9,
    climateTolerance: 1.1,
    kidFriendliness: 1.1,
    firstTimeOwnerFriendly: 1.2,
    guardingAbility: intentTags.includes("guarding") ? 2.0 : 0.5,
    independence: 1.1,
  };

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  // Max distance per attribute = 9 (range 1..10)
  const maxDistance = 9 * totalWeight;

  const scored: ScoredBreed[] = filtered.map((breed) => {
    let distance = 0;
    const closeAttrs: Array<{ key: AttributeKey; gap: number }> = [];

    for (const k of ATTRIBUTE_KEYS) {
      const gap = Math.abs(preferenceVector[k] - breed.attributes[k]);
      distance += gap * weights[k];
      closeAttrs.push({ key: k, gap });
    }

    // Tag-based boost: if the breed has a sub-category tag matching the
    // intent tags, give a small bonus (max 10% of remaining headroom).
    const tagOverlap = breed.subCategoryTags.filter((t) =>
      intentTags.includes(t)
    ).length;
    const tagBoost = Math.min(0.1, tagOverlap * 0.04);

    let normalized = 1 - distance / maxDistance; // 0..1
    normalized = Math.max(0, Math.min(1, normalized + tagBoost));
    const score = Math.round(normalized * 100);

    // Build reasons from the 3 closest attribute matches
    closeAttrs.sort((a, b) => a.gap - b.gap);
    const top = closeAttrs.slice(0, 3);
    const reasons: string[] = top.map((a) => {
      const label = ATTRIBUTE_LABELS[a.key];
      const v = breed.attributes[a.key];
      return v >= 7
        ? `Strong ${label} (${v}/10) matches your needs`
        : v <= 3
        ? `Low ${label} (${v}/10) matches your needs`
        : `Balanced ${label} (${v}/10) for your lifestyle`;
    });

    return { breed, score, reasons };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ---------- Cost / budget ----------

export interface BreedCostBreakdown {
  purchaseLow: number;
  purchaseHigh: number;
  monthlyLow: number;
  monthlyHigh: number;
  monthlyMid: number;
  firstYearLow: number;
  firstYearHigh: number;
  firstYearMid: number;
}

const mid = (range: [number, number]) => (range[0] + range[1]) / 2;

export function computeCosts(
  breed: Breed,
  tier: Tier
): BreedCostBreakdown {
  const purchase = breed.costs.purchase[tier];
  const food = breed.costs.monthlyFood[tier];
  const grooming = breed.costs.monthlyGrooming;
  const vet = breed.costs.monthlyVetAverage;
  const setup = breed.costs.oneTimeSetup;
  const vacc = breed.costs.annualVaccination;

  const monthlyLow = food[0] + grooming[0] + vet[0];
  const monthlyHigh = food[1] + grooming[1] + vet[1];
  const monthlyMid = (monthlyLow + monthlyHigh) / 2;

  const firstYearLow = purchase[0] + setup[0] + monthlyLow * 12 + vacc[0];
  const firstYearHigh = purchase[1] + setup[1] + monthlyHigh * 12 + vacc[1];
  const firstYearMid = (firstYearLow + firstYearHigh) / 2;

  return {
    purchaseLow: purchase[0],
    purchaseHigh: purchase[1],
    monthlyLow,
    monthlyHigh,
    monthlyMid: Math.round(monthlyMid),
    firstYearLow: Math.round(firstYearLow),
    firstYearHigh: Math.round(firstYearHigh),
    firstYearMid: Math.round(firstYearMid),
  };
}

export interface BudgetFilteredBreed extends ScoredBreed {
  costs: BreedCostBreakdown;
  overBudget: boolean; // true if "slightly over budget"
}

/**
 * Drop breeds that exceed monthly OR upfront budget by >20%. If that leaves
 * <3 breeds, keep the closest-to-budget ones and flag them as overBudget.
 */
export function filterByBudget(
  rankedBreeds: ScoredBreed[],
  tier: Tier,
  monthlyBudget: number,
  upfrontBudget: number
): BudgetFilteredBreed[] {
  const overage = 1.2;

  const enriched = rankedBreeds.map<BudgetFilteredBreed>((sb) => {
    const costs = computeCosts(sb.breed, tier);
    const upfront = costs.purchaseLow + sb.breed.costs.oneTimeSetup[0];
    const monthlyOver = costs.monthlyMid > monthlyBudget * overage;
    const upfrontOver = upfront > upfrontBudget * overage;
    return { ...sb, costs, overBudget: monthlyOver || upfrontOver };
  });

  const inBudget = enriched.filter((b) => !b.overBudget);
  if (inBudget.length >= 3) return inBudget;

  // Need to backfill with closest-to-budget (flagged) entries
  const overs = enriched
    .filter((b) => b.overBudget)
    .sort((a, b) => {
      const aOver = Math.max(0, a.costs.monthlyMid - monthlyBudget);
      const bOver = Math.max(0, b.costs.monthlyMid - monthlyBudget);
      return aOver - bOver;
    });

  const result: BudgetFilteredBreed[] = [...inBudget];
  for (const o of overs) {
    if (result.length >= 3) break;
    result.push(o);
  }
  return result;
}

// ---------- End-to-end convenience ----------

export interface RecommendationInput {
  intentText: string;
  lifestyle: LifestyleAnswers;
  pin: string;
  monthlyBudget: number;
  upfrontBudget: number;
}

export interface RecommendationResult {
  intent: IntentMatchResult;
  tier: TierResult;
  topBreeds: BudgetFilteredBreed[];
  limitedMatches: boolean;
}

export function recommend(
  input: RecommendationInput
): RecommendationResult {
  const intent = matchIntent(input.intentText);
  const tier = getTierFromPin(input.pin);
  const prefs = buildUserPreferenceVector(input.lifestyle);
  const filters = deriveHardFilters(input.lifestyle);
  const ranked = scoreBreeds(
    database.breeds,
    intent.primaryCategory,
    prefs,
    filters,
    intent.subCategoryTags
  );
  const final = filterByBudget(
    ranked,
    tier.tier,
    input.monthlyBudget,
    input.upfrontBudget
  );
  const top = final.slice(0, 3);
  return {
    intent,
    tier,
    topBreeds: top,
    limitedMatches: top.length < 3,
  };
}
