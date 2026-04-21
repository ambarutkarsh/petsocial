import { supabase } from "@/integrations/supabase/client";

/** Best-effort notification insert. Errors are swallowed so they never break the user-facing action. */
export async function createNotification(payload: {
  user_id: string;
  from_user_id?: string | null;
  type: "like" | "comment" | "follow" | "system" | "match";
  title: string;
  body?: string | null;
  post_id?: string | null;
  redirect_url?: string | null;
}) {
  try {
    if (!payload.user_id || payload.user_id === payload.from_user_id) return;
    await supabase.from("notifications").insert({
      user_id: payload.user_id,
      from_user_id: payload.from_user_id ?? null,
      type: payload.type,
      title: payload.title,
      body: payload.body ?? null,
      post_id: payload.post_id ?? null,
      redirect_url: payload.redirect_url ?? null,
      is_read: false,
    });
  } catch {
    /* never throw */
  }
}

/** Helper: fetch the post owner id given a post id. Returns null on failure. */
export async function getPostOwnerId(postId: string): Promise<string | null> {
  const { data } = await supabase.from("posts").select("user_id").eq("id", postId).maybeSingle();
  return (data as any)?.user_id ?? null;
}

/** Helper: get a user's display name from profiles (falls back to "Someone"). */
export async function getActorName(userId: string): Promise<string> {
  const { data } = await supabase.from("profiles").select("full_name, username").eq("id", userId).maybeSingle();
  return (data as any)?.full_name || (data as any)?.username || "Someone";
}
