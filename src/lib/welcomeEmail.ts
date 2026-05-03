import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/analytics";

/** Fire-and-forget welcome email. Never blocks or surfaces errors to the user. */
export const sendWelcomeEmail = async (userId: string | undefined | null) => {
  if (!userId) return;
  try {
    trackEvent?.("welcome_email_triggered");
    const { data, error } = await supabase.functions.invoke("send-welcome-email", {
      body: { user_id: userId },
    });
    if (error) {
      console.warn("Welcome email failed", error);
      trackEvent?.("welcome_email_failed");
      return;
    }
    if ((data as any)?.skipped === "already_sent") {
      trackEvent?.("welcome_email_skipped_already_sent");
    } else if ((data as any)?.sent) {
      trackEvent?.("welcome_email_sent");
    }
  } catch (e) {
    console.warn("Welcome email failed", e);
    trackEvent?.("welcome_email_failed");
  }
};
