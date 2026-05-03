/**
 * Generate descriptive, SEO-friendly alt text for pet imagery.
 * Falls back gracefully when metadata is missing.
 */
export const petImageAlt = (opts: {
  petType?: string | null;
  breed?: string | null;
  context?: "post" | "avatar" | "story" | "guide";
  ownerName?: string | null;
}) => {
  const subject = [opts.breed, opts.petType].filter(Boolean).join(" ") || "pet";
  const ctx =
    opts.context === "avatar"
      ? `Profile photo of a ${subject}`
      : opts.context === "story"
      ? `Story photo of a ${subject}`
      : opts.context === "guide"
      ? `Guide image of a ${subject}`
      : `Photo of a ${subject}`;
  const by = opts.ownerName ? ` shared by ${opts.ownerName}` : " shared by a pet parent";
  return `${ctx}${by} on Petosauras`;
};
