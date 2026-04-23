import { describe, it, expect } from "vitest";
import {
  matchIntent,
  getTierFromPin,
  buildUserPreferenceVector,
  scoreBreeds,
  filterByBudget,
  computeCosts,
  database,
  recommend,
  type LifestyleAnswers,
} from "./petMatcher";

const baseLifestyle: LifestyleAnswers = {
  homeType: "house_yard",
  aloneHours: "3-5",
  climate: "moderate",
  experience: "had_before",
  household: "family_young_kids",
  activity: "active",
};

describe("matchIntent", () => {
  it("routes 'protect my house' to canine + guarding", () => {
    const r = matchIntent("I want to protect my house");
    expect(r.primaryCategory).toBe("canine");
    expect(r.subCategoryTags).toContain("guarding");
  });

  it("routes 'something beautiful for my living room' to aquatic_exotic/display", () => {
    const r = matchIntent("something beautiful for my living room");
    // Could match aesthetic_display (aquatic_exotic) or any display intent
    expect(["aquatic_exotic", "any"]).toContain(r.primaryCategory);
  });

  it("falls back to 'any' for empty input", () => {
    const r = matchIntent("");
    expect(r.primaryCategory).toBe("any");
    expect(r.intentId).toBeNull();
  });

  it("falls back to 'any' for nonsense input", () => {
    const r = matchIntent("zxcvbnm qwerty");
    expect(r.primaryCategory).toBe("any");
  });
});

describe("getTierFromPin", () => {
  it("resolves Chennai metro from 600028", () => {
    const r = getTierFromPin("600028");
    expect(r.city).toBe("Chennai");
    expect(r.tier).toBe("tier1");
  });

  it("resolves Hyderabad metro from 500001", () => {
    const r = getTierFromPin("500001");
    expect(r.city).toBe("Hyderabad");
    expect(r.tier).toBe("tier1");
  });

  it("defaults to tier2 for unknown pins", () => {
    const r = getTierFromPin("999999");
    expect(r.tier).toBe("tier2");
  });

  it("handles short / non-numeric input", () => {
    expect(getTierFromPin("12").tier).toBe("tier2");
    expect(getTierFromPin("abc").tier).toBe("tier2");
  });
});

describe("buildUserPreferenceVector", () => {
  it("apartment dwellers prefer low spaceNeed", () => {
    const v = buildUserPreferenceVector({ ...baseLifestyle, homeType: "apartment" });
    expect(v.spaceNeed).toBeLessThanOrEqual(4);
  });

  it("9+ alone hours pushes high independence preference", () => {
    const v = buildUserPreferenceVector({ ...baseLifestyle, aloneHours: "9+" });
    expect(v.independence).toBeGreaterThanOrEqual(9);
  });

  it("first-time owners get high firstTimeOwnerFriendly preference", () => {
    const v = buildUserPreferenceVector({ ...baseLifestyle, experience: "first_time" });
    expect(v.firstTimeOwnerFriendly).toBeGreaterThanOrEqual(8);
  });

  it("very-active users prefer high energyLevel", () => {
    const v = buildUserPreferenceVector({ ...baseLifestyle, activity: "very_active" });
    expect(v.energyLevel).toBeGreaterThanOrEqual(9);
  });
});

describe("scoreBreeds", () => {
  it("filters by category", () => {
    const prefs = buildUserPreferenceVector(baseLifestyle);
    const scored = scoreBreeds(database.breeds, "feline", prefs, {
      apartment: false,
      hotClimate: false,
      firstTimer: false,
    });
    expect(scored.every((s) => s.breed.category === "feline")).toBe(true);
  });

  it("returns scores between 0 and 100", () => {
    const prefs = buildUserPreferenceVector(baseLifestyle);
    const scored = scoreBreeds(database.breeds, "any", prefs, {
      apartment: false,
      hotClimate: false,
      firstTimer: false,
    });
    for (const s of scored) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
    }
  });

  it("guarding intent surfaces German Shepherd or Indian Pariah at the top for typical users", () => {
    const prefs = buildUserPreferenceVector({
      ...baseLifestyle,
      homeType: "house_yard",
      activity: "active",
    });
    const scored = scoreBreeds(
      database.breeds,
      "canine",
      prefs,
      { apartment: false, hotClimate: false, firstTimer: false },
      ["guarding", "working", "protective"]
    );
    const topIds = scored.slice(0, 3).map((s) => s.breed.id);
    const hasGuard =
      topIds.includes("german_shepherd") || topIds.includes("indian_pariah");
    expect(hasGuard).toBe(true);
  });
});

describe("filterByBudget + computeCosts", () => {
  it("computes cost breakdown using tier-specific costs", () => {
    const beagle = database.breeds.find((b) => b.id === "beagle")!;
    const t1 = computeCosts(beagle, "tier1");
    const t3 = computeCosts(beagle, "tier3");
    expect(t1.purchaseHigh).toBeGreaterThan(t3.purchaseHigh);
  });

  it("flags breeds as overBudget when monthly cost exceeds budget by >20%", () => {
    const prefs = buildUserPreferenceVector(baseLifestyle);
    const ranked = scoreBreeds(
      database.breeds,
      "canine",
      prefs,
      { apartment: false, hotClimate: false, firstTimer: false },
      ["guarding"]
    );
    const result = filterByBudget(ranked, "tier1", 1500, 30000);
    // With ₹1500/month, expensive breeds like German Shepherd should be flagged
    const gs = result.find((b) => b.breed.id === "german_shepherd");
    if (gs) expect(gs.overBudget).toBe(true);
  });

  it("returns at least 1 breed even with very tight budget", () => {
    const prefs = buildUserPreferenceVector(baseLifestyle);
    const ranked = scoreBreeds(database.breeds, "any", prefs, {
      apartment: false,
      hotClimate: false,
      firstTimer: false,
    });
    const result = filterByBudget(ranked, "tier1", 100, 1000);
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("recommend (end-to-end)", () => {
  it("guard-house intent surfaces a guarding breed", () => {
    const r = recommend({
      intentText: "I want to protect my house",
      lifestyle: {
        ...baseLifestyle,
        homeType: "house_yard",
        activity: "active",
      },
      pin: "600028",
      monthlyBudget: 6000,
      upfrontBudget: 50000,
    });
    expect(r.intent.primaryCategory).toBe("canine");
    expect(r.tier.city).toBe("Chennai");
    const topIds = r.topBreeds.map((b) => b.breed.id);
    expect(
      topIds.includes("german_shepherd") || topIds.includes("indian_pariah")
    ).toBe(true);
  });

  it("display intent surfaces aquatic options", () => {
    const r = recommend({
      intentText: "something beautiful for my living room",
      lifestyle: { ...baseLifestyle, homeType: "apartment", activity: "sedentary" },
      pin: "560001",
      monthlyBudget: 3000,
      upfrontBudget: 20000,
    });
    const topIds = r.topBreeds.map((b) => b.breed.id);
    const hasAquatic = topIds.some((id) =>
      ["planted_community_tank", "goldfish"].includes(id)
    );
    expect(hasAquatic).toBe(true);
  });
});
