import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchHealthRecords, fetchPetDocuments } from "@/lib/petDocuments";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Sparkles, Activity, Droplet, ChevronRight, Syringe, Bug, FileText, Calendar, Bell } from "lucide-react";

interface Props {
  petId: string;
  petName: string;
  onTabChange: (tab: string) => void;
}

const OverviewTab = ({ petId, petName, onTabChange }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: records = [] } = useQuery({
    queryKey: ["mypet-summary", petId],
    enabled: !!user && !!petId,
    queryFn: () => fetchHealthRecords({ ownerId: user!.id, petId }),
  });

  const { data: docs = [] } = useQuery({
    queryKey: ["pet-documents", petId],
    enabled: !!user && !!petId,
    queryFn: () => fetchPetDocuments({ ownerId: user!.id, petId }),
  });

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

  const upcomingVaccine = records.find(
    (r: any) => r.record_type === "vaccine" && r.next_due_date
  );
  const upcomingDeworming = records.find(
    (r: any) => r.record_type === "deworming" && r.next_due_date
  );
  const lastWeight = weights[weights.length - 1] as any;
  const prevWeight = weights[weights.length - 2] as any;
  const weightDelta =
    lastWeight && prevWeight ? Number(lastWeight.weight_kg) - Number(prevWeight.weight_kg) : null;

  return (
    <div className="space-y-3">
      {/* Health Snapshot */}
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-base">Health Snapshot</h3>
          <span className="text-[10px] text-muted-foreground font-body">Updated today</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          <SnapItem icon={<Heart className="w-5 h-5 text-secondary" />} label="Overall Health" value="Good" sub="No issues" tone="text-secondary" />
          <SnapItem icon={<Sparkles className="w-5 h-5 text-accent" />} label="Body Condition" value="Ideal" sub="Score: 4/5" tone="text-accent" />
          <SnapItem icon={<Activity className="w-5 h-5 text-primary" />} label="Activity Level" value="Active" sub="Great job!" tone="text-primary" />
          <SnapItem icon={<Droplet className="w-5 h-5 text-secondary" />} label="Hydration" value="Good" sub="Keep it up" tone="text-secondary" />
        </div>
      </div>

      {/* Upcoming Care + Growth */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-3.5">
          <div className="flex items-center justify-between mb-2">
            <p className="font-heading font-bold text-sm">Upcoming Care</p>
          </div>
          <div className="space-y-2">
            {upcomingVaccine && (
              <CareRow
                icon={<Syringe className="w-4 h-4 text-secondary" />}
                title={upcomingVaccine.title}
                date={format(new Date(upcomingVaccine.next_due_date), "dd MMM yyyy")}
                badge="Upcoming"
                tone="bg-accent/15 text-accent"
              />
            )}
            {upcomingDeworming && (
              <CareRow
                icon={<Bug className="w-4 h-4 text-accent" />}
                title="Deworming"
                date={format(new Date(upcomingDeworming.next_due_date), "dd MMM yyyy")}
                badge={`In ${Math.max(0, differenceInDays(new Date(upcomingDeworming.next_due_date), new Date()))} days`}
                tone="bg-primary-light text-primary"
              />
            )}
            {!upcomingVaccine && !upcomingDeworming && (
              <p className="text-xs text-muted-foreground font-body">Nothing scheduled</p>
            )}
          </div>
          <button
            onClick={() => onTabChange("reminders")}
            className="text-[11px] font-body font-bold text-primary mt-2"
          >
            View all
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-card p-3.5">
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
      </div>

      {/* Documents Summary + Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-3xl border border-border bg-card p-3.5">
          <p className="font-heading font-bold text-sm mb-2">Documents Summary</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-heading font-bold text-2xl leading-none">{docs.length}</p>
              <p className="text-[10px] text-muted-foreground font-body">Total documents</p>
            </div>
          </div>
          <button
            onClick={() => onTabChange("documents")}
            className="text-[11px] font-body font-bold text-primary mt-2"
          >
            View all
          </button>
        </div>

        <div className="rounded-3xl border border-border bg-card p-3.5">
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

const SnapItem = ({
  icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone: string;
}) => (
  <div className="text-center">
    <p className="text-[9px] font-body text-muted-foreground leading-tight mb-1">{label}</p>
    <div className="w-9 h-9 mx-auto rounded-full bg-primary-light/60 flex items-center justify-center mb-1">
      {icon}
    </div>
    <p className={`text-[12px] font-body font-bold ${tone}`}>{value}</p>
    <p className="text-[9px] text-muted-foreground font-body leading-tight">{sub}</p>
  </div>
);

const CareRow = ({
  icon,
  title,
  date,
  badge,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  date: string;
  badge: string;
  tone: string;
}) => (
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 rounded-lg bg-primary-light/60 flex items-center justify-center shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs font-body font-semibold truncate">{title}</p>
      <p className="text-[10px] text-muted-foreground font-body">{date}</p>
    </div>
    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${tone}`}>
      {badge}
    </span>
  </div>
);

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
