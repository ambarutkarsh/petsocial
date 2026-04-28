import { useState } from "react";
import { CloseIcon } from "@/components/icons/PetosauraIcons";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { petTypes, breedsByType, petTypeEmoji } from "@/lib/registrationData";

interface Props {
  open: boolean;
  onClose: () => void;
}

const AddPetSheet = ({ open, onClose }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState("");
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const breeds = breedsByType[selectedType] || [];
  const canSave = selectedType && petName.trim().length >= 2 && (breeds.length === 0 || breed);

  const handleSave = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    const { error } = await supabase.from("pets").insert({
      owner_id: user.id,
      name: petName.trim(),
      pet_type: selectedType,
      species: breed || null,
      age_years: age ? parseFloat(age) : null,
      gender,
      avatar_emoji: petTypeEmoji[selectedType] || "🐾",
      is_primary: false,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pet added! 🐾");
    queryClient.invalidateQueries({ queryKey: ["primary-pet"] });
    queryClient.invalidateQueries({ queryKey: ["all-pets"] });
    reset();
    onClose();
  };

  const reset = () => {
    setSelectedType(""); setPetName(""); setBreed(""); setAge(""); setGender("Male");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-[430px] bg-card rounded-t-[28px] p-6 animate-slide-up max-h-[85vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-heading font-bold">Add a Pet</h2>
          <button onClick={onClose}><CloseIcon className="w-5 h-5 text-text-hint" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-xs font-body font-bold text-muted-foreground mb-2 uppercase tracking-wide">Pet Type</p>
            <div className="grid grid-cols-3 gap-2">
              {petTypes.map((pt) => (
                <button key={pt.label} onClick={() => { setSelectedType(pt.label); setBreed(""); }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-2xl border-2 transition-all text-center ${
                    selectedType === pt.label ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
                  }`}>
                  <span className="text-2xl">{pt.emoji}</span>
                  <span className="text-[11px] font-medium">{pt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input placeholder="Pet name *" value={petName} onChange={(e) => setPetName(e.target.value)} />

          {breeds.length > 0 && (
            <select value={breed} onChange={(e) => setBreed(e.target.value)}
              className="w-full h-12 rounded-[16px] bg-surface-alt border-[1.5px] border-border px-4 font-body text-sm">
              <option value="">Select breed *</option>
              {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          )}

          <div className="flex gap-3">
            <Input type="number" placeholder="Age (years)" value={age} onChange={(e) => setAge(e.target.value)} className="flex-1" />
            <div className="flex rounded-xl overflow-hidden border border-muted">
              {(["Male", "Female"] as const).map((g) => (
                <button key={g} onClick={() => setGender(g)}
                  className={`px-4 h-12 text-sm font-medium transition-colors ${
                    gender === g ? "bg-primary text-primary-foreground" : "bg-muted/50 text-text-mid"
                  }`}>{g}</button>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={!canSave || saving} className="w-full" size="lg">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</> : "Add Pet 🐾"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AddPetSheet;
