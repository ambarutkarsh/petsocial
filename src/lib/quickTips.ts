import tips from "@/data/petQuickTips.json";

export interface QuickTip {
  id: string;
  category: string;
  tip: string;
}

const STORAGE_KEY = "quick_tip_state_v1";

interface TipState {
  date: string; // YYYY-MM-DD
  ids: string[];
  previousIds: string[];
}

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const seededShuffle = (arr: QuickTip[], seed: number): QuickTip[] => {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const dateSeed = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
};

export const getDailyQuickTips = (count = 3): QuickTip[] => {
  const all = tips as QuickTip[];
  const today = todayStr();

  let state: TipState | null = null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
  } catch {}

  if (state && state.date === today && state.ids?.length) {
    const found = state.ids.map((id) => all.find((t) => t.id === id)).filter(Boolean) as QuickTip[];
    if (found.length === count) return found;
  }

  const previousIds = state?.ids || [];
  const pool = all.filter((t) => !previousIds.includes(t.id));
  const candidates = pool.length >= count ? pool : all;
  const shuffled = seededShuffle(candidates, dateSeed(today));
  const picked = shuffled.slice(0, count);

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, ids: picked.map((t) => t.id), previousIds } as TipState)
    );
  } catch {}

  return picked;
};
