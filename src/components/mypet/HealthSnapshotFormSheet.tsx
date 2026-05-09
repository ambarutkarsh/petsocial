import { useEffect, useMemo, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  calculatePetHealthSnapshot,
  getPetTypeInputs,
  humanizeKey,
} from "@/lib/petHealthScoring";

interface Props {
  open: boolean;
  onClose: () => void;
  pet: any;
  existing?: any;
}

const Scale = ({ value, onChange }: { value: number; onChange: (v: number) => void }) => (
  <div className="flex gap-1.5 mt-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        className={`flex-1 h-9 rounded-lg text-sm font-bold border ${
          value === n
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card border-border text-muted-foreground"
        }`}
      >
        {n}
      </button>
    ))}
  </div>
);

const Bool = ({ value, onChange }: { value: boolean | undefined; onChange: (v: boolean) => void }) => (
  <div className="flex gap-2 mt-1">
    {[
      { l: "Yes", v: true },
      { l: "No", v: false },
    ].map((o) => (
      <button
        key={o.l}
        type="button"
        onClick={() => onChange(o.v)}
        className={`flex-1 h-9 rounded-lg text-sm font-bold border ${
          value === o.v
            ? "bg-primary text-primary-foreground border-primary"
            : "bg-card border-border text-muted-foreground"
        }`}
      >
        {o.l}
      </button>
    ))}
  </div>
);

const FLAGS = [
  "vomiting", "diarrhea", "not_eating", "lethargy", "laboured_breathing",
  "visible_wound", "weight_loss", "seizure", "bloating", "limping", "abnormal_discharge",
];

const HealthSnapshotFormSheet = ({ open, onClose, pet, existing }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<any>({});

  useEffect(() => {
    if (open) {
      setData(
        existing?.input_data || {
          pet_type: pet?.pet_type,
          breed_or_species: pet?.species,
          age_years: pet?.age_years,
          weight_kg: pet?.weight_kg,
          appetite: 4,
          energy_level: 4,
          mobility: 4,
          coat_skin_or_body_surface: 4,
          stool_or_waste_quality: 4,
          breathing: 5,
          body_condition_score: 3,
          hydration_observation_score: 4,
          vaccination_status: "unknown",
          deworming_status: "unknown",
          medical_flags: [],
        },
      );
    }
  }, [open, existing, pet]);

  const petType = data.pet_type || pet?.pet_type || "Others";
  const specificInputs = useMemo(() => getPetTypeInputs(petType), [petType]);

  const set = (k: string, v: any) => setData((d: any) => ({ ...d, [k]: v }));
  const toggleFlag = (f: string) => {
    const cur: string[] = data.medical_flags || [];
    set("medical_flags", cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]);
  };

  const handleSave = async () => {
    if (!user || !pet) return;
    setSaving(true);
    const result = calculatePetHealthSnapshot(data);
    const payload = {
      owner_id: user.id,
      pet_id: pet.id,
      pet_type: petType,
      breed_or_species: data.breed_or_species || pet.species || null,
      input_data: data,
      calculated_scores: result as any,
      overall_health_score: result.overall_health_score,
      body_condition_score: result.body_condition_score,
      activity_score: result.activity_score,
      hydration_score: result.hydration_score,
      overall_health_label: result.overall_health_label,
      body_condition_label: result.body_condition_label,
      activity_label: result.activity_label,
      hydration_label: result.hydration_label,
      overall_health_reason: result.overall_health_reason,
      body_condition_reason: result.body_condition_reason,
      activity_reason: result.activity_reason,
      hydration_reason: result.hydration_reason,
      updated_at: new Date().toISOString(),
    };
    const { error } = await supabase
      .from("pet_health_snapshots")
      .upsert(payload, { onConflict: "owner_id,pet_id" });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Health snapshot saved");
    qc.invalidateQueries({ queryKey: ["health-snapshot", pet.id] });
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="bottom"
        className="h-[92vh] overflow-y-auto rounded-t-3xl p-4 left-1/2 -translate-x-1/2 w-full max-w-[480px] sm:max-w-[480px]"
      >
        <SheetHeader>
          <SheetTitle className="font-heading">
            {existing ? "Edit" : "Complete"} Health Snapshot — {pet?.name}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-4 pb-24">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Age (years)</Label>
              <Input
                type="number"
                value={data.age_years ?? ""}
                onChange={(e) => set("age_years", Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Weight (kg)</Label>
              <Input
                type="number"
                value={data.weight_kg ?? ""}
                onChange={(e) => set("weight_kg", Number(e.target.value))}
              />
            </div>
          </div>

          {[
            ["appetite", "Appetite"],
            ["energy_level", "Energy Level"],
            ["mobility", "Mobility"],
            ["stool_or_waste_quality", "Stool / Waste Quality"],
            ["breathing", "Breathing"],
            ["coat_skin_or_body_surface", "Coat / Skin / Body Surface"],
            ["hydration_observation_score", "Hydration Observation"],
          ].map(([k, label]) => (
            <div key={k}>
              <Label>{label}</Label>
              <Scale value={data[k] || 3} onChange={(v) => set(k, v)} />
            </div>
          ))}

          <div>
            <Label>Body Condition Score (1=very thin, 3=ideal, 5=obese)</Label>
            <Scale value={data.body_condition_score || 3} onChange={(v) => set("body_condition_score", v)} />
          </div>

          <div>
            <Label>Activity (minutes per day)</Label>
            <Input
              type="number"
              value={data.activity_minutes_per_day ?? ""}
              onChange={(e) => set("activity_minutes_per_day", Number(e.target.value))}
            />
          </div>

          {/* pet-type specific */}
          {specificInputs.length > 0 && (
            <div className="rounded-2xl bg-muted/40 p-3 space-y-3">
              <p className="font-heading font-bold text-sm">{petType}-specific checks</p>
              {specificInputs.map((inp: any) => (
                <div key={inp.key}>
                  <Label className="text-xs">{humanizeKey(inp.key)}</Label>
                  {inp.type === "boolean" ? (
                    <Bool value={data[inp.key]} onChange={(v) => set(inp.key, v)} />
                  ) : (
                    <Scale value={data[inp.key] || 3} onChange={(v) => set(inp.key, v)} />
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <Label>Vaccination Status</Label>
            <select
              className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3"
              value={data.vaccination_status || "unknown"}
              onChange={(e) => set("vaccination_status", e.target.value)}
            >
              {["up_to_date", "due_soon", "overdue", "not_applicable", "unknown"].map((o) => (
                <option key={o} value={o}>{humanizeKey(o)}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>Deworming Status</Label>
            <select
              className="mt-1 w-full h-11 rounded-xl border border-border bg-card px-3"
              value={data.deworming_status || "unknown"}
              onChange={(e) => set("deworming_status", e.target.value)}
            >
              {["up_to_date", "due_soon", "overdue", "not_applicable", "unknown"].map((o) => (
                <option key={o} value={o}>{humanizeKey(o)}</option>
              ))}
            </select>
          </div>

          <div>
            <Label>Any medical concerns? (tap all that apply)</Label>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {FLAGS.map((f) => {
                const active = (data.medical_flags || []).includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFlag(f)}
                    className={`text-[11px] font-body font-bold px-2.5 py-1.5 rounded-full border ${
                      active
                        ? "bg-destructive/15 text-destructive border-destructive/40"
                        : "bg-card text-muted-foreground border-border"
                    }`}
                  >
                    {humanizeKey(f)}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border max-w-[430px] mx-auto">
            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Snapshot"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default HealthSnapshotFormSheet;
