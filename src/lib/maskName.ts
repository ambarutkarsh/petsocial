export const maskName = (fullName?: string | null): string => {
  if (!fullName) return "Pet Parent";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const first = parts[0];
  const last = parts[parts.length - 1];
  const lastMasked = last[0] + "*".repeat(Math.max(3, last.length - 1));
  return `${first} ${lastMasked}`;
};

export const maskUsername = (username?: string | null): string => {
  if (!username) return "@user";
  return "@" + username.substring(0, 3) + "***";
};
