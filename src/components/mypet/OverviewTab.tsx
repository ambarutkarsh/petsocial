import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchHealthRecords, fetchPetDocuments } from "@/lib/petDocuments";
import { ChevronRight, Syringe, Calendar, Bell, Bug, FileText } from "lucide-react";
import HealthSnapshotCard from "./HealthSnapshotCard";

interface Props {
  petId: string;
  petName: string;
  pet?: any;
  onTabChange: (tab: string) => void;
}

const OverviewTab = ({ petId, petName, pet, onTabChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: weights = [] } = useQuery({
    queryKey: ["weight-logs", petId],
    enabled: !!user && !!petId,
    queryFn: async () => {
      const { data } = await supabase
        .from("health_logs")
        .select("weight_kg,log_date")
        .eq("pet_id", petId)
        .not("weight_kg", "is", null)
        .order("log_date", { ascending: true })
        .limit(30);
      return data || [];
    },
  });

  const lastWeight = weights[weights.length - 1] as any;
  const prevWeight = weights[weights.length - 2] as any;
  const weightDelta =
    lastWeight && prevWeight ? Number(lastWeight.weight_kg) - Number(prevWeight.weight_kg) : null;

  return (
    <div className="space-y-3">
      {/* Health Snapshot (configurable, per-pet) */}
      <HealthSnapshotCard pet={pet || { id: petId, name: petName }} />

      {/* Growth + Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-card p-3.5">
          <p className="font-heading font-bold text-sm mb-2">Growth / Weight</p>
          {lastWeight ? (
            <>
              <p className="font-heading font-bold text-2xl">{lastWeight.weight_kg} kg</p>
              <p className="text-[10px] text-muted-foreground font-body">Current weight</p>
              <div className="my-2 h-7 flex items-end gap-0.5">
                {weights.slice(-12).map((w: any, i: number) => {
                  const max = Math.max(...weights.map((x: any) => Number(x.weight_kg)));
                  const h = Math.max(8, (Number(w.weight_kg) / max) * 28);
                  return <div key={i} className="flex-1 bg-secondary/60 rounded-sm" style={{ height: h }} />;
                })}
              </div>
              {weightDelta !== null && (
                <p className={`text-[11px] font-body font-bold ${weightDelta >= 0 ? "text-secondary" : "text-destructive"}`}>
                  {weightDelta >= 0 ? "+" : ""}{weightDelta.toFixed(1)} kg
                  <span className="text-muted-foreground font-normal"> vs last log</span>
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Log first weight</p>
          )}
          <button
            onClick={() => onTabChange("growth")}
            className="text-[11px] font-body font-bold text-primary mt-1"
          >
            View growth chart
          </button>
        </div>

        <div className="rounded-lg border border-border bg-card p-3.5">
          <p className="font-heading font-bold text-sm mb-2">Quick Actions</p>
          <div className="space-y-1">
            <ActionRow icon={<Syringe className="w-3.5 h-3.5" />} label="Add Vaccine" onClick={() => onTabChange("vaccines")} />
            <ActionRow icon={<Calendar className="w-3.5 h-3.5" />} label="Book Vet" onClick={() => navigate("/mypet/book-a-vet")} />
            <ActionRow icon={<Bell className="w-3.5 h-3.5" />} label="Set Reminder" onClick={() => onTabChange("reminders")} />
          </div>
        </div>
      </div>
    </div>
  );
};

const ActionRow = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-2 p-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all"
  >
    <div className="w-7 h-7 rounded-lg bg-primary-light/60 flex items-center justify-center text-primary">
      {icon}
    </div>
    <span className="text-xs font-body font-semibold flex-1 text-left">{label}</span>
    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
  </button>
);

export default OverviewTab;
