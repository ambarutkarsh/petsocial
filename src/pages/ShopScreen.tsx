import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlusIcon } from "@/components/icons/PetosauraIcons";
import { Calendar, Sparkles, Home, Syringe, FileText, FolderOpen, TrendingUp, Bell } from "lucide-react";

import PetDigiLockerScreen from "./PetDigiLockerScreen";
import PetIdentityCard from "@/components/mypet/PetIdentityCard";
import OverviewTab from "@/components/mypet/OverviewTab";
import HealthRecordsPanel from "@/components/mypet/HealthRecordsPanel";
import DocumentsLocker from "@/components/mypet/DocumentsLocker";
import RemindersTab from "@/components/mypet/RemindersTab";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import AddPetSheet from "@/components/AddPetSheet";

const MyPetScreen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedPetId, setSelectedPetId] = useState<string | null>(searchParams.get("pet"));
  const [activeTab, setActiveTab] = useState<string>(searchParams.get("tab") || "overview");

  useEffect(() => {
    const p = searchParams.get("pet");
    if (p) setSelectedPetId(p);
    const t = searchParams.get("tab");
    if (t) setActiveTab(t);
  }, [searchParams]);

  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pets")
        .select("*")
        .eq("owner_id", user!.id)
        .order("is_primary", { ascending: false });
      return data || [];
    },
  });

  const activePet = pets.find((p: any) => p.id === selectedPetId) || pets[0];

  const handlePetSwitch = (id: string) => {
    setSelectedPetId(id);
    const params = new URLSearchParams(searchParams);
    params.set("pet", id);
    setSearchParams(params, { replace: true });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams);
    params.set("tab", tab);
    setSearchParams(params, { replace: true });
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
              <PlusIcon className="w-4 h-4" /> Add Pet
            </Button>
          </div>
        </div>
        <BottomNav onPostClick={() => setShowCreate(true)} />
        <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
        <AddPetSheet open={showAddPet} onClose={() => setShowAddPet(false)} />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <div className="px-4 pt-3 flex items-center justify-between gap-2">
          <h1 className="font-heading font-bold text-2xl">MyPet</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/mypet/book-a-vet")}
              className="inline-flex items-center gap-1.5 text-[11px] font-body font-bold px-3 py-2 rounded-full bg-primary text-primary-foreground shadow-petosauras"
            >
              <Calendar className="w-3.5 h-3.5" /> Book Vet
            </button>
            <button
              onClick={() => navigate("/mypet/pet-recommender")}
              className="inline-flex items-center gap-1.5 text-[11px] font-body font-bold px-3 py-2 rounded-full bg-accent text-accent-foreground shadow-petosauras"
            >
              <Sparkles className="w-3.5 h-3.5" /> Pet Recommender
            </button>
          </div>
        </div>

        {/* Pet selector */}
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {pets.map((p: any) => (
            <button
              key={p.id}
              onClick={() => handlePetSwitch(p.id)}
              className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                p.id === activePet?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-foreground border border-border"
              }`}
            >
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
              ) : (
                <span className="text-base">{p.avatar_emoji || "🐾"}</span>
              )}
              {p.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddPet(true)}
            className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold border-2 border-primary text-primary bg-card"
          >
            <PlusIcon className="w-3 h-3" /> Add
          </button>
        </div>

        {/* Pet identity card */}
        <div className="px-4 mt-3">
          <PetIdentityCard pet={activePet} />
        </div>

        {/* Tabs */}
        <div className="px-4 mt-3">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="rounded-2xl bg-card border border-border p-1.5 overflow-x-auto no-scrollbar">
              <div className="grid grid-cols-6 min-w-[420px] gap-1">
                <IconTab active={activeTab === "overview"} icon={<Home className="w-4 h-4" />} label="Overview" onClick={() => handleTabChange("overview")} />
                <IconTab active={activeTab === "vaccines"} icon={<Syringe className="w-4 h-4" />} label="Vaccines" onClick={() => handleTabChange("vaccines")} />
                <IconTab active={activeTab === "reports"} icon={<FileText className="w-4 h-4" />} label="Reports" onClick={() => handleTabChange("reports")} />
                <IconTab active={activeTab === "documents"} icon={<FolderOpen className="w-4 h-4" />} label="Documents" onClick={() => handleTabChange("documents")} />
                <IconTab active={activeTab === "growth"} icon={<TrendingUp className="w-4 h-4" />} label="Growth" onClick={() => handleTabChange("growth")} />
                <IconTab active={activeTab === "reminders"} icon={<Bell className="w-4 h-4" />} label="Reminders" onClick={() => handleTabChange("reminders")} />
              </div>
            </div>

            <TabsContent value="overview" className="mt-4">
              <OverviewTab
                petId={activePet.id}
                petName={activePet.name}
                onTabChange={handleTabChange}
              />
            </TabsContent>

            <TabsContent value="vaccines" className="mt-4">
              <HealthRecordsPanel
                petId={activePet.id}
                recordType="vaccine"
                defaultDocumentType="vaccination_certificate"
              />
            </TabsContent>

            <TabsContent value="reports" className="mt-4">
              <HealthRecordsPanel
                petId={activePet.id}
                recordType="lab_report"
                defaultDocumentType="lab_report"
              />
            </TabsContent>

            <TabsContent value="documents" className="mt-4">
              <DocumentsLocker petId={activePet.id} petName={activePet.name} />
            </TabsContent>

            <TabsContent value="growth" className="mt-4">
              <PetDigiLockerScreen embedded activeTab="growth" petId={activePet.id} />
            </TabsContent>

            <TabsContent value="reminders" className="mt-4">
              <RemindersTab petId={activePet.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <PostUploadModal open={showCreate} onClose={() => setShowCreate(false)} />
      <AddPetSheet open={showAddPet} onClose={() => setShowAddPet(false)} />
    </MobileLayout>
  );
};

const IconTab = ({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 rounded-xl transition-colors ${
      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted/40"
    }`}
  >
    {icon}
    <span className="text-[10px] font-body font-semibold">{label}</span>
  </button>
);

export default MyPetScreen;
