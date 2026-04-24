/**
 * Pure microchip number format validator.
 * Recognises ISO 11784/11785 (15-digit), AVID 9/10-digit, FECAVA 10/15-digit,
 * Trovan/Destron 10-digit, and a few common legacy formats.
 *
 * No I/O, no side effects — safe to unit test.
 */

export type ChipFormat =
  | "ISO_15"
  | "AVID_9"
  | "AVID_10"
  | "TROVAN_10"
  | "DESTRON_10"
  | "FECAVA_10"
  | "LEGACY_HEX"
  | "UNKNOWN";

export interface ValidationResult {
  isValid: boolean;
  format: ChipFormat;
  formatName: string;
  isLegacy: boolean;
  cleaned: string;
  formatted: string;
  errorMessage?: string;
}

/** Normalise: strip whitespace/dashes, uppercase. */
export function cleanChipInput(raw: string): string {
  return (raw || "").replace(/[\s\-_]/g, "").toUpperCase();
}

/** Pretty-print an ISO chip as 3-3-3-3-3 groups; others as raw. */
export function formatChipNumber(cleaned: string, format: ChipFormat): string {
  if (format === "ISO_15" && cleaned.length === 15) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9, 12)} ${cleaned.slice(12, 15)}`;
  }
  return cleaned;
}

/**
 * Validate a chip number.
 * Returns format details + a friendly error message when invalid.
 */
export function validateMicrochip(input: string): ValidationResult {
  const cleaned = cleanChipInput(input);

  const baseInvalid = (msg: string): ValidationResult => ({
    isValid: false,
    format: "UNKNOWN",
    formatName: "Unknown",
    isLegacy: false,
    cleaned,
    formatted: cleaned,
    errorMessage: msg,
  });

  if (cleaned.length === 0) return baseInvalid("Enter a chip number");
  if (cleaned.length < 9) return baseInvalid("Too short — chip numbers are 9 to 15 characters");
  if (cleaned.length > 15) return baseInvalid("Too long — chip numbers are 9 to 15 characters");

  const isAllDigits = /^\d+$/.test(cleaned);
  const isHex = /^[0-9A-F]+$/.test(cleaned);

  // ISO 11784/11785 — exactly 15 digits
  if (isAllDigits && cleaned.length === 15) {
    return {
      isValid: true,
      format: "ISO_15",
      formatName: "ISO 11784/11785 (15-digit)",
      isLegacy: false,
      cleaned,
      formatted: formatChipNumber(cleaned, "ISO_15"),
    };
  }

  // AVID 9-digit (legacy)
  if (isAllDigits && cleaned.length === 9) {
    return {
      isValid: true,
      format: "AVID_9",
      formatName: "AVID (9-digit, legacy)",
      isLegacy: true,
      cleaned,
      formatted: cleaned,
    };
  }

  // AVID encrypted 10-digit (legacy)
  if (isAllDigits && cleaned.length === 10) {
    return {
      isValid: true,
      format: "AVID_10",
      formatName: "AVID Encrypted (10-digit, legacy)",
      isLegacy: true,
      cleaned,
      formatted: cleaned,
    };
  }

  // FECAVA / Trovan / Destron — 10 hex chars containing letters
  if (isHex && !isAllDigits && cleaned.length === 10) {
    return {
      isValid: true,
      format: "FECAVA_10",
      formatName: "FECAVA / Trovan (10-character hex, legacy)",
      isLegacy: true,
      cleaned,
      formatted: cleaned,
    };
  }

  // Legacy hex 9–14 chars
  if (isHex && cleaned.length >= 9 && cleaned.length <= 14) {
    return {
      isValid: true,
      format: "LEGACY_HEX",
      formatName: "Legacy hex chip",
      isLegacy: true,
      cleaned,
      formatted: cleaned,
    };
  }

  return baseInvalid("Unknown format — chip should be 9–15 digits or hex characters");
}
