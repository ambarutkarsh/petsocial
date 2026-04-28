import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { FeedsIcon, VerifiedIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  feature: string;
  headline: string;
  description: string;
  emoji: string;
  bullets?: string[];
}

const ComingSoonHub = ({ feature, headline, description, emoji, bullets }: Props) => {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  const join = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Enter a valid email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("waitlist")
      .insert({ email, feature, user_id: user?.id ?? null });
    setSubmitting(false);
    if (error) {
      toast.error("Could not join waitlist");
      return;
    }
    setJoined(true);
    toast.success("You're on the list! 🎉");
  };

  return (
    <div className="space-y-5">
      <div className="rounded-[22px] bg-gradient-to-br from-primary/10 via-card to-secondary/10 border border-border p-6 text-center shadow-petosauras">
        <div className="w-16 h-16 rounded-full bg-card mx-auto flex items-center justify-center text-4xl shadow-petosauras">
          {emoji}
        </div>
        <h2 className="mt-4 font-heading font-bold text-xl">{headline}</h2>
        <p className="mt-2 text-sm text-muted-foreground font-body">{description}</p>
        <span className="inline-flex items-center gap-1 mt-3 px-3 py-1 rounded-full bg-accent/15 text-accent text-[11px] font-bold">
          <FeedsIcon className="w-3 h-3" /> Coming soon
        </span>
      </div>

      {bullets && bullets.length > 0 && (
        <div className="rounded-[18px] bg-card border border-border p-4 shadow-petosauras space-y-2">
          <h3 className="font-heading font-bold text-sm">What you'll get</h3>
          <ul className="space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-sm font-body text-muted-foreground">
                <VerifiedIcon className="w-4 h-4 mt-0.5 text-primary shrink-0" strokeWidth={2} />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-[18px] bg-card border border-border p-4 shadow-petosauras">
        <h3 className="font-heading font-bold text-sm mb-2">Join the waitlist</h3>
        {joined ? (
          <p className="text-sm text-muted-foreground font-body">
            ✅ We'll notify you the moment it launches.
          </p>
        ) : (
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={join} disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Joining…</> : "Notify me"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ComingSoonHub;
