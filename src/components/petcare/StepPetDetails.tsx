import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { breedsByType, petTypes } from "@/lib/registrationData";
import type { AgeBucket, Weather } from "@/lib/petCareHelpers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface PetDetails {
  petType: string;
  breed: string;
  age: AgeBucket | "";
  weightKg?: string;
  weather: Weather;
  allergies: string;
  /** id of selected DB pet, if any */
  petId?: string | null;
}

const AGE_OPTIONS: { value: AgeBucket; label: string }[] = [
  { value: "Baby",   label: "Baby/Puppy" },
  { value: "Young",  label: "Young Adult" },
  { value: "Adult",  label: "Adult" },
  { value: "Senior", label: "Senior" },
];

const WEATHER_OPTIONS: { value: Weather; emoji: string; label: string }[] = [
  { value: "summer",  emoji: "☀️", label: "Hot/Summer" },
  { value: "monsoon", emoji: "🌧️", label: "Monsoon" },
  { value: "winter",  emoji: "❄️", label: "Cold/Winter" },
];

interface Props {
  initial: PetDetails;
  onSubmit: (d: PetDetails) => void;
}

const StepPetDetails = ({ initial, onSubmit }: Props) => {
  const { user } = useAuth();
  const [details, setDetails] = useState<PetDetails>(initial);
  const [usingManual, setUsingManual] = useState(!user);

  const { data: pets } = useQuery({
    queryKey: ["petcare-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pets")
        .select("id, name, pet_type, species, age_years, avatar_emoji")
        .eq("owner_id", user!.id);
      return data ?? [];
    },
  });

  const inferAge = (years: number | null): AgeBucket => {
    if (!years) return "Adult";
    if (years < 1) return "Baby";
    if (years < 3) return "Young";
    if (years < 8) return "Adult";
    return "Senior";
  };

  const selectExistingPet = (pet: NonNullable<typeof pets>[number]) => {
    setUsingManual(false);
    setDetails((d) => ({
      ...d,
      petType: pet.pet_type,
      breed: pet.species ?? "",
      age: inferAge(pet.age_years),
      petId: pet.id,
    }));
  };

  const startManual = () => {
    setUsingManual(true);
    setDetails((d) => ({ ...d, petId: null }));
  };

  // If user has no pets, force manual
  useEffect(() => {
    if (user && pets && pets.length === 0) setUsingManual(true);
  }, [user, pets]);

  const breeds = details.petType ? breedsByType[details.petType] ?? [] : [];
  const isValid = !!details.petType && !!details.breed && !!details.age;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-[18px]">Tell us about your pet</h2>
        <p className="text-[12px] text-muted-foreground font-body">A few details help us personalise the guidance.</p>
      </div>

      {/* Existing pets list */}
      {user && pets && pets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[12px] font-heading font-bold text-muted-foreground uppercase tracking-wide">Pick a pet</p>
          <div className="grid grid-cols-1 gap-2">
            {pets.map((p) => {
              const selected = !usingManual && details.petId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => selectExistingPet(p)}
                  className={`flex items-center gap-3 p-3 rounded-[18px] border-2 transition-all text-left ${
                    selected ? "border-primary bg-primary-light" : "border-border bg-card"
                  }`}
                >
                  <span className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-[20px]">
                    {p.avatar_emoji ?? "🐾"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-[14px] truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground font-body truncate">
                      {p.species ?? p.pet_type}{p.age_years ? ` · ${p.age_years}y` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
            <button
              onClick={startManual}
              className={`flex items-center justify-center gap-2 p-3 rounded-[18px] border-2 border-dashed transition-all ${
                usingManual ? "border-primary text-primary" : "border-border text-muted-foreground"
              }`}
            >
              ➕ Different pet (manual entry)
            </button>
          </div>
        </div>
      )}

      {/* Manual entry */}
      {usingManual && (
        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-heading font-bold uppercase tracking-wide">Pet Type *</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {petTypes.filter((p) => ["Canine","Feline","Aquatic","Avian","Small Pet","Reptile"].includes(p.label)).map((t) => {
                const sel = details.petType === t.label;
                return (
                  <button
                    key={t.label}
                    onClick={() => setDetails((d) => ({ ...d, petType: t.label, breed: "" }))}
                    className={`flex flex-col items-center gap-1 p-2 rounded-[14px] border-2 transition-all ${
                      sel ? "border-primary bg-primary-light" : "border-border bg-card"
                    }`}
                  >
                    <span className="text-[22px]">{t.emoji}</span>
                    <span className="text-[11px] font-body font-semibold">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {details.petType && (
            <div>
              <label className="text-[12px] font-heading font-bold uppercase tracking-wide">Species/Breed *</label>
              <Select value={details.breed} onValueChange={(v) => setDetails((d) => ({ ...d, breed: v }))}>
                <SelectTrigger className="mt-2"><SelectValue placeholder="Choose breed/species" /></SelectTrigger>
                <SelectContent>
                  {breeds.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {/* Age — always asked */}
      <div>
        <label className="text-[12px] font-heading font-bold uppercase tracking-wide">Age *</label>
        <div className="grid grid-cols-4 gap-2 mt-2">
          {AGE_OPTIONS.map((a) => {
            const sel = details.age === a.value;
            return (
              <button
                key={a.value}
                onClick={() => setDetails((d) => ({ ...d, age: a.value }))}
                className={`p-2 rounded-[12px] text-[11px] font-heading font-bold border-2 transition-all ${
                  sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[12px] font-heading font-bold uppercase tracking-wide">Weight (kg)</label>
        <Input
          type="number"
          inputMode="decimal"
          placeholder="Optional — improves diet portions"
          value={details.weightKg ?? ""}
          onChange={(e) => setDetails((d) => ({ ...d, weightKg: e.target.value }))}
          className="mt-2"
        />
      </div>

      <div>
        <label className="text-[12px] font-heading font-bold uppercase tracking-wide">Current Weather</label>
        <div className="grid grid-cols-3 gap-2 mt-2">
          {WEATHER_OPTIONS.map((w) => {
            const sel = details.weather === w.value;
            return (
              <button
                key={w.value}
                onClick={() => setDetails((d) => ({ ...d, weather: w.value }))}
                className={`p-2 rounded-full text-[12px] font-heading font-bold border-2 transition-all ${
                  sel ? "border-primary bg-primary-light text-primary" : "border-border bg-card text-muted-foreground"
                }`}
              >
                {w.emoji} {w.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-[12px] font-heading font-bold uppercase tracking-wide">Known Allergies</label>
        <Textarea
          placeholder="e.g. chicken, grass pollen, dust — leave blank if none known"
          value={details.allergies}
          onChange={(e) => setDetails((d) => ({ ...d, allergies: e.target.value }))}
          className="mt-2"
          rows={3}
        />
      </div>

      <Button
        className="w-full"
        size="lg"
        disabled={!isValid}
        onClick={() => onSubmit(details)}
      >
        View Recommendations →
      </Button>
    </div>
  );
};

export default StepPetDetails;
