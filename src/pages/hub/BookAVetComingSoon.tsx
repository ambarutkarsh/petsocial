import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import HubSubLayout from "@/components/HubSubLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/components/ui/sonner";

const BookAVetComingSoon = () => {
  const [params] = useSearchParams();
  const type = params.get("type") ?? "tele";
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");

  const join = async () => {
    if (!email) return;
    const { error } = await supabase.from("waitlist").insert({
      email,
      feature: type === "tele" ? "teleconsult" : "home_visit",
      user_id: user?.id ?? null,
    });
    if (error) toast.error(error.message);
    else toast("We'll email you when it launches!");
  };

  if (type === "home") {
    return (
      <HubSubLayout title="Home Visit" emoji="🏠" subtitle="Coming soon">
        <div className="text-center mt-6">
          <p className="text-5xl">🏠</p>
          <h2 className="mt-3 font-heading font-bold text-lg">Home Visits Coming Soon</h2>
          <p className="mt-2 text-xs font-body text-muted-foreground">
            We're building home visit bookings with GPS tracking and verified vet-to-door service.
          </p>
        </div>
        <div className="mt-5 paw-card p-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full p-2.5 rounded-[12px] border border-border text-sm font-body"
          />
          <button onClick={join} className="mt-2 w-full py-2.5 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm">
            Notify me when home visits launch
          </button>
        </div>
      </HubSubLayout>
    );
  }

  return (
    <HubSubLayout title="Teleconsult" emoji="📹" subtitle="Coming soon">
      <div className="text-center mt-6">
        <p className="text-5xl">📹</p>
        <h2 className="mt-3 font-heading font-bold text-lg">Video Consultations Coming Soon</h2>
        <p className="mt-2 text-xs font-body text-muted-foreground">
          We're building secure video calls with verified vets — right inside Petosauras. No extra app needed.
        </p>
      </div>
      <div className="mt-5 space-y-2">
        {[
          { n: 1, t: "Book a slot", d: "Same booking flow" },
          { n: 2, t: "Join video call", d: "In-app, no download" },
          { n: 3, t: "Get e-prescription", d: "Auto-saved to DigiLocker" },
        ].map((s) => (
          <div key={s.n} className="paw-card p-3 flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-heading font-bold text-sm">{s.n}</div>
            <div>
              <p className="font-heading font-bold text-sm">{s.t}</p>
              <p className="text-[11px] font-body text-muted-foreground">{s.d}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-[11px] font-body text-muted-foreground">Estimated launch: Coming in Phase 2</p>
      <div className="mt-4 paw-card p-3">
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="w-full p-2.5 rounded-[12px] border border-border text-sm font-body"
        />
        <button onClick={join} className="mt-2 w-full py-2.5 rounded-full bg-primary text-primary-foreground font-heading font-bold text-sm">
          Notify me when video consults launch
        </button>
      </div>
    </HubSubLayout>
  );
};

export default BookAVetComingSoon;
