import { useState } from "react";
import petCareData from "@/data/petcare-data.json";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";

interface Props {
  petType: string;
  breed: string;
  age: string;
}

type Space = "small" | "medium" | "large";
const SPACE_OPTIONS: { value: Space; emoji: string; label: string; sub: string }[] = [
  { value: "small",  emoji: "🏢", label: "Small",  sub: "Apartment/flat" },
  { value: "medium", emoji: "🏡", label: "Medium", sub: "House + small garden" },
  { value: "large",  emoji: "🌳", label: "Large",  sub: "House + park access" },
];

const TrainingResults = ({ petType, breed, age }: Props) => {
  const navigate = useNavigate();
  const [space, setSpace] = useState<Space | null>(null);

  if (!["Canine", "Feline"].includes(petType)) {
    return (
      <div className="rounded-[22px] bg-card border border-border p-5 text-center">
        <div className="text-[34px] mb-2">🐾</div>
        <h3 className="font-heading font-bold text-[15px]">Training guides coming soon</h3>
        <p className="text-[13px] text-muted-foreground font-body mt-1">
          Training guidance is currently available for dogs and cats. For birds, reptiles and
          small pets, please consult a specialist trainer.
        </p>
        <Button className="mt-4" onClick={() => navigate("/hub/vet-near-me")}>Find a Vet/Trainer</Button>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="space-y-3">
        <h3 className="font-heading font-bold text-[15px]">How much space do you have for training?</h3>
        <div className="space-y-2">
          {SPACE_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSpace(s.value)}
              className="w-full text-left flex items-center gap-3 p-4 rounded-[18px] border-2 border-border bg-card hover:border-primary transition-colors"
            >
              <span className="text-[28px]">{s.emoji}</span>
              <div>
                <p className="font-heading font-bold text-[14px]">{s.label}</p>
                <p className="text-[12px] text-muted-foreground font-body">{s.sub}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = (petCareData.training.schedule15Days as any)[petType];

  if (petType === "Feline") {
    const w1 = data.week1;
    const w2 = data.week2;
    return (
      <div className="space-y-3">
        <HeaderCard breed={breed} age={age} space={space} />
        {data.note && (
          <div className="rounded-[14px] bg-primary-light p-3 text-[12px] font-body text-primary">{data.note}</div>
        )}
        <WeekCard title="Week 1" focus={w1.focus} bg="hsl(265 50% 92%)">
          {Object.entries(w1.sessions).map(([day, text]) => (
            <DayRow key={day} day={day} text={String(text)} />
          ))}
        </WeekCard>
        <WeekCard title="Week 2" focus={w2.focus} bg="hsl(175 50% 92%)">
          {Object.entries(w2.sessions).map(([day, text]) => (
            <DayRow key={day} day={day} text={String(text)} />
          ))}
        </WeekCard>
      </div>
    );
  }

  // Canine
  const week1 = data.week1;
  const week2 = data.week2;
  const day15 = data.day15;
  const tips: string[] = data.importantTips ?? [];

  return (
    <div className="space-y-3">
      <HeaderCard breed={breed} age={age} space={space} />

      <WeekCard title="Week 1: Foundation Commands" focus={`Sessions: ${week1.sessionDuration} · ${week1.focus}`} bg="hsl(265 50% 92%)">
        <Accordion type="multiple" className="space-y-1">
          {Object.entries(week1.sessions).map(([day, sess]) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const s = sess as any;
            return (
              <AccordionItem key={day} value={day} className="border-b border-border last:border-0">
                <AccordionTrigger className="text-[13px] font-heading font-bold capitalize py-2">{day.replace("day", "Day ")}</AccordionTrigger>
                <AccordionContent className="space-y-2 text-[12px] font-body pb-3">
                  <p><strong>Morning:</strong> {s.morning}</p>
                  <p><strong>Evening:</strong> {s.evening}</p>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </WeekCard>

      {week2 && (
        <WeekCard title="Week 2: Intermediate Skills" focus={week2.focus ?? ""} bg="hsl(175 50% 92%)">
          <Accordion type="multiple" className="space-y-1">
            {Object.entries(week2.sessions ?? {}).map(([day, sess]) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const s = sess as any;
              const isObject = typeof s === "object";
              return (
                <AccordionItem key={day} value={day} className="border-b border-border last:border-0">
                  <AccordionTrigger className="text-[13px] font-heading font-bold capitalize py-2">{day.replace("day", "Day ")}</AccordionTrigger>
                  <AccordionContent className="space-y-2 text-[12px] font-body pb-3">
                    {isObject ? (
                      <>
                        {s.morning && <p><strong>Morning:</strong> {s.morning}</p>}
                        {s.evening && <p><strong>Evening:</strong> {s.evening}</p>}
                      </>
                    ) : (
                      <p>{String(s)}</p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </WeekCard>
      )}

      {day15 && (
        <div className="rounded-[22px] p-4 border-2 border-[hsl(40_85%_60%)] bg-[hsl(40_95%_94%)]">
          <h3 className="font-heading font-bold text-[15px] text-[hsl(35_85%_30%)]">🎓 {day15.label ?? "Day 15 — Graduation!"}</h3>
          {day15.morning && <p className="text-[12px] mt-2 font-body"><strong>Morning:</strong> {day15.morning}</p>}
          {day15.evening && <p className="text-[12px] mt-1 font-body"><strong>Evening:</strong> {day15.evening}</p>}
          {day15.nextSteps && <p className="text-[12px] mt-2 font-body italic text-[hsl(35_70%_28%)]">Next: {day15.nextSteps}</p>}
        </div>
      )}

      {tips.length > 0 && (
        <div className="rounded-[18px] bg-card border border-border p-4">
          <h3 className="font-heading font-bold text-[14px] mb-2">Important Tips</h3>
          <ul className="space-y-1.5 text-[13px] font-body">
            {tips.map((t) => <li key={t}>💡 {t}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

const HeaderCard = ({ breed, age, space }: { breed: string; age: string; space: string }) => (
  <div className="rounded-[22px] bg-primary text-primary-foreground p-4 shadow-petosauras-md">
    <h3 className="font-heading font-bold text-[16px]">15-Day Training Plan</h3>
    <p className="text-[12px] font-body opacity-90 mt-1">{breed} · {age} · {space} space</p>
  </div>
);

const WeekCard = ({ title, focus, bg, children }: { title: string; focus: string; bg: string; children: React.ReactNode }) => (
  <div className="rounded-[22px] border border-border overflow-hidden">
    <div className="p-3" style={{ background: bg }}>
      <p className="font-heading font-bold text-[14px]">{title}</p>
      {focus && <p className="text-[11px] font-body text-foreground/70">{focus}</p>}
    </div>
    <div className="p-3 bg-card">{children}</div>
  </div>
);

const DayRow = ({ day, text }: { day: string; text: string }) => (
  <div className="flex gap-2 py-1.5 border-b border-border last:border-0">
    <span className="text-[12px] font-heading font-bold capitalize w-14 shrink-0">{day.replace("day", "Day ")}</span>
    <span className="text-[12px] font-body">{text}</span>
  </div>
);

export default TrainingResults;
