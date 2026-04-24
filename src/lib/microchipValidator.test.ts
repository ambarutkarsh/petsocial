import { describe, expect, it } from "vitest";
import { cleanChipInput, formatChipNumber, validateMicrochip } from "./microchipValidator";

describe("cleanChipInput", () => {
  it("removes spaces, dashes, underscores and uppercases", () => {
    expect(cleanChipInput("900-215 001_234567")).toBe("900215001234567");
    expect(cleanChipInput(" abc-def123 ")).toBe("ABCDEF123");
  });
});

describe("validateMicrochip", () => {
  it("accepts ISO 15-digit chips", () => {
    const r = validateMicrochip("900215001234567");
    expect(r.isValid).toBe(true);
    expect(r.format).toBe("ISO_15");
    expect(r.isLegacy).toBe(false);
  });

  it("flags AVID 9-digit as legacy", () => {
    const r = validateMicrochip("123456789");
    expect(r.isValid).toBe(true);
    expect(r.format).toBe("AVID_9");
    expect(r.isLegacy).toBe(true);
  });

  it("flags FECAVA hex 10-char as legacy", () => {
    const r = validateMicrochip("00ABCD1234");
    expect(r.isValid).toBe(true);
    expect(r.format).toBe("FECAVA_10");
    expect(r.isLegacy).toBe(true);
  });

  it("rejects too short", () => {
    expect(validateMicrochip("123").isValid).toBe(false);
  });

  it("rejects too long", () => {
    expect(validateMicrochip("1234567890123456").isValid).toBe(false);
  });

  it("rejects junk characters", () => {
    expect(validateMicrochip("ZZZZZZZZZZ!!").isValid).toBe(false);
  });
});

describe("formatChipNumber", () => {
  it("groups ISO chips into 3-3-3-3-3", () => {
    expect(formatChipNumber("900215001234567", "ISO_15")).toBe("900 215 001 234 567");
  });
  it("leaves non-ISO formats untouched", () => {
    expect(formatChipNumber("ABCD1234", "LEGACY_HEX")).toBe("ABCD1234");
  });
});
