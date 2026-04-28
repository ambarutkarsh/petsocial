import { AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Weather } from "@/lib/petCareHelpers";
import { useState } from "react";
import petCareData from "@/data/petcare-data.json";
import { ArrowLeft } from "lucide-react";
import { CheckIcon, BackIcon, Tabs, TabsContent } from "@/components/ui/tabs";
import { Accordion, TabsList, TabsTrigger } from "@/components/icons/PetosauraIcons";

interface Props {
  weather: Weather;
}

type TopicId =
  | "carTravel" | "withKids" | "homeSafety" | "eldersSafety" | "pregnantPet"
  | "weatherSafety" | "firstAid" | "foodSafety" | "biteSafety" | "parasiteSafety";

const TOPICS: { id: TopicId; emoji: string; title: string; }[] = [
  { id: "carTravel",      emoji: "🚗", title: "Car Travel" },
  { id: "withKids",       emoji: "👶", title: "With Kids" },
  { id: "homeSafety",     emoji: "🏠", title: "Home Safety" },
  { id: "eldersSafety",   emoji: "👴", title: "With Elderly" },
  { id: "pregnantPet",    emoji: "🤰", title: "Pregnant Pet" },
  { id: "weatherSafety",  emoji: "🌤️", title: "Weather Safety" },
  { id: "firstAid",       emoji: "🩹", title: "First Aid" },
  { id: "foodSafety",     emoji: "🍖", title: "Food Safety" },
  { id: "parasiteSafety", emoji: "🦟", title: "Parasite Safety" },
  { id: "biteSafety",     emoji: "🐕", title: "Bite Safety" },
];

const SafetyResults = ({ weather }: Props) => {
  const [topic, setTopic] = useState<TopicId | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safety = petCareData.safety as any;

  const countTips = (id: TopicId): number => {
    const node = safety[id];
    if (!node) return 0;
    return (node.tips?.length ?? 0) + (node.rules?.length ?? 0)
         + (node.forOwners?.length ?? 0) + (node.preventingBites?.length ?? 0)
         + (node.kitContents?.length ?? 0) + (node.basicProcedures?.length ?? 0)
         + (node.commonParasites?.length ?? 0)
         + (node.summer?.tips?.length ?? 0);
  };

  if (!topic) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTopic(t.id)}
            className="text-left rounded-[18px] bg-card border border-border p-3 shadow-petosauras hover:shadow-petosauras-md transition-all active:scale-[0.97]"
          >
            <div className="text-[28px] mb-1">{t.emoji}</div>
            <p className="font-heading font-bold text-[13px] leading-tight">{t.title}</p>
            <p className="text-[10px] text-muted-foreground font-body mt-0.5">{countTips(t.id)} tips →</p>
          </button>
        ))}
      </div>
    );
  }

  const def = TOPICS.find((t) => t.id === topic)!;
  const node = safety[topic];

  return (
    <div className="space-y-3">
      <button
        onClick={() => setTopic(null)}
        className="flex items-center gap-1 text-[12px] font-heading font-bold text-primary"
      >
        <BackIcon className="w-3.5 h-3.5" /> Back to safety topics
      </button>

      <div className="text-center py-2">
        <div className="text-[44px]">{def.emoji}</div>
        <h2 className="font-heading font-bold text-[20px] mt-1">{def.title}</h2>
      </div>

      {/* Simple tip lists */}
      {topic === "carTravel" && <NumberedList items={node.tips} />}
      {topic === "withKids" && <NumberedList items={node.rules} />}
      {topic === "homeSafety" && <NumberedList items={node.tips} />}
      {topic === "eldersSafety" && <NumberedList items={node.tips} />}
      {topic === "foodSafety" && <NumberedList items={node.tips} />}

      {topic === "biteSafety" && (
        <div className="space-y-3">
          <Section title="For Owners"><NumberedList items={node.forOwners} /></Section>
          <Section title="Preventing Bites"><NumberedList items={node.preventingBites} /></Section>
        </div>
      )}

      {topic === "pregnantPet" && (
        <div className="space-y-3">
          <NumberedList items={node.tips} />
          {node.emergencySigns && (
            <div className="rounded-[18px] border-2 border-[hsl(0_70%_60%)] bg-[hsl(0_85%_96%)] p-3">
              <p className="font-heading font-bold text-[13px] text-[hsl(0_75%_40%)] mb-2">🚨 Emergency signs</p>
              <ul className="space-y-1 text-[12px] font-body text-[hsl(0_70%_30%)] list-disc list-inside">
                {(node.emergencySigns as string[]).map((s) => <li key={s}>{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      {topic === "weatherSafety" && (
        <Tabs defaultValue={weather}>
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="summer">☀️ Summer</TabsTrigger>
            <TabsTrigger value="monsoon">🌧️ Monsoon</TabsTrigger>
            <TabsTrigger value="winter">❄️ Winter</TabsTrigger>
          </TabsList>
          {(["summer","monsoon","winter"] as Weather[]).map((s) => (
            <TabsContent key={s} value={s} className="mt-3"><NumberedList items={node[s]?.tips ?? []} /></TabsContent>
          ))}
        </Tabs>
      )}

      {topic === "firstAid" && <FirstAid node={node} />}

      {topic === "parasiteSafety" && (
        <Tabs defaultValue="dogs">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="dogs">🐕 Dogs</TabsTrigger>
            <TabsTrigger value="cats">🐈 Cats</TabsTrigger>
          </TabsList>
          {(["dogs","cats"] as const).map((sp) => (
            <TabsContent key={sp} value={sp} className="mt-3 space-y-3">
              <Section title="Schedule">
                <ul className="space-y-2">
                  {(node.schedule[sp] as string[]).map((s, i) => (
                    <li key={i} className="flex gap-2 text-[12px] font-body">
                      <span className="text-primary font-heading font-bold">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Section>
              <Section title="Common Parasites">
                <Accordion type="multiple" className="space-y-1">
                  {(node.commonParasites as { name: string; risk: string; action: string }[]).map((p) => (
                    <AccordionItem key={p.name} value={p.name} className="border-b border-border last:border-0">
                      <AccordionTrigger className="text-[13px] font-heading font-bold py-2">{p.name}</AccordionTrigger>
                      <AccordionContent className="space-y-1.5 text-[12px] font-body pb-3">
                        <p><strong>Risk:</strong> {p.risk}</p>
                        <p><strong>Action:</strong> {p.action}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Section>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};

const NumberedList = ({ items }: { items: string[] }) => (
  <div className="space-y-2">
    {items?.map((tip, i) => (
      <div key={i} className="flex gap-3 p-3 rounded-[14px] bg-card border border-border">
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-heading font-bold shrink-0">
          {i + 1}
        </span>
        <span className="text-[13px] font-body text-foreground/90">{tip}</span>
      </div>
    ))}
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h3 className="font-heading font-bold text-[14px] mb-2">{title}</h3>
    {children}
  </div>
);

const FirstAid = ({ node }: { node: { kitContents: string[]; basicProcedures: { situation: string; action: string }[] } }) => {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  return (
    <div className="space-y-4">
      <Section title="Your Pet First Aid Kit">
        <div className="space-y-1.5">
          {node.kitContents.map((it) => (
            <button
              key={it}
              onClick={() => setChecked((c) => ({ ...c, [it]: !c[it] }))}
              className="w-full flex items-center gap-3 p-2.5 rounded-[12px] bg-card border border-border text-left"
            >
              <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                checked[it] ? "bg-primary border-primary" : "border-border"
              }`}>
                {checked[it] && <CheckIcon className="w-3 h-3 text-primary-foreground" strokeWidth={3} />}
              </span>
              <span className={`text-[13px] font-body ${checked[it] ? "line-through text-muted-foreground" : ""}`}>{it}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="What to Do">
        <Accordion type="multiple" className="space-y-1">
          {node.basicProcedures.map((p) => (
            <AccordionItem key={p.situation} value={p.situation} className="border-b border-border last:border-0">
              <AccordionTrigger className="text-[13px] font-heading font-bold py-2 text-left">{p.situation}</AccordionTrigger>
              <AccordionContent className="text-[12px] font-body pb-3">{p.action}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Section>
    </div>
  );
};

export default SafetyResults;
