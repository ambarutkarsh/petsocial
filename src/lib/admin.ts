export const ADMIN_EMAIL = "petosauras@gmail.com";

export const isAdminEmail = (email?: string | null) =>
  !!email && email.toLowerCase() === ADMIN_EMAIL;
