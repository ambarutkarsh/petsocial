import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { fetchHealthRecords, fetchPetDocuments } from "@/lib/petDocuments";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

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

  const { data: chip } = useQuery({
    queryKey: ["pet-chip", petId],
    enabled: !!user && !!petId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_microchips")
        .select("chip_number, verification_status, registered_at")
        .eq("pet_id", petId)
        .eq("owner_id", user!.id)
        .eq("is_active", true)
        .maybeSingle();
      return data;
    },
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
  const lastVet = records.find((r: any) => r.record_type === "vet_visit");
  const lastWeight = weights[weights.length - 1] as any;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <DashCard
          title="Upcoming Care"
          accent="bg-accent/15"
          onClick={() => onTabChange("reminders")}
        >
          {upcomingVaccine ? (
            <p className="text-xs font-body">
              💉 {upcomingVaccine.title}
              <br />
              <span className="text-muted-foreground text-[10px]">
                {format(new Date(upcomingVaccine.next_due_date), "dd MMM")}
              </span>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Nothing scheduled</p>
          )}
          {upcomingDeworming && (
            <p className="text-xs font-body mt-1">
              🪱 Deworming
              <br />
              <span className="text-muted-foreground text-[10px]">
                in {differenceInDays(new Date(upcomingDeworming.next_due_date), new Date())} days
              </span>
            </p>
          )}
        </DashCard>

        <DashCard
          title="Documents"
          accent="bg-primary-light"
          onClick={() => onTabChange("documents")}
        >
          <p className="text-2xl font-heading font-bold">{docs.length}</p>
          <p className="text-[10px] text-muted-foreground font-body">total uploaded</p>
        </DashCard>

        <DashCard title="Growth" accent="bg-secondary/10" onClick={() => onTabChange("growth")}>
          {lastWeight ? (
            <>
              <p className="text-2xl font-heading font-bold">{lastWeight.weight_kg} kg</p>
              <p className="text-[10px] text-muted-foreground font-body">
                {format(new Date(lastWeight.log_date), "dd MMM yyyy")}
              </p>
            </>
          ) : (
            <p className="text-xs text-muted-foreground font-body">Log first weight</p>
          )}
        </DashCard>

        <DashCard title="Microchip" accent="bg-primary/10">
          {chip ? (
            <>
              <p className="text-[11px] font-mono font-bold break-all">{chip.chip_number}</p>
              <p className="text-[10px] text-secondary font-body font-semibold mt-1">
                ✓ {chip.verification_status === "document_verified" ? "Verified" : "Registered"}
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-body">Not added</p>
              <Button
                size="sm"
                variant="outline"
                className="h-7 mt-1.5 text-[11px]"
                onClick={() => navigate(`/hub/microchip/register?pet=${petId}`)}
              >
                + Add
              </Button>
            </>
          )}
        </DashCard>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">
          Last vet visit
        </p>
        <p className="font-body text-sm">
          {lastVet
            ? `${lastVet.title} • ${
                lastVet.record_date
                  ? format(new Date(lastVet.record_date), "dd MMM yyyy")
                  : ""
              }`
            : "No visits logged"}
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <p className="text-[11px] uppercase font-semibold text-muted-foreground mb-2">
          Quick Actions
        </p>
        <div className="grid grid-cols-3 gap-2">
          <QuickAction emoji="💉" label="Add Vaccine" onClick={() => onTabChange("vaccines")} />
          <QuickAction emoji="🪱" label="Deworming" onClick={() => onTabChange("deworming")} />
          <QuickAction emoji="📋" label="Add Report" onClick={() => onTabChange("reports")} />
          <QuickAction emoji="📂" label="Upload Doc" onClick={() => onTabChange("documents")} />
          <QuickAction emoji="📅" label="Book Vet" onClick={() => navigate("/mypet/book-a-vet")} />
          <QuickAction
            emoji="🔖"
            label={chip ? "View Chip" : "Add Microchip"}
            onClick={() => navigate(chip ? "/hub/microchip" : `/hub/microchip/register?pet=${petId}`)}
          />
        </div>
      </div>
    </div>
  );
};

const DashCard = ({
  title,
  accent,
  children,
  onClick,
}: {
  title: string;
  accent: string;
  children: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    disabled={!onClick}
    className={`text-left rounded-2xl border border-border bg-card p-3 ${
      onClick ? "active:scale-[0.98] transition-transform" : ""
    }`}
  >
    <div className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${accent} mb-2`}>
      {title}
    </div>
    {children}
  </button>
);

const QuickAction = ({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex flex-col items-center gap-1 rounded-xl bg-muted/40 hover:bg-primary-light p-2.5 transition-colors active:scale-95"
  >
    <span className="text-xl">{emoji}</span>
    <span className="text-[10px] font-body font-semibold text-center leading-tight">{label}</span>
  </button>
);

export default OverviewTab;
