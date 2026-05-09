import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Heart, Sparkles, Activity, Droplet, Pencil, AlertTriangle, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SCORE_COLORS, SCORE_LABELS } from "@/lib/petHealthScoring";
import { Button } from "@/components/ui/button";
import HealthSnapshotFormSheet from "./HealthSnapshotFormSheet";
import RemindMeLaterSheet from "./RemindMeLaterSheet";

interface Props {
  pet: any;
}

const HealthSnapshotCard = ({ pet }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formOpen, setFormOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);

  const { data: snapshot, isLoading } = useQuery({
    queryKey: ["health-snapshot", pet?.id],
    enabled: !!user && !!pet?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_health_snapshots")
        .select("*")
        .eq("owner_id", user!.id)
        .eq("pet_id", pet.id)
        .maybeSingle();
      return data;
    },
  });

  if (isLoading) {
    return <div className="rounded-3xl border border-border bg-card p-4 h-40 animate-pulse" />;
  }

  if (!snapshot) {
    return (
      <>
        <div className="rounded-3xl border border-border bg-card p-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-full bg-primary-light/60 flex items-center justify-center mb-2">
            <Heart className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-base">Complete Health Snapshot</h3>
          <p className="text-xs text-muted-foreground font-body mt-1 mb-4">
            Answer a few quick questions to understand {pet?.name}'s wellness status.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => setFormOpen(true)} className="w-full">
              Enter Health Details
            </Button>
            <button
              onClick={() => setRemindOpen(true)}
              className="text-xs font-body font-bold text-muted-foreground inline-flex items-center justify-center gap-1"
            >
              <Bell className="w-3.5 h-3.5" /> Remind Me Later
            </button>
          </div>
        </div>
        <HealthSnapshotFormSheet open={formOpen} onClose={() => setFormOpen(false)} pet={pet} />
        <RemindMeLaterSheet open={remindOpen} onClose={() => setRemindOpen(false)} pet={pet} />
      </>
    );
  }

  const items = [
    { key: "overall", icon: Heart, label: "Overall Health", score: snapshot.overall_health_score, scoreLabel: snapshot.overall_health_label, reason: snapshot.overall_health_reason },
    { key: "body", icon: Sparkles, label: "Body Condition", score: snapshot.body_condition_score, scoreLabel: snapshot.body_condition_label, reason: snapshot.body_condition_reason },
    { key: "activity", icon: Activity, label: "Activity", score: snapshot.activity_score, scoreLabel: snapshot.activity_label, reason: snapshot.activity_reason },
    { key: "hydration", icon: Droplet, label: "Hydration", score: snapshot.hydration_score, scoreLabel: snapshot.hydration_label, reason: snapshot.hydration_reason },
  ];

  const showVetCta = snapshot.overall_health_score <= 2;

  return (
    <>
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-heading font-bold text-base">Health Snapshot</h3>
            <p className="text-[10px] text-muted-foreground font-body">
              Updated {format(new Date(snapshot.updated_at), "dd MMM yyyy")}
            </p>
          </div>
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1 text-[11px] font-body font-bold text-primary px-2.5 py-1.5 rounded-full bg-primary-light/60"
          >
            <Pencil className="w-3 h-3" /> Edit
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {items.map((it) => {
            const Icon = it.icon;
            const tone = SCORE_COLORS[it.score] || "bg-muted text-muted-foreground";
            return (
              <div key={it.key} className="rounded-2xl border border-border p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center ${tone}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <p className="text-[10px] font-body text-muted-foreground leading-tight">
                    {it.label}
                  </p>
                </div>
                <div className="flex items-baseline gap-1">
                  <p className="font-heading font-bold text-lg leading-none">{it.score}</p>
                  <p className="text-[10px] text-muted-foreground">/5</p>
                  <p className="text-[10px] font-body font-bold ml-auto">{it.scoreLabel}</p>
                </div>
                <p className="text-[10px] text-muted-foreground font-body mt-1 line-clamp-2">{it.reason}</p>
              </div>
            );
          })}
        </div>

        {showVetCta && (
          <button
            onClick={() => navigate("/mypet/book-a-vet")}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full bg-destructive text-destructive-foreground text-xs font-body font-bold"
          >
            <AlertTriangle className="w-3.5 h-3.5" /> Book a Vet — urgent
          </button>
        )}
      </div>
      <HealthSnapshotFormSheet
        open={formOpen}
        onClose={() => setFormOpen(false)}
        pet={pet}
        existing={snapshot}
      />
    </>
  );
};

export default HealthSnapshotCard;
