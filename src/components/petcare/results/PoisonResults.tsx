import { useMemo, useState } from "react";
import { WarningIcon } from "@/components/icons/PetosauraIcons";
import petCareData from "@/data/petcare-data.json";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import { appliesToPet, severityClass } from "@/lib/petCareHelpers";

interface ToxicItem {
  name: string;
  toxic_to?: string[];
  severity?: string;
  symptoms?: string;
  toxin?: string;
  note?: string;
}

interface Props {
  petType: string;
}

const PoisonResults = ({ petType }: Props) => {
  const [search, setSearch] = useState("");
  const cats = petCareData.poisonPrevention.categories as Record<string, { label: string; items: ToxicItem[] }>;

  const filterAndSearch = (items: ToxicItem[]) =>
    items.filter((it) => appliesToPet(it.toxic_to, petType))
         .filter((it) => !search || it.name.toLowerCase().includes(search.toLowerCase()));

  const foods = useMemo(() => filterAndSearch(cats.foods.items), [search, petType]);
  const plants = useMemo(() => filterAndSearch(cats.plants.items), [search, petType]);
  const household = useMemo(() => filterAndSearch(cats.household.items), [search, petType]);

  return (
    <div className="space-y-3">
      {/* Emergency contacts banner */}
      <div className="rounded-[18px] border-2 border-[hsl(0_70%_60%)] bg-[hsl(0_85%_96%)] p-3">
        <div className="flex items-center gap-2 mb-2">
          <WarningIcon className="w-4 h-4 text-[hsl(0_75%_40%)]" />
          <p className="text-[13px] font-heading font-bold text-[hsl(0_75%_40%)]">🚨 Suspected poisoning? Call immediately:</p>
        </div>
        <ul className="text-[12px] font-body text-[hsl(0_70%_30%)] space-y-1">
          {petCareData.poisonPrevention.emergencyContacts.india.map((c) => (
            <li key={c}>• {c}</li>
          ))}
          <li className="font-heading font-bold mt-1">Rush to nearest vet — do not wait.</li>
        </ul>
      </div>

      <Tabs defaultValue="foods">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="foods">🍖 Foods</TabsTrigger>
          <TabsTrigger value="plants">🌿 Plants</TabsTrigger>
          <TabsTrigger value="household">🏠 Household</TabsTrigger>
        </TabsList>

        <Input
          placeholder="Search toxic items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mt-3"
        />

        <TabsContent value="foods" className="mt-3 space-y-2">
          {foods.map((it) => <ToxicCard key={it.name} item={it} />)}
          {foods.length === 0 && <Empty />}
        </TabsContent>

        <TabsContent value="plants" className="mt-3 space-y-2">
          {plants.map((it) => <ToxicCard key={it.name} item={it} indiaCommon={["Oleander (Kaner)","Sago Palm"].includes(it.name)} />)}
          {plants.length === 0 && <Empty />}
        </TabsContent>

        <TabsContent value="household" className="mt-3 space-y-2">
          {household.map((it) => <ToxicCard key={it.name} item={it} />)}
          {household.length === 0 && <Empty />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

const Empty = () => (
  <div className="rounded-[18px] bg-muted p-4 text-center text-[12px] text-muted-foreground font-body">
    No matches.
  </div>
);

const ToxicCard = ({ item, indiaCommon }: { item: ToxicItem; indiaCommon?: boolean }) => {
  const sev = severityClass(item.severity);
  const isCritical = item.severity === "CRITICAL";
  return (
    <div
      className={`rounded-[18px] bg-card border border-border p-3 shadow-petosauras ${isCritical ? "border-l-4" : ""}`}
      style={isCritical ? { borderLeftColor: "hsl(0 70% 55%)" } : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-heading font-bold text-[14px] leading-tight">{item.name}</h4>
          {item.toxin && <p className="text-[11px] text-muted-foreground font-body mt-0.5">{item.toxin}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          {item.severity && (
            <span className={`text-[10px] font-heading font-bold px-2 py-0.5 rounded-full ${sev.bg} ${sev.text}`}>
              {item.severity}
            </span>
          )}
          {indiaCommon && (
            <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-[hsl(40_95%_92%)] text-[hsl(35_85%_38%)]">
              ⚠️ Common in India
            </span>
          )}
        </div>
      </div>
      {item.symptoms && <p className="text-[12px] italic mt-2 font-body text-foreground/80">{item.symptoms}</p>}
      {item.note && <p className="text-[11px] text-muted-foreground font-body mt-2">{item.note}</p>}
    </div>
  );
};

export default PoisonResults;
