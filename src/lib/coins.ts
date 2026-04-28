import { supabase } from "@/integrations/supabase/client";

/**
 * Sauras-Coins gamification is currently DISABLED.
 * Flip this to `true` to re-enable client-side coin awards, animations,
 * and the daily-login bonus. Backend tables/triggers remain intact.
 */
export const COINS_ENABLED = false;

export type CoinReason =
  | "post_created"
  | "comment_added"
  | "weight_logged"
  | "food_logged"
  | "vaccination_uploaded"
  | "vet_bill_uploaded"
  | "profile_complete"
  | "daily_login";

const AMOUNTS: Record<CoinReason, number> = {
  post_created: 10,
  comment_added: 2,
  weight_logged: 5,
  food_logged: 5,
  vaccination_uploaded: 20,
  vet_bill_uploaded: 10,
  profile_complete: 50,
  daily_login: 3,
};

/** Award coins client-side for simple actions. Server-side triggers handle milestones. */
export async function awardCoins(reason: CoinReason, opts?: { silent?: boolean }) {
  if (!COINS_ENABLED) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const amount = AMOUNTS[reason];
  if (!amount) return null;

  // Upsert balance
  const { data: existing } = await supabase
    .from("sauras_coins")
    .select("coins, total_earned")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("sauras_coins")
      .update({
        coins: (existing.coins || 0) + amount,
        total_earned: (existing.total_earned || 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);
  } else {
    await supabase.from("sauras_coins").insert({
      user_id: user.id,
      coins: amount,
      total_earned: amount,
    });
  }

  await supabase.from("coin_transactions").insert({
    user_id: user.id,
    amount,
    reason,
  });

  if (!opts?.silent) showCoinAnimation(amount);
  return amount;
}

/** Floating "+N 🪙" animation injected at top of viewport */
export function showCoinAnimation(amount: number) {
  if (typeof document === "undefined") return;
  const el = document.createElement("div");
  el.textContent = `+${amount} 🪙`;
  el.setAttribute(
    "style",
    "position:fixed;top:30%;left:50%;transform:translateX(-50%);z-index:9999;font-family:'Cormorant Garamond',serif;font-weight:900;font-size:32px;color:#7B5EA7;text-shadow:0 2px 8px rgba(27,42,74,0.3);pointer-events:none;animation:coinPop 1.5s ease-out forwards;",
  );
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

export async function getCoinBalance(userId: string): Promise<number> {
  const { data } = await supabase
    .from("sauras_coins")
    .select("coins")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.coins || 0;
}

/** Daily login award — at most once per day per user (tracked in localStorage). */
export async function maybeAwardDailyLogin() {
  if (!COINS_ENABLED) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const key = `lastDailyLogin:${user.id}`;
  const last = localStorage.getItem(key);
  const today = new Date().toDateString();
  if (last === today) return;
  localStorage.setItem(key, today);
  await awardCoins("daily_login", { silent: true });
}
