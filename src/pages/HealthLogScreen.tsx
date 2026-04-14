import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MobileLayout from "@/components/MobileLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, subMonths, isAfter } from "date-fns";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, CartesianGrid } from "recharts";

const tabs = ["Weight", "Food", "Vaccines", "Vet Visit"];
const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];
const units = ["grams", "ml", "cups"];
const vaccineChips = ["Rabies", "DA2PP", "Leptospirosis", "Bordetella", "Feline FVRCP", "FeLV", "Canine Influenza"];

const HealthLogScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("Weight");

  // Pet
  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", user!.id).order("is_primary", { ascending: false });
      return data || [];
    },
  });
  const pet = pets[0];

  // Weight form
  const [weightDate, setWeightDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [weight, setWeight] = useState("");
  const [weightNotes, setWeightNotes] = useState("");
  const [savingWeight, setSavingWeight] = useState(false);

  // Food form
  const [foodDate, setFoodDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [mealType, setMealType] = useState("Breakfast");
  const [foodName, setFoodName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("grams");
  const [foodNotes, setFoodNotes] = useState("");
  const [savingFood, setSavingFood] = useState(false);

  // Vaccine form
  const [vaccineName, setVaccineName] = useState("");
  const [vaccAdminDate, setVaccAdminDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [vaccDueDate, setVaccDueDate] = useState("");
  const [vaccVetName, setVaccVetName] = useState("");
  const [vaccNotes, setVaccNotes] = useState("");
  const [vaccStatus, setVaccStatus] = useState<"done" | "upcoming">("done");
  const [savingVacc, setSavingVacc] = useState(false);

  // Vet form
  const [vetDate, setVetDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [vetName, setVetName] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [vetReason, setVetReason] = useState("");
  const [vetDiagnosis, setVetDiagnosis] = useState("");
  const [vetPrescription, setVetPrescription] = useState("");
  const [vetNextAppt, setVetNextAppt] = useState("");
  const [vetStatus, setVetStatus] = useState<"completed" | "upcoming">("completed");
  const [savingVet, setSavingVet] = useState(false);

  // Queries
  const { data: weightLogs = [] } = useQuery({
    queryKey: ["weight-logs", pet?.id],
    enabled: !!pet,
    queryFn: async () => {
      const { data } = await supabase.from("health_logs").select("*").eq("pet_id", pet!.id).not("weight_kg", "is", null).order("log_date", { ascending: true }).limit(7);
      return data || [];
    },
  });

  const { data: todayFoodLogs = [] } = useQuery({
    queryKey: ["today-food-logs", pet?.id],
    enabled: !!pet,
    queryFn: async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data } = await supabase.from("food_logs").select("*").eq("pet_id", pet!.id).eq("log_date", today).order("created_at", { ascending: false });
      return data || [];
    },
  });

  const { data: vaccinations = [] } = useQuery({
    queryKey: ["all-vaccinations", pet?.id],
    enabled: !!pet,
    queryFn: async () => {
      const { data } = await supabase.from("vaccinations").select("*").eq("pet_id", pet!.id).order("due_date", { ascending: true });
      return data || [];
    },
  });

  const { data: vetVisits = [] } = useQuery({
    queryKey: ["vet-visits", pet?.id],
    enabled: !!pet,
    queryFn: async () => {
      const { data } = await supabase.from("vet_appointments").select("*").eq("pet_id", pet!.id).order("appointment_date", { ascending: false });
      return data || [];
    },
  });

  // Health score
  const hasRecentWeight = weightLogs.some((l: any) => {
    const d = new Date(l.log_date);
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return isAfter(d, weekAgo);
  });
  const hasFoodToday = todayFoodLogs.length > 0;
  const overdueVaccines = vaccinations.filter((v: any) => v.status !== "done" && v.due_date && new Date(v.due_date) < new Date());
  const allVaccinesCurrent = overdueVaccines.length === 0 && vaccinations.length > 0;
  const hasRecentVet = vetVisits.some((v: any) => isAfter(new Date(v.appointment_date), subMonths(new Date(), 6)));

  const weightScore = hasRecentWeight ? 20 : 0;
  const foodScore = hasFoodToday ? 20 : 0;
  const vaccScore = allVaccinesCurrent ? 30 : 0;
  const vetScore = hasRecentVet ? 30 : 0;
  const totalScore = weightScore + foodScore + vaccScore + vetScore;

  const scoreFeedback = totalScore <= 40 ? "Needs attention — start logging your pet's health"
    : totalScore <= 70 ? "Getting there — keep tracking consistently"
    : totalScore <= 90 ? "Doing well — your pet is well looked after!"
    : "Excellent — your pet is in top shape! 🌟";

  // Save handlers
  const saveWeight = async () => {
    if (!pet || !weight) return;
    setSavingWeight(true);
    const { error } = await supabase.from("health_logs").insert({
      pet_id: pet.id, owner_id: user!.id, log_date: weightDate,
      weight_kg: parseFloat(weight), notes: weightNotes || null,
    });
    setSavingWeight(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Weight logged!");
    setWeight(""); setWeightNotes("");
    queryClient.invalidateQueries({ queryKey: ["weight-logs"] });
    queryClient.invalidateQueries({ queryKey: ["latest-health-log"] });
  };

  const saveFood = async () => {
    if (!pet || !foodName) return;
    setSavingFood(true);
    const { error } = await supabase.from("food_logs").insert({
      pet_id: pet.id, owner_id: user!.id, log_date: foodDate,
      meal_type: mealType, food_name: foodName,
      quantity: quantity ? parseFloat(quantity) : null, unit, notes: foodNotes || null,
    });
    setSavingFood(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Food logged!");
    setFoodName(""); setQuantity(""); setFoodNotes("");
    queryClient.invalidateQueries({ queryKey: ["today-food-logs"] });
  };

  const saveVaccine = async () => {
    if (!pet || !vaccineName) return;
    setSavingVacc(true);
    const { error } = await supabase.from("vaccinations").insert({
      pet_id: pet.id, owner_id: user!.id, vaccine_name: vaccineName,
      administered_date: vaccStatus === "done" ? vaccAdminDate : null,
      due_date: vaccDueDate || null, vet_name: vaccVetName || null,
      notes: vaccNotes || null, status: vaccStatus,
    });
    setSavingVacc(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Vaccine logged!");
    setVaccineName(""); setVaccDueDate(""); setVaccVetName(""); setVaccNotes("");
    queryClient.invalidateQueries({ queryKey: ["all-vaccinations"] });
    queryClient.invalidateQueries({ queryKey: ["vaccinations"] });
  };

  const saveVetVisit = async () => {
    if (!pet || !vetReason) return;
    setSavingVet(true);
    const { error } = await supabase.from("vet_appointments").insert({
      pet_id: pet.id, owner_id: user!.id, appointment_date: vetDate,
      vet_name: vetName || null, clinic_name: clinicName || null,
      reason: vetReason, notes: vetPrescription ? `Diagnosis: ${vetDiagnosis}\nPrescription: ${vetPrescription}` : vetDiagnosis || null,
      status: vetStatus,
    });
    setSavingVet(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Vet visit logged!");
    setVetReason(""); setVetName(""); setClinicName(""); setVetDiagnosis(""); setVetPrescription(""); setVetNextAppt("");
    queryClient.invalidateQueries({ queryKey: ["vet-visits"] });
    queryClient.invalidateQueries({ queryKey: ["next-appt"] });
  };

  const chartData = weightLogs.map((l: any) => ({
    date: format(new Date(l.log_date), "MMM d"),
    weight: Number(l.weight_kg),
  }));

  const totalFoodToday = todayFoodLogs.reduce((acc: number, l: any) => acc + (l.quantity || 0), 0);

  return (
    <MobileLayout>
      <div className="pb-8">
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/health")} className="text-primary"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-lg font-heading font-bold">Log Health Entry</h1>
            {pet && <p className="text-xs text-text-muted">{pet.name}</p>}
          </div>
        </header>

        {/* Health Score */}
        <div className="px-4 mb-4">
          <div className="paw-card p-4">
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-4xl font-heading font-bold text-primary">{totalScore}</span>
              <span className="text-lg text-text-muted">/100</span>
            </div>
            <div className="h-3 rounded-full bg-muted overflow-hidden mb-2">
              <div className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all" style={{ width: `${totalScore}%` }} />
            </div>
            <p className="text-sm text-text-mid mb-3">{scoreFeedback}</p>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs">
                <span>{hasRecentWeight ? "✅" : "⬜"}</span>
                <span className="text-text-mid">Weight logged ({weightScore}/20)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>{hasFoodToday ? "✅" : "⬜"}</span>
                <span className="text-text-mid">Food logged today ({foodScore}/20)</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>{allVaccinesCurrent ? "✅" : overdueVaccines.length > 0 ? "⚠️" : "⬜"}</span>
                <span className="text-text-mid">Vaccines current ({vaccScore}/30){overdueVaccines.length > 0 ? ` · ${overdueVaccines.length} overdue` : ""}</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span>{hasRecentVet ? "✅" : "⬜"}</span>
                <span className="text-text-mid">Recent vet visit ({vetScore}/30)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar mb-4">
          {tabs.map((t) => (
            <button key={t} onClick={() => setActiveTab(t)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === t ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"
              }`}>{t}</button>
          ))}
        </div>

        <div className="px-4">
          {/* WEIGHT TAB */}
          {activeTab === "Weight" && (
            <div className="space-y-4">
              <Input type="date" value={weightDate} onChange={(e) => setWeightDate(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-0" />
              <Input type="number" step="0.1" placeholder="Weight (kg)" value={weight}
                onChange={(e) => setWeight(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <Textarea placeholder="Notes (optional)" value={weightNotes}
                onChange={(e) => setWeightNotes(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
              <Button onClick={saveWeight} className="w-full" size="lg" disabled={savingWeight || !weight}>
                {savingWeight ? "Saving…" : "Log Weight"}
              </Button>

              {chartData.length > 1 && (
                <div className="paw-card p-4 mt-4">
                  <p className="text-sm font-semibold mb-3">Weight Trend (Last 7)</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(30 20% 94%)" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                      <Line type="monotone" dataKey="weight" stroke="#7B5EA7" strokeWidth={2} dot={{ r: 4, fill: "#7B5EA7" }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* FOOD TAB */}
          {activeTab === "Food" && (
            <div className="space-y-4">
              <Input type="date" value={foodDate} onChange={(e) => setFoodDate(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-0" />
              <select value={mealType} onChange={(e) => setMealType(e.target.value)}
                className="w-full h-12 rounded-xl bg-muted/50 border-0 px-4 text-sm">
                {mealTypes.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <Input placeholder="e.g. Royal Canin Adult, boiled chicken" value={foodName}
                onChange={(e) => setFoodName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <div className="flex gap-3">
                <Input type="number" placeholder="Quantity" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0 flex-1" />
                <select value={unit} onChange={(e) => setUnit(e.target.value)}
                  className="h-12 rounded-xl bg-muted/50 border-0 px-4 text-sm w-24">
                  {units.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <Textarea placeholder="Notes (optional)" value={foodNotes}
                onChange={(e) => setFoodNotes(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
              <Button onClick={saveFood} className="w-full" size="lg" disabled={savingFood || !foodName}>
                {savingFood ? "Saving…" : "Log Food"}
              </Button>

              {todayFoodLogs.length > 0 && (
                <div className="paw-card p-4 mt-4">
                  <p className="text-sm font-semibold mb-2">Today: {totalFoodToday} {todayFoodLogs[0]?.unit || "units"} across {todayFoodLogs.length} meals</p>
                  <div className="space-y-2">
                    {todayFoodLogs.map((l: any) => (
                      <div key={l.id} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{l.food_name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">{l.quantity} {l.unit}</span>
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-medium">{l.meal_type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VACCINES TAB */}
          {activeTab === "Vaccines" && (
            <div className="space-y-4">
              <Input placeholder="Vaccine name" value={vaccineName}
                onChange={(e) => setVaccineName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <div className="flex gap-2 flex-wrap">
                {vaccineChips.map((c) => (
                  <button key={c} onClick={() => setVaccineName(c)}
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                      vaccineName === c ? "bg-primary text-primary-foreground" : "bg-muted text-text-mid"
                    }`}>{c}</button>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Administered</label>
                  <Input type="date" value={vaccAdminDate} onChange={(e) => setVaccAdminDate(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50 border-0" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Due date (optional)</label>
                  <Input type="date" value={vaccDueDate} onChange={(e) => setVaccDueDate(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50 border-0" />
                </div>
              </div>
              <Input placeholder="Vet name (optional)" value={vaccVetName}
                onChange={(e) => setVaccVetName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <Textarea placeholder="Notes (optional)" value={vaccNotes}
                onChange={(e) => setVaccNotes(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
              <div className="flex rounded-xl overflow-hidden border border-muted">
                {(["done", "upcoming"] as const).map((s) => (
                  <button key={s} onClick={() => setVaccStatus(s)}
                    className={`flex-1 h-12 text-sm font-medium transition-colors ${
                      vaccStatus === s ? "bg-primary text-primary-foreground" : "bg-muted/50 text-text-mid"
                    }`}>{s === "done" ? "Done ✅" : "Upcoming ⏳"}</button>
                ))}
              </div>
              <Button onClick={saveVaccine} className="w-full" size="lg" disabled={savingVacc || !vaccineName}>
                {savingVacc ? "Saving…" : "Log Vaccine"}
              </Button>

              {vaccinations.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold">Vaccination Timeline</p>
                  {vaccinations.map((v: any) => {
                    const isOverdue = v.status !== "done" && v.due_date && new Date(v.due_date) < new Date();
                    return (
                      <div key={v.id} className="paw-card p-3 flex items-center gap-3">
                        <span className="text-lg">{v.status === "done" ? "✅" : isOverdue ? "❌" : "⏳"}</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{v.vaccine_name}</p>
                          <p className="text-xs text-text-muted">
                            {v.administered_date && `Given: ${format(new Date(v.administered_date), "MMM d, yyyy")}`}
                            {v.due_date && ` · Due: ${format(new Date(v.due_date), "MMM d, yyyy")}`}
                          </p>
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                          v.status === "done" ? "bg-secondary/10 text-secondary"
                          : isOverdue ? "bg-destructive/10 text-destructive"
                          : "bg-accent/10 text-accent"
                        }`}>{isOverdue ? "Overdue" : v.status}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VET VISIT TAB */}
          {activeTab === "Vet Visit" && (
            <div className="space-y-4">
              <Input type="date" value={vetDate} onChange={(e) => setVetDate(e.target.value)}
                className="h-12 rounded-xl bg-muted/50 border-0" />
              <Input placeholder="Vet name (optional)" value={vetName}
                onChange={(e) => setVetName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <Input placeholder="Clinic name (optional)" value={clinicName}
                onChange={(e) => setClinicName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <Input placeholder="Reason for visit (required)" value={vetReason}
                onChange={(e) => setVetReason(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              <Textarea placeholder="Diagnosis (optional)" value={vetDiagnosis}
                onChange={(e) => setVetDiagnosis(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
              <Textarea placeholder="Prescription / notes (optional)" value={vetPrescription}
                onChange={(e) => setVetPrescription(e.target.value)} className="rounded-xl bg-muted/50 border-0" />
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Next appointment (optional)</label>
                  <Input type="date" value={vetNextAppt} onChange={(e) => setVetNextAppt(e.target.value)}
                    className="h-12 rounded-xl bg-muted/50 border-0" />
                </div>
              </div>
              <div className="flex rounded-xl overflow-hidden border border-muted">
                {(["completed", "upcoming"] as const).map((s) => (
                  <button key={s} onClick={() => setVetStatus(s)}
                    className={`flex-1 h-12 text-sm font-medium transition-colors ${
                      vetStatus === s ? "bg-primary text-primary-foreground" : "bg-muted/50 text-text-mid"
                    }`}>{s === "completed" ? "Completed ✅" : "Upcoming 📅"}</button>
                ))}
              </div>
              <Button onClick={saveVetVisit} className="w-full" size="lg" disabled={savingVet || !vetReason}>
                {savingVet ? "Saving…" : "Log Vet Visit"}
              </Button>

              {vetVisits.length > 0 && (
                <div className="space-y-2 mt-4">
                  <p className="text-sm font-semibold">Past Vet Visits</p>
                  {vetVisits.map((v: any) => (
                    <div key={v.id} className="paw-card p-3 flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{format(new Date(v.appointment_date), "MMM d, yyyy")}</p>
                        <p className="text-xs text-text-muted">{v.clinic_name && `${v.clinic_name} · `}{v.reason}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                        v.status === "completed" || v.status === "done" ? "bg-secondary/10 text-secondary" : "bg-accent/10 text-accent"
                      }`}>{v.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default HealthLogScreen;
