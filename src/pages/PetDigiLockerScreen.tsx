import { useState, useRef, useMemo } from "react";
import { ArrowLeft, Plus, FileText, Trash2, Download, Eye as EyeIcon, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Area } from "recharts";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics";

const mealIcons: Record<string, string> = { Breakfast: "🌅", Lunch: "☀️", Dinner: "🌙", Snack: "🍪" };

const documentCategories = [
  { value: "vaccination_card", label: "📋 Vaccination Card" },
  { value: "hospital_bill", label: "🏥 Hospital Bill" },
  { value: "pet_shop_bill", label: "🧾 Pet Shop Bill" },
  { value: "prescription", label: "💊 Prescription / Medicines" },
  { value: "lab_report", label: "🩺 Lab Report / Test Results" },
  { value: "insurance", label: "📄 Insurance Document" },
  { value: "other", label: "📝 Other" },
];

const categoryLabels: Record<string, string> = Object.fromEntries(documentCategories.map(c => [c.value, c.label]));

const PetDigiLockerScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Pet selector
  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", user!.id).order("is_primary", { ascending: false });
      return data || [];
    },
  });
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const activePet = pets.find((p: any) => p.id === selectedPetId) || pets[0];

  // Weight logs
  const { data: weightLogs = [] } = useQuery({
    queryKey: ["weight-logs", activePet?.id], enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("health_logs").select("*").eq("pet_id", activePet!.id).not("weight_kg", "is", null).order("log_date", { ascending: true }).limit(30);
      return data || [];
    },
  });

  // Food logs today
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: foodLogs = [] } = useQuery({
    queryKey: ["food-logs-today", activePet?.id, today], enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("food_logs").select("*").eq("pet_id", activePet!.id).eq("log_date", today);
      return data || [];
    },
  });

  // Vaccinations
  const { data: vaccinations = [] } = useQuery({
    queryKey: ["vaccinations", activePet?.id], enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("vaccinations").select("*").eq("pet_id", activePet!.id).order("due_date", { ascending: true });
      return data || [];
    },
  });

  // All pet records (documents)
  const { data: allRecords = [] } = useQuery({
    queryKey: ["pet-records", activePet?.id], enabled: !!activePet,
    queryFn: async () => {
      const { data } = await supabase.from("pet_records").select("*").eq("pet_id", activePet!.id).order("document_date", { ascending: false });
      return data || [];
    },
  });

  // Ideal weight
  const { data: idealWeight } = useQuery({
    queryKey: ["ideal-weight", activePet?.id], enabled: !!activePet?.species,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("calculate-ideal-weight", {
        body: { gender: activePet!.gender, breed: activePet!.species || activePet!.pet_type, species: activePet!.pet_type, age_years: activePet!.age_years || 2 },
      });
      if (error || data?.error) return null;
      return data as { min: number; max: number };
    },
    staleTime: 1000 * 60 * 60,
  });

  // Form states
  const [showWeightForm, setShowWeightForm] = useState(false);
  const [weightDate, setWeightDate] = useState<Date>(new Date());
  const [weightVal, setWeightVal] = useState("");
  const [weightNotes, setWeightNotes] = useState("");

  const [showFoodForm, setShowFoodForm] = useState(false);
  const [foodDate, setFoodDate] = useState<Date>(new Date());
  const [mealType, setMealType] = useState("Breakfast");
  const [foodName, setFoodName] = useState("");
  const [foodQty, setFoodQty] = useState("");
  const [foodUnit, setFoodUnit] = useState("grams");

  const [showVaccForm, setShowVaccForm] = useState(false);
  const [vaccName, setVaccName] = useState("");
  const [vaccDate, setVaccDate] = useState<Date>(new Date());
  const [vaccDueDate, setVaccDueDate] = useState<Date | undefined>();
  const [vaccVet, setVaccVet] = useState("");
  const [vaccStatus, setVaccStatus] = useState("done");

  const [uploading, setUploading] = useState(false);

  // Document upload states
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [docCategory, setDocCategory] = useState("");
  const [docDate, setDocDate] = useState<Date>(new Date());
  const [docName, setDocName] = useState("");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docFileError, setDocFileError] = useState("");
  const [docUploading, setDocUploading] = useState(false);

  // Accordion state for document categories
  const [expandedCats, setExpandedCats] = useState<string[]>([]);

  const petAge = useMemo(() => {
    if (!activePet?.date_of_birth) return activePet?.age_years ? `${activePet.age_years} years` : "Unknown";
    const dob = new Date(activePet.date_of_birth);
    const yrs = differenceInYears(new Date(), dob);
    const mos = differenceInMonths(new Date(), dob) % 12;
    return `${yrs} years ${mos} months`;
  }, [activePet]);

  const latestWeight = weightLogs.length > 0 ? Number((weightLogs as any[])[weightLogs.length - 1].weight_kg) : null;

  const weightStatus = useMemo(() => {
    if (!idealWeight || latestWeight === null) return null;
    if (latestWeight < idealWeight.min) return { label: "Underweight", icon: "⚠️", color: "text-amber-600" };
    if (latestWeight > idealWeight.max) return { label: "Overweight", icon: "⚠️", color: "text-amber-600" };
    return { label: "Healthy weight", icon: "✅", color: "text-secondary" };
  }, [idealWeight, latestWeight]);

  const chartData = (weightLogs as any[]).slice(-7).map((l: any) => ({ date: format(new Date(l.log_date), "MMM d"), weight: Number(l.weight_kg) }));

  const growthData = useMemo(() => {
    return (weightLogs as any[]).map((l: any) => ({
      date: format(new Date(l.log_date), "MMM d"),
      weight: Number(l.weight_kg),
      idealMin: idealWeight?.min || 0,
      idealMax: idealWeight?.max || 0,
    }));
  }, [weightLogs, idealWeight]);

  // Group documents by category
  const groupedDocs = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const rec of allRecords as any[]) {
      const cat = rec.record_type || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(rec);
    }
    return groups;
  }, [allRecords]);

  const saveWeight = async () => {
    if (!weightVal || !activePet) return;
    const { error } = await supabase.from("health_logs").insert({ pet_id: activePet.id, owner_id: user!.id, weight_kg: parseFloat(weightVal), log_date: format(weightDate, "yyyy-MM-dd"), notes: weightNotes || null });
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Weight logged!");
    setShowWeightForm(false); setWeightVal(""); setWeightNotes("");
    qc.invalidateQueries({ queryKey: ["weight-logs"] });
  };

  const saveFood = async () => {
    if (!foodName || !activePet) return;
    const { error } = await supabase.from("food_logs").insert({ pet_id: activePet.id, owner_id: user!.id, food_name: foodName, meal_type: mealType, quantity: foodQty ? parseFloat(foodQty) : null, unit: foodUnit, log_date: format(foodDate, "yyyy-MM-dd") });
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Food logged!");
    setShowFoodForm(false); setFoodName(""); setFoodQty("");
    qc.invalidateQueries({ queryKey: ["food-logs-today"] });
  };

  const saveVaccine = async () => {
    if (!vaccName || !activePet) return;
    const { error } = await supabase.from("vaccinations").insert({ pet_id: activePet.id, owner_id: user!.id, vaccine_name: vaccName, administered_date: format(vaccDate, "yyyy-MM-dd"), due_date: vaccDueDate ? format(vaccDueDate, "yyyy-MM-dd") : null, vet_name: vaccVet || null, status: vaccStatus });
    if (error) { toast.error("Failed to save"); return; }
    toast.success("Vaccine added!");
    setShowVaccForm(false); setVaccName("");
    qc.invalidateQueries({ queryKey: ["vaccinations"] });
  };

  const uploadVaccCard = async (file: File) => {
    if (!activePet) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user!.id}/${activePet.id}/vaccination_card_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("pet-records").upload(path, file);
    if (upErr) { toast.error("Upload failed"); setUploading(false); return; }
    const fileSizeKb = Math.round(file.size / 1024);
    const { error: dbErr } = await supabase.from("pet_records").insert({ pet_id: activePet.id, owner_id: user!.id, record_type: "vaccination_card", file_url: path, file_name: file.name, file_size_kb: fileSizeKb, document_date: format(new Date(), "yyyy-MM-dd") });
    if (dbErr) { toast.error("Failed to save record"); setUploading(false); return; }
    toast.success("Vaccination card uploaded!");
    setUploading(false);
    qc.invalidateQueries({ queryKey: ["pet-records"] });
  };

  const handleDocFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      setDocFileError(`File too large (${Math.round(file.size / 1024)} KB). Maximum size is 500KB. Please compress and try again.`);
      setDocFile(null);
      return;
    }
    setDocFileError("");
    setDocFile(file);
  };

  const saveDocument = async () => {
    if (!docFile || !docCategory || !activePet) return;
    setDocUploading(true);
    const ext = docFile.name.split(".").pop();
    const dateStr = format(docDate, "yyyy-MM-dd");
    const path = `${user!.id}/${activePet.id}/${docCategory}/${dateStr}/${docFile.name}`;
    const { error: upErr } = await supabase.storage.from("pet-records").upload(path, docFile);
    if (upErr) { toast.error("Upload failed"); setDocUploading(false); return; }
    const fileSizeKb = Math.round(docFile.size / 1024);
    const { error: dbErr } = await supabase.from("pet_records").insert({
      pet_id: activePet.id,
      owner_id: user!.id,
      record_type: docCategory,
      file_url: path,
      file_name: docFile.name,
      file_size_kb: fileSizeKb,
      document_date: dateStr,
      notes: docName || null,
    });
    if (dbErr) { toast.error("Failed to save record"); setDocUploading(false); return; }
    toast.success("Document uploaded!");
    trackEvent("digilocker_document_uploaded", { category: docCategory });
    setDocUploading(false);
    setShowDocUpload(false);
    setDocFile(null); setDocCategory(""); setDocName(""); setDocFileError("");
    qc.invalidateQueries({ queryKey: ["pet-records"] });
  };

  const handleDeleteRecord = async (record: any) => {
    if (!confirm("Delete this document?")) return;
    await supabase.storage.from("pet-records").remove([record.file_url]);
    await supabase.from("pet_records").delete().eq("id", record.id);
    toast.success("Document deleted");
    qc.invalidateQueries({ queryKey: ["pet-records"] });
  };

  const handleViewRecord = async (record: any) => {
    const { data } = await supabase.storage.from("pet-records").createSignedUrl(record.file_url, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName) return "📄";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") return "📕";
    if (["jpg", "jpeg", "png", "webp"].includes(ext || "")) return "🖼️";
    return "📄";
  };

  const vaccChips = ["Rabies", "DA2PP", "Leptospirosis", "Bordetella", "FVRCP", "FeLV", "Deworming"];

  const totalFoodToday = (foodLogs as any[]).reduce((s: number, f: any) => s + (Number(f.quantity) || 0), 0);

  const DatePick = ({ date, onSelect }: { date: Date; onSelect: (d: Date) => void }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="text-xs">{format(date, "MMM d, yyyy")}</Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={date} onSelect={(d) => d && onSelect(d)} className={cn("p-3 pointer-events-auto")} />
      </PopoverContent>
    </Popover>
  );

  if (!activePet) {
    return (
      <MobileLayout>
        <div className="px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/health")}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-heading font-bold text-lg">Pet DigiLocker</h1>
        </div>
        <div className="text-center py-16">
          <span className="text-5xl block mb-3">🐾</span>
          <p className="text-sm text-muted-foreground">Add a pet first to use DigiLocker</p>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20">
        <header className="sticky top-14 bg-background/80 backdrop-blur-lg z-30 px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate("/health")}><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-heading font-bold text-lg">Pet DigiLocker</h1>
        </header>

        {/* Pet selector */}
        {pets.length > 1 && (
          <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {pets.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedPetId(p.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${p.id === activePet.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {p.avatar_emoji || "🐾"} {p.name}
              </button>
            ))}
          </div>
        )}

        <div className="px-4 mt-2">
          <Tabs defaultValue="health">
            <TabsList className="w-full">
              <TabsTrigger value="health" className="flex-1 text-xs">📊 Health Log</TabsTrigger>
              <TabsTrigger value="vaccines" className="flex-1 text-xs">💉 Vaccines</TabsTrigger>
              <TabsTrigger value="documents" className="flex-1 text-xs">📁 Documents</TabsTrigger>
              <TabsTrigger value="growth" className="flex-1 text-xs">📈 Growth</TabsTrigger>
            </TabsList>

            {/* TAB 1: HEALTH LOG */}
            <TabsContent value="health" className="space-y-4 mt-3">
              <div className="paw-card p-4">
                <h3 className="font-heading font-semibold text-sm mb-2">Basic Info</h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Name:</span> {activePet.name}</div>
                  <div><span className="text-muted-foreground">Breed:</span> {activePet.species || activePet.pet_type}</div>
                  <div><span className="text-muted-foreground">Gender:</span> {activePet.gender || "Unknown"}</div>
                  <div><span className="text-muted-foreground">Age:</span> {petAge}</div>
                  <div><span className="text-muted-foreground">DOB:</span> {activePet.date_of_birth ? format(new Date(activePet.date_of_birth), "MMM d, yyyy") : "Not set"}</div>
                </div>
              </div>

              {/* Weight Log */}
              <div className="paw-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm">Weight Log</h3>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowWeightForm(!showWeightForm)}>
                    <Plus className="w-3 h-3 mr-1" />Log Weight
                  </Button>
                </div>
                {showWeightForm && (
                  <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Date:</span>
                      <DatePick date={weightDate} onSelect={setWeightDate} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Weight" type="number" value={weightVal} onChange={(e) => setWeightVal(e.target.value)} className="flex-1 h-8 text-sm" />
                      <span className="text-xs text-muted-foreground">kg</span>
                    </div>
                    <Input placeholder="Notes (optional)" value={weightNotes} onChange={(e) => setWeightNotes(e.target.value)} className="h-8 text-sm" />
                    <Button size="sm" className="w-full h-8" onClick={saveWeight}>Save</Button>
                  </div>
                )}
                {chartData.length > 1 && (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
                {idealWeight && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-xs font-semibold">Ideal weight for {activePet.name}</p>
                    <p className="text-sm font-bold mt-1">Expected: {idealWeight.min} – {idealWeight.max} kg</p>
                    {latestWeight !== null ? (
                      <p className={`text-xs font-semibold mt-1 ${weightStatus?.color}`}>
                        Current: {latestWeight} kg {weightStatus?.icon} {weightStatus?.label}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-1">➕ Log your pet's weight to see status</p>
                    )}
                  </div>
                )}
              </div>

              {/* Food Log */}
              <div className="paw-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-heading font-semibold text-sm">Food Log</h3>
                  <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => setShowFoodForm(!showFoodForm)}>
                    <Plus className="w-3 h-3 mr-1" />Log Food
                  </Button>
                </div>
                {showFoodForm && (
                  <div className="space-y-2 mb-3 p-3 bg-muted/50 rounded-lg">
                    <div className="flex gap-1 flex-wrap">
                      {["Breakfast", "Lunch", "Dinner", "Snack"].map((m) => (
                        <button key={m} onClick={() => setMealType(m)}
                          className={`text-xs px-2.5 py-1 rounded-full ${mealType === m ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{m}</button>
                      ))}
                    </div>
                    <Input placeholder="Food name" value={foodName} onChange={(e) => setFoodName(e.target.value)} className="h-8 text-sm" />
                    <div className="flex gap-2">
                      <Input placeholder="Quantity" type="number" value={foodQty} onChange={(e) => setFoodQty(e.target.value)} className="flex-1 h-8 text-sm" />
                      <select value={foodUnit} onChange={(e) => setFoodUnit(e.target.value)} className="h-8 text-xs rounded-md border border-input bg-background px-2">
                        <option value="grams">grams</option><option value="ml">ml</option><option value="cups">cups</option>
                      </select>
                    </div>
                    <Button size="sm" className="w-full h-8" onClick={saveFood}>Save</Button>
                  </div>
                )}
                {(foodLogs as any[]).length > 0 ? (
                  <div className="space-y-1.5">
                    {(foodLogs as any[]).map((f: any) => (
                      <div key={f.id} className="flex items-center gap-2 text-xs">
                        <span>{mealIcons[f.meal_type] || "🍽️"}</span>
                        <span className="font-medium">{f.meal_type}:</span>
                        <span className="text-muted-foreground">{f.food_name} · {f.quantity}{f.unit}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-muted-foreground mt-1">Total today: {totalFoodToday}g across {(foodLogs as any[]).length} meals</p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No food logged today</p>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: VACCINES */}
            <TabsContent value="vaccines" className="space-y-4 mt-3">
              {(vaccinations as any[]).length > 0 ? (
                <div className="space-y-2">
                  {(vaccinations as any[]).map((v: any) => {
                    const isOverdue = v.status !== "done" && v.due_date && new Date(v.due_date) < new Date();
                    const statusDot = v.status === "done" ? "bg-secondary" : isOverdue ? "bg-destructive" : "bg-amber-400";
                    return (
                      <div key={v.id} className="paw-card p-3 flex gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${statusDot}`} />
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{v.vaccine_name}</p>
                          {v.administered_date && <p className="text-xs text-muted-foreground">Administered: {format(new Date(v.administered_date), "dd MMM yyyy")}</p>}
                          {v.due_date && <p className="text-xs text-muted-foreground">Next due: {format(new Date(v.due_date), "dd MMM yyyy")}</p>}
                          {v.vet_name && <p className="text-xs text-muted-foreground">Vet: {v.vet_name}</p>}
                        </div>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize self-start ${v.status === "done" ? "bg-secondary/10 text-secondary" : isOverdue ? "bg-destructive/10 text-destructive" : "bg-amber-100 text-amber-700"}`}>
                          {isOverdue ? "overdue" : v.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-6">No vaccines recorded yet</p>
              )}

              <Button variant="outline" className="w-full" onClick={() => setShowVaccForm(!showVaccForm)}>
                <Plus className="w-4 h-4 mr-1" />Add Vaccine
              </Button>

              {showVaccForm && (
                <div className="paw-card p-4 space-y-3">
                  <div className="flex gap-1.5 flex-wrap">
                    {vaccChips.map((c) => (
                      <button key={c} onClick={() => setVaccName(c)}
                        className={`text-xs px-2.5 py-1 rounded-full ${vaccName === c ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{c}</button>
                    ))}
                  </div>
                  <Input placeholder="Vaccine name" value={vaccName} onChange={(e) => setVaccName(e.target.value)} className="h-8 text-sm" />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Administered:</span>
                    <DatePick date={vaccDate} onSelect={setVaccDate} />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Due date:</span>
                    <DatePick date={vaccDueDate || new Date()} onSelect={setVaccDueDate} />
                  </div>
                  <Input placeholder="Vet name (optional)" value={vaccVet} onChange={(e) => setVaccVet(e.target.value)} className="h-8 text-sm" />
                  <div className="flex gap-2">
                    {[{ v: "done", l: "✅ Done" }, { v: "upcoming", l: "⏳ Upcoming" }].map((s) => (
                      <button key={s.v} onClick={() => setVaccStatus(s.v)}
                        className={`text-xs px-3 py-1.5 rounded-full ${vaccStatus === s.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s.l}</button>
                    ))}
                  </div>
                  <Button size="sm" className="w-full" onClick={saveVaccine}>Save Vaccine</Button>
                </div>
              )}

              {/* Vaccination Card Upload */}
              <div className="paw-card p-4">
                <h3 className="font-heading font-semibold text-sm mb-2">Vaccination Card</h3>
                {(allRecords as any[]).filter((r: any) => r.record_type === "vaccination_card").length > 0 ? (
                  <div className="space-y-2">
                    {(allRecords as any[]).filter((r: any) => r.record_type === "vaccination_card").slice(0, 1).map((r: any) => (
                      <div key={r.id}>
                        <p className="text-xs text-muted-foreground">📄 {r.file_name || "Uploaded file"}</p>
                        <p className="text-[10px] text-muted-foreground">Uploaded: {r.created_at ? format(new Date(r.created_at), "MMM d, yyyy") : ""}</p>
                        <Button variant="outline" size="sm" className="text-xs mt-1" onClick={() => handleViewRecord(r)}>View / Download</Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <button onClick={() => fileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                      <p className="text-xs text-muted-foreground">{uploading ? "Uploading..." : "Upload vaccination card (PDF or image)"}</p>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf" className="hidden"
                      onChange={(e) => { if (e.target.files?.[0]) uploadVaccCard(e.target.files[0]); }} />
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 3: DOCUMENTS */}
            <TabsContent value="documents" className="space-y-4 mt-3">
              <Button onClick={() => setShowDocUpload(true)} className="w-full">
                <Upload className="w-4 h-4 mr-2" /> Upload Document
              </Button>

              {/* Document upload modal */}
              {showDocUpload && (
                <div className="paw-card p-4 space-y-3">
                  <h3 className="font-heading font-semibold text-sm">Upload Document</h3>
                  
                  <div>
                    <label className="text-xs font-body font-bold text-muted-foreground mb-1 block">Document Category *</label>
                    <Select value={docCategory} onValueChange={setDocCategory}>
                      <SelectTrigger className="rounded-[16px] bg-surface-alt border-[1.5px] border-border">
                        <SelectValue placeholder="Select category..." />
                      </SelectTrigger>
                      <SelectContent>
                        {documentCategories.map((c) => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-xs font-body font-bold text-muted-foreground mb-1 block">Document Date *</label>
                    <DatePick date={docDate} onSelect={setDocDate} />
                  </div>

                  <Input placeholder="e.g. Rabies vaccine - Dr. Mehta (optional)" value={docName} onChange={(e) => setDocName(e.target.value)} className="text-sm" />

                  <div>
                    <button onClick={() => docFileInputRef.current?.click()}
                      className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <Upload className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">PDF, JPG, PNG · Max 500KB</p>
                    </button>
                    <input ref={docFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleDocFileSelect} />
                    {docFile && !docFileError && (
                      <p className="text-xs text-secondary mt-1 font-body">✅ Selected: {docFile.name} ({Math.round(docFile.size / 1024)} KB)</p>
                    )}
                    {docFileError && (
                      <p className="text-xs text-destructive mt-1 font-body">❌ {docFileError}</p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => { setShowDocUpload(false); setDocFile(null); setDocFileError(""); }}>Cancel</Button>
                    <Button className="flex-1" disabled={!docFile || !docCategory || !!docFileError || docUploading} onClick={saveDocument}>
                      {docUploading ? "Uploading..." : "Save Document"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Grouped document list */}
              {Object.keys(groupedDocs).length === 0 && !showDocUpload ? (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-2">📁</span>
                  <p className="text-sm text-muted-foreground font-body">No documents uploaded yet</p>
                  <p className="text-xs text-muted-foreground mt-1 font-body">Upload vaccination cards, bills, prescriptions & more</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documentCategories.map((cat) => {
                    const docs = groupedDocs[cat.value] || [];
                    if (docs.length === 0) return null;
                    const isExpanded = expandedCats.includes(cat.value);
                    return (
                      <div key={cat.value} className="paw-card overflow-hidden">
                        <button onClick={() => toggleCat(cat.value)} className="w-full flex items-center justify-between p-3">
                          <span className="text-sm font-heading font-semibold">{cat.label} ({docs.length})</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 space-y-2">
                            {docs.map((doc: any) => (
                              <div key={doc.id} className="flex items-start gap-3 p-2 bg-muted/30 rounded-lg">
                                <span className="text-lg mt-0.5">{getFileIcon(doc.file_name)}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold truncate">{doc.notes || doc.file_name || "Document"}</p>
                                  <p className="text-[10px] text-muted-foreground">
                                    {doc.document_date ? format(new Date(doc.document_date), "dd MMM yyyy") : ""} · {doc.file_size_kb || "?"} KB · {doc.file_name?.split(".").pop()?.toUpperCase()}
                                  </p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                  <button onClick={() => handleViewRecord(doc)} className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center" title="View">
                                    <EyeIcon className="w-3.5 h-3.5 text-primary" />
                                  </button>
                                  <button onClick={() => handleDeleteRecord(doc)} className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center" title="Delete">
                                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* TAB 4: GROWTH */}
            <TabsContent value="growth" className="space-y-4 mt-3">
              {growthData.length > 1 ? (
                <div className="paw-card p-4">
                  <h3 className="font-heading font-semibold text-sm mb-3">Growth Chart</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <ComposedChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
                      <Tooltip />
                      {idealWeight && (
                        <>
                          <Area type="monotone" dataKey="idealMax" stroke="none" fill="hsl(142 76% 36% / 0.12)" />
                          <Area type="monotone" dataKey="idealMin" stroke="none" fill="hsl(var(--background))" />
                        </>
                      )}
                      <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                  {idealWeight && <p className="text-[10px] text-muted-foreground mt-1">Green band: ideal weight range ({idealWeight.min}–{idealWeight.max} kg)</p>}
                </div>
              ) : (
                <div className="text-center py-10">
                  <span className="text-4xl block mb-2">📈</span>
                  <p className="text-sm text-muted-foreground">Log at least 2 weights to see the growth chart</p>
                </div>
              )}

              {weightLogs.length > 0 && (
                <div className="paw-card p-4">
                  <h3 className="font-heading font-semibold text-sm mb-2">Stats</h3>
                  <div className="flex justify-between text-xs">
                    <div><span className="text-muted-foreground">Lowest:</span> <span className="font-bold">{Math.min(...(weightLogs as any[]).map((l: any) => Number(l.weight_kg)))} kg</span></div>
                    <div><span className="text-muted-foreground">Highest:</span> <span className="font-bold">{Math.max(...(weightLogs as any[]).map((l: any) => Number(l.weight_kg)))} kg</span></div>
                    <div>
                      <span className="text-muted-foreground">Change:</span>{" "}
                      <span className="font-bold">
                        {(Number((weightLogs as any[])[weightLogs.length - 1]?.weight_kg) - Number((weightLogs as any[])[0]?.weight_kg)).toFixed(1)} kg
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </MobileLayout>
  );
};

export default PetDigiLockerScreen;
