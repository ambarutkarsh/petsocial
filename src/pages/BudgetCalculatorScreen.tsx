import { useState, useMemo } from "react";
import { BackIcon, BudgetIcon } from "@/components/icons/PetosauraIcons";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { petTypes, breedsByType, indianStates } from "@/lib/registrationData";
import { citiesByState } from "@/lib/indianCities";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { trackEvent } from "@/lib/analytics";

interface BudgetResult {
  food: { monthly_cost: number; details: string; frequency: string };
  health: { monthly_cost: number; details: string; frequency: string };
  ownership: { monthly_cost: number; details: string; frequency: string };
  grooming: { monthly_cost: number; details: string; frequency: string };
  total_monthly: number;
  total_annual: number;
  notes: string;
}

interface BudgetCalculatorScreenProps {
  embedded?: boolean;
}

const BudgetCalculatorScreen = ({ embedded = false }: BudgetCalculatorScreenProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("get_my_profile");
      return Array.isArray(data) ? data[0] : data;
    },
  });

  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await (supabase as any).rpc("get_my_pets");
      return data || [];
    },
  });

  const [step, setStep] = useState(1);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [isNewPet, setIsNewPet] = useState(false);
  const [newPetType, setNewPetType] = useState("");
  const [newBreed, setNewBreed] = useState("");
  const [budgetTier, setBudgetTier] = useState("");
  const [result, setResult] = useState<BudgetResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [breeders, setBreeders] = useState<any[]>([]);
  const [loadingBreeders, setLoadingBreeders] = useState(false);

  const savedState = profile?.state;
  const savedCity = profile?.city;
  const hasAutoLocation = !!savedState;

  const effectiveState = state || savedState || "";
  const effectiveCity = (city === "Other" ? customCity : city) || savedCity || "";

  const availableCities = citiesByState[effectiveState] || [];

  const selectedPet = pets.find((p: any) => p.id === selectedPetId);
  const petType = selectedPet?.pet_type || newPetType;
  const breed = selectedPet?.species || newBreed;
  const petName = selectedPet?.name || newBreed || newPetType;
  const breeds = useMemo(() => breedsByType[newPetType] || [], [newPetType]);

  const findBreeders = async () => {
    if (!newBreed || !effectiveCity) return;
    setLoadingBreeders(true);
    try {
      const { data } = await supabase.functions.invoke("fetch-nearby-breeders", { body: { breed: newBreed, city: effectiveCity } });
      setBreeders(data?.breeders || []);
    } catch { /* ignore */ }
    setLoadingBreeders(false);
  };

  const calculate = async () => {
    setCalculating(true);
    trackEvent("budget_calculated", { pet_type: petType, budget_tier: budgetTier, city: effectiveCity });
    try {
      const { data, error } = await supabase.functions.invoke("calculate-budget", {
        body: { breed, pet_type: petType, city: effectiveCity, state: effectiveState, budget_tier: budgetTier },
      });
      if (error || data?.error) throw new Error(data?.error || "Failed");
      setResult(data);
      setStep(5);
    } catch (e: any) {
      toast.error(e.message || "Failed to calculate budget");
    }
    setCalculating(false);
  };

  const saveEstimate = async () => {
    if (!result) return;
    setSaving(true);
    const { error } = await supabase.from("budget_estimates").insert({
      user_id: user!.id, pet_id: selectedPetId, pet_type: petType, breed,
      city: effectiveCity, budget_tier: budgetTier,
      food_monthly: result.food.monthly_cost, health_monthly: result.health.monthly_cost,
      ownership_monthly: result.ownership.monthly_cost, grooming_monthly: result.grooming.monthly_cost,
      total_monthly: result.total_monthly, total_annual: result.total_annual,
      details_json: result as any,
    });
    setSaving(false);
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Estimate saved!");
  };

  const saveLocation = async () => {
    if (!user || !effectiveState) return;
    await supabase.from("profiles").update({ state: effectiveState, city: effectiveCity }).eq("id", user.id);
    toast.success("Location saved!");
    setStep(2);
  };

  const tiers = [
    { id: "premium", emoji: "✨", label: "Premium", desc: "Best quality products and services" },
    { id: "medium", emoji: "⚖️", label: "Medium", desc: "Good quality, balanced value for money" },
    { id: "budget", emoji: "💡", label: "Budget-Friendly", desc: "Essential needs covered economically" },
  ];

  const sections = result ? [
    { emoji: "🍖", label: "Food", data: result.food },
    { emoji: "🏥", label: "Health", data: result.health },
    { emoji: "🎾", label: "Ownership", data: result.ownership },
    { emoji: "✂️", label: "Grooming", data: result.grooming },
  ] : [];

  const inner = (
    <div className="pb-20 px-4">
      {!embedded && (
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 py-3 flex items-center gap-3">
          <button onClick={() => step > 1 && step < 5 ? setStep(step - 1) : navigate("/hub")}>
            <BackIcon className="w-5 h-5" />
          </button>
          <h1 className="font-heading font-bold text-lg">Budget Calculator</h1>
        </header>
      )}
      {embedded && step > 1 && step < 5 && (
        <div className="pt-3">
          <button onClick={() => setStep(step - 1)} className="text-xs font-body font-semibold text-primary">← Back</button>
        </div>
      )}

        {/* STEP 1: Location */}
        {step === 1 && (
          <div className="space-y-4 mt-4">
            <h2 className="font-heading font-semibold">📍 Your Location</h2>
            {hasAutoLocation ? (
              <div className="paw-card p-4">
                <p className="text-sm">📍 Using: <span className="font-semibold">{savedCity}, {savedState}</span></p>
                <button className="text-xs text-primary mt-1 font-bold" onClick={() => { setState(""); setCity(""); }}>Change</button>
                <Button className="w-full mt-3" onClick={() => setStep(2)}>Continue</Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Select your state *</label>
                  <select value={state} onChange={(e) => { setState(e.target.value); setCity(""); setCustomCity(""); }}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Select your state</option>
                    {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {state && (
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Select your city *</label>
                    {availableCities.length > 0 ? (
                      <select value={city} onChange={(e) => setCity(e.target.value)}
                        className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                        <option value="">Select your city</option>
                        {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <Input placeholder="Enter your city name" value={customCity} onChange={(e) => setCustomCity(e.target.value)} />
                    )}
                    {city === "Other" && (
                      <Input placeholder="Enter city name" value={customCity} onChange={(e) => setCustomCity(e.target.value)} className="mt-2" />
                    )}
                  </div>
                )}
                <Button className="w-full" onClick={saveLocation} disabled={!effectiveState || !effectiveCity}>
                  Use this location
                </Button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Pet Selection */}
        {step === 2 && (
          <div className="space-y-4 mt-4">
            <h2 className="font-heading font-semibold">Which pet are you budgeting for?</h2>
            <div className="space-y-2">
              {pets.map((p: any) => (
                <button key={p.id} onClick={() => { setSelectedPetId(p.id); setIsNewPet(false); setBudgetTier(""); setStep(4); }}
                  className={`w-full paw-card p-4 text-left flex items-center gap-3 ${selectedPetId === p.id ? "border-2 border-primary" : ""}`}>
                  <span className="text-2xl">{p.avatar_emoji || "🐾"}</span>
                  <div><p className="font-semibold text-sm">{p.name}</p><p className="text-xs text-muted-foreground">{p.species || p.pet_type}</p></div>
                </button>
              ))}
              <button onClick={() => { setIsNewPet(true); setSelectedPetId(null); setStep(3); }}
                className="w-full paw-card p-4 text-left flex items-center gap-3 border-2 border-dashed border-border">
                <span className="text-2xl">➕</span>
                <p className="font-semibold text-sm">I'm getting a new pet</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: New Pet */}
        {step === 3 && (
          <div className="space-y-4 mt-4">
            <h2 className="font-heading font-semibold">What type of pet?</h2>
            <div className="grid grid-cols-3 gap-2">
              {petTypes.map((pt) => (
                <button key={pt.label} onClick={() => { setNewPetType(pt.label); setNewBreed(""); }}
                  className={`p-3 rounded-xl text-center text-sm ${newPetType === pt.label ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                  <span className="text-2xl block">{pt.emoji}</span>{pt.label}
                </button>
              ))}
            </div>
            {newPetType && breeds.length > 0 && (
              <select value={newBreed} onChange={(e) => setNewBreed(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select breed</option>
                {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            {newBreed && effectiveCity && (
              <div className="paw-card p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">🔍 Find breeders near me</p>
                  <Button size="sm" variant="outline" onClick={findBreeders} disabled={loadingBreeders}>
                    {loadingBreeders ? "Searching..." : "Search"}
                  </Button>
                </div>
                {breeders.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-[10px] text-muted-foreground">Results from Google — verify credentials before visiting</p>
                    {breeders.map((b: any) => (
                      <div key={b.place_id} className="bg-muted/50 rounded-lg p-2.5 text-xs">
                        <p className="font-semibold">{b.name}</p>
                        <p className="text-muted-foreground">{b.address}</p>
                        {b.rating > 0 && <p className="text-amber-600">⭐ {b.rating}</p>}
                        <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name)}&query_place_id=${b.place_id}`}
                          target="_blank" rel="noopener noreferrer" className="text-primary font-medium">Open in Maps</a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            <Button className="w-full" onClick={() => setStep(4)} disabled={!newPetType}>Continue</Button>
          </div>
        )}

        {/* STEP 4: Budget Tier */}
        {step === 4 && (
          <div className="space-y-4 mt-4">
            <h2 className="font-heading font-semibold">Select your budget tier</h2>
            <div className="space-y-3">
              {tiers.map((t) => (
                <button key={t.id} onClick={() => setBudgetTier(t.id)}
                  className={`w-full paw-card p-4 text-left transition-colors ${budgetTier === t.id ? "border-2 border-primary bg-primary/5" : ""}`}>
                  <p className="font-heading font-bold text-base">{t.emoji} {t.label}</p>
                  <p className="text-xs text-muted-foreground">{t.desc}</p>
                </button>
              ))}
            </div>
            <Button className="w-full" onClick={calculate} disabled={!budgetTier || calculating}>
              {calculating ? "Calculating..." : "Calculate My Budget"}
            </Button>
          </div>
        )}

        {/* STEP 5: Results */}
        {step === 5 && result && (
          <div className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-semibold text-base">Monthly Budget for {petName} in {effectiveCity}</h2>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{budgetTier}</span>
            </div>
            <div className="space-y-2">
              {sections.map((s) => (
                <Collapsible key={s.label}>
                  <CollapsibleTrigger className="w-full paw-card p-4 flex items-center justify-between">
                    <span className="text-sm font-semibold">{s.emoji} {s.label}</span>
                    <span className="text-sm font-bold">₹{s.data.monthly_cost.toLocaleString()}/month</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-4 pb-3">
                    <div className="bg-muted/30 rounded-lg p-3 mt-1 text-xs space-y-1">
                      <p>{s.data.details}</p>
                      <p className="text-muted-foreground">{s.data.frequency}</p>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
            <div className="paw-card p-4 text-center">
              <p className="text-sm font-semibold">Total Monthly Budget</p>
              <p className="text-2xl font-heading font-bold text-primary">₹{result.total_monthly.toLocaleString()}/month</p>
              <p className="text-xs text-muted-foreground mt-1">Annual estimate: ₹{result.total_annual.toLocaleString()}/year</p>
            </div>
            {result.notes && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <p className="text-xs text-amber-800">{result.notes}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(4)}>Recalculate</Button>
              <Button className="flex-1" onClick={saveEstimate} disabled={saving}>{saving ? "Saving..." : "Save Estimate"}</Button>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              💡 These are AI-generated estimates. Actual prices vary by brand, vet, and location.
            </p>
          </div>
        )}
    </div>
  );

  if (embedded) return inner;
  return <MobileLayout>{inner}</MobileLayout>;
};

export default BudgetCalculatorScreen;
