import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Pencil, Check, X, Plus } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import AddPetSheet from "@/components/AddPetSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { differenceInYears, differenceInMonths, format } from "date-fns";
import { petTypes, breedsByType } from "@/lib/registrationData";
import PetDigiLockerScreen from "./PetDigiLockerScreen";

const MyPetScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState<any>({});

  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", user!.id).order("is_primary", { ascending: false });
      return data || [];
    },
  });

  const activePet = pets.find((p: any) => p.id === selectedPetId) || pets[0];

  const petAge = useMemo(() => {
    if (!activePet?.date_of_birth) return activePet?.age_years ? `${activePet.age_years} years` : "Not set";
    const dob = new Date(activePet.date_of_birth);
    const yrs = differenceInYears(new Date(), dob);
    const mos = differenceInMonths(new Date(), dob) % 12;
    return `${yrs} years ${mos} months`;
  }, [activePet]);

  const startEdit = (field: string, value: any) => {
    setEditing(field);
    setDraft({ ...draft, [field]: value });
  };

  const saveField = async (field: string, value: any) => {
    if (!activePet) return;
    const update: any = { [field]: value };
    const { error } = await supabase.from("pets").update(update).eq("id", activePet.id);
    if (error) { toast.error("Save failed"); return; }
    toast.success("Pet profile updated! 🐾");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["my-pets"] });
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePet || !user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${activePet.id}/avatar_${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upErr) { toast.error("Upload failed"); return; }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("pets").update({ avatar_url: urlData.publicUrl }).eq("id", activePet.id);
    qc.invalidateQueries({ queryKey: ["my-pets"] });
    toast.success("Pet photo updated! 📸");
  };

  if (pets.length === 0) {
    return (
      <MobileLayout>
        <div className="px-5 pt-4 pb-20">
          <h1 className="font-heading font-bold text-xl mb-1">MyPet</h1>
          <p className="text-xs text-muted-foreground font-body">Add your first pet to get started</p>
          <div className="text-center py-16">
            <span className="text-6xl block mb-3">🐾</span>
            <Button onClick={() => setShowAddPet(true)}>
              <Plus className="w-4 h-4" /> Add Pet
            </Button>
          </div>
        </div>
        <BottomNav onPostClick={() => setShowCreate(true)} />
        <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
        <AddPetSheet open={showAddPet} onClose={() => setShowAddPet(false)} />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Pet selector */}
        {pets.length > 1 && (
          <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
            {pets.map((p: any) => (
              <button key={p.id} onClick={() => setSelectedPetId(p.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${p.id === activePet?.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {p.avatar_emoji || "🐾"} {p.name}
              </button>
            ))}
            <button onClick={() => setShowAddPet(true)} className="shrink-0 px-3 py-1.5 rounded-full text-sm font-bold border-2 border-primary text-primary">
              <Plus className="w-3 h-3 inline" /> Add
            </button>
          </div>
        )}

        <div className="px-4 mt-3">
          <Tabs defaultValue="profile">
            <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="profile" className="text-xs whitespace-nowrap">🐾 MyPet</TabsTrigger>
                <TabsTrigger value="health" className="text-xs whitespace-nowrap">📊 Health Log</TabsTrigger>
                <TabsTrigger value="vaccines" className="text-xs whitespace-nowrap">💉 Vaccines</TabsTrigger>
                <TabsTrigger value="docs" className="text-xs whitespace-nowrap">📂 Documents</TabsTrigger>
                <TabsTrigger value="growth" className="text-xs whitespace-nowrap">📈 Growth</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="profile" className="mt-4">
              <div className="paw-card p-5">
                {/* Avatar */}
                <div className="flex justify-center">
                  <div className="relative w-[120px] h-[120px]">
                    {activePet.avatar_url ? (
                      <img src={activePet.avatar_url} alt="" className="w-full h-full rounded-full object-cover border-4 border-card shadow-petosauras-md" />
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary-light flex items-center justify-center text-6xl border-4 border-card shadow-petosauras-md">
                        {activePet.avatar_emoji || "🐾"}
                      </div>
                    )}
                    <button onClick={() => fileRef.current?.click()} className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-petosauras">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </div>
                </div>

                {/* Fields */}
                <div className="mt-5 space-y-3">
                  {/* Name */}
                  <Field label="Name">
                    {editing === "name" ? (
                      <div className="flex gap-1">
                        <Input value={draft.name || ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="h-9" />
                        <Button size="sm" onClick={() => saveField("name", draft.name)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-body font-semibold">{activePet.name}</span>
                        <button onClick={() => startEdit("name", activePet.name)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    )}
                  </Field>

                  {/* Pet type */}
                  <Field label="Pet Type">
                    {editing === "pet_type" ? (
                      <div className="flex gap-1">
                        <select value={draft.pet_type} onChange={(e) => setDraft({ ...draft, pet_type: e.target.value })} className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm">
                          {petTypes.map(p => <option key={p.label} value={p.label}>{p.emoji} {p.label}</option>)}
                        </select>
                        <Button size="sm" onClick={() => saveField("pet_type", draft.pet_type)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-body">{activePet.avatar_emoji || "🐾"} {activePet.pet_type}</span>
                        <button onClick={() => startEdit("pet_type", activePet.pet_type)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    )}
                  </Field>

                  {/* Breed */}
                  <Field label="Breed / Species">
                    {editing === "species" ? (
                      <div className="flex gap-1">
                        <select value={draft.species || ""} onChange={(e) => setDraft({ ...draft, species: e.target.value })} className="flex-1 h-9 rounded-md border border-input bg-background px-2 text-sm">
                          <option value="">Select</option>
                          {(breedsByType[activePet.pet_type] || []).map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                        <Button size="sm" onClick={() => saveField("species", draft.species)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-body">{activePet.species || "Not set"}</span>
                        <button onClick={() => startEdit("species", activePet.species)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    )}
                  </Field>

                  {/* DOB */}
                  <Field label="Date of Birth">
                    {editing === "date_of_birth" ? (
                      <div className="flex gap-1">
                        <Input type="date" value={draft.date_of_birth || ""} onChange={(e) => setDraft({ ...draft, date_of_birth: e.target.value })} className="h-9" />
                        <Button size="sm" onClick={() => saveField("date_of_birth", draft.date_of_birth)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body">{activePet.date_of_birth ? format(new Date(activePet.date_of_birth), "dd MMM yyyy") : "Not set"}</p>
                          <p className="text-[11px] text-muted-foreground">{petAge}</p>
                        </div>
                        <button onClick={() => startEdit("date_of_birth", activePet.date_of_birth || "")}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    )}
                  </Field>

                  {/* Gender */}
                  <Field label="Gender">
                    {editing === "gender" ? (
                      <div className="flex gap-1">
                        <button onClick={() => setDraft({ ...draft, gender: "Male" })} className={`flex-1 h-9 rounded-md text-sm ${draft.gender === "Male" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Male</button>
                        <button onClick={() => setDraft({ ...draft, gender: "Female" })} className={`flex-1 h-9 rounded-md text-sm ${draft.gender === "Female" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>Female</button>
                        <Button size="sm" onClick={() => saveField("gender", draft.gender)}><Check className="w-4 h-4" /></Button>
                        <Button size="sm" variant="outline" onClick={() => setEditing(null)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-body">{activePet.gender || "Not set"}</span>
                        <button onClick={() => startEdit("gender", activePet.gender)}><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      </div>
                    )}
                  </Field>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="health"><PetDigiLockerScreen embedded activeTab="health" /></TabsContent>
            <TabsContent value="vaccines"><PetDigiLockerScreen embedded activeTab="vaccines" /></TabsContent>
            <TabsContent value="docs"><PetDigiLockerScreen embedded activeTab="documents" /></TabsContent>
            <TabsContent value="growth"><PetDigiLockerScreen embedded activeTab="growth" /></TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
      <AddPetSheet open={showAddPet} onClose={() => setShowAddPet(false)} />
    </MobileLayout>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <p className="text-[11px] text-muted-foreground font-body uppercase tracking-wide mb-1">{label}</p>
    {children}
  </div>
);

export default MyPetScreen;
