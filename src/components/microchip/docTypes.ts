export const DOC_TYPES = [
  { value: "implant_certificate", label: "Microchip implant certificate" },
  { value: "gcc_chennai", label: "GCC Chennai pet license" },
  { value: "bbmp", label: "BBMP pet registration" },
  { value: "mcd_delhi", label: "MCD Delhi pet registration" },
  { value: "other_municipal", label: "Other municipal registration" },
  { value: "kci", label: "KCI certificate" },
  { value: "vet_letter", label: "Vet clinic letter" },
  { value: "other", label: "Other official document" },
] as const;

export type DocTypeValue = (typeof DOC_TYPES)[number]["value"];

export const docTypeLabel = (value?: string | null) =>
  DOC_TYPES.find((d) => d.value === value)?.label || value || "Document";
