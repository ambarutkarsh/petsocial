import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PlusIcon } from "@/components/icons/PetosauraIcons";

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
          <h1 className="font-heading font-bold text-xl">MyPet</h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigate("/mypet/book-a-vet")}
              className="text-[11px] font-body font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground shadow-petosauras"
            >
              📅 Book Vet
            </button>
            <button
              onClick={() => navigate("/mypet/pet-recommender")}
              className="text-[11px] font-body font-bold px-3 py-1.5 rounded-full bg-secondary text-secondary-foreground shadow-petosauras"
            >
              ✨ Recommender
            </button>
          </div>
        </div>

        {/* Pet selector */}
        <div className="px-4 pt-3 flex gap-2 overflow-x-auto no-scrollbar">
          {pets.map((p: any) => (
            <button
              key={p.id}
              onClick={() => handlePetSwitch(p.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-bold transition-colors ${
                p.id === activePet?.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {p.avatar_emoji || "🐾"} {p.name}
            </button>
          ))}
          <button
            onClick={() => setShowAddPet(true)}
            className="shrink-0 px-3 py-1.5 rounded-full text-sm font-bold border-2 border-primary text-primary"
          >
            <PlusIcon className="w-3 h-3 inline" /> Add
          </button>
        </div>

        {/* Pet identity card */}
        <div className="px-4 mt-3">
          <PetIdentityCard pet={activePet} />
        </div>

        {/* Tabs */}
        <div className="px-4 mt-3">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="w-full overflow-x-auto no-scrollbar -mx-4 px-4">
              <TabsList className="inline-flex w-auto min-w-full">
                <TabsTrigger value="overview" className="text-xs whitespace-nowrap">
                  🏠 Overview
                </TabsTrigger>
                <TabsTrigger value="vaccines" className="text-xs whitespace-nowrap">
                  💉 Vaccines
                </TabsTrigger>
                <TabsTrigger value="deworming" className="text-xs whitespace-nowrap">
                  🪱 Deworming
                </TabsTrigger>
                <TabsTrigger value="reports" className="text-xs whitespace-nowrap">
                  📊 Reports
                </TabsTrigger>
                <TabsTrigger value="documents" className="text-xs whitespace-nowrap">
                  📂 Documents
                </TabsTrigger>
                <TabsTrigger value="growth" className="text-xs whitespace-nowrap">
                  📈 Growth
                </TabsTrigger>
                <TabsTrigger value="reminders" className="text-xs whitespace-nowrap">
                  ⏰ Reminders
                </TabsTrigger>
              </TabsList>
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

            <TabsContent value="deworming" className="mt-4">
              <HealthRecordsPanel
                petId={activePet.id}
                recordType="deworming"
                defaultDocumentType="prescription"
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

export default MyPetScreen;
