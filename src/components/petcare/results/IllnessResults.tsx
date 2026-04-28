import { useState } from "react";

import petCareData from "@/data/petcare-data.json";

import { Button } from "@/components/ui/button";

interface Props {
  petType: string;
}

const SYMPTOMS = [
  "Vomiting","Diarrhoea","Itching/Skin","Fever","Not Eating",
  "Coughing/Breathing","Worms/Parasites","Lethargy","Other",
];

// Maps the chip label to the JSON condition key
const SYMPTOM_TO_KEY: Record<string, string> = {
  "Vomiting": "Vomiting",
  "Diarrhoea": "Diarrhoea",
  "Itching/Skin": "Itching/Skin Issues",
  "Fever": "Fever",
  "Not Eating": "Appetite Loss",
  "Coughing/Breathing": "Respiratory Infection",
  "Worms/Parasites": "Worms/Parasites",
};

const IllnessResults = ({ petType }: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);

  const toggle = (s: string) => {
    setSelected((cur) =>
      cur.includes(s) ? cur.filter((x) => x !== s) : cur.length < 3 ? [...cur, s] : cur
    );
  };

  const conditions = petCareData.illness.conditions as Record<string, {
    species?: string[];
    description?: string;
    whenToWorry?: string;
    homeRemedies?: string[];
    vetRequired?: string;
    indiaNote?: string;
    warning?: string;
    howToCheck?: string;
    treatment?: string;
  }>;

  return (
    <div className="space-y-4">
      {/* Emergency banner — always visible */}
      <div className="rounded-[18px] border border-[hsl(0_70%_70%)] bg-[hsl(0_85%_96%)] p-3">
        <button
          className="w-full flex items-center justify-between gap-2"
          onClick={() => setShowEmergency((v) => !v)}
        >
          <span className="flex items-center gap-2 text-[13px] font-heading font-bold text-[hsl(0_75%_40%)]">
            <WarningIcon className="w-4 h-4" /> 🚨 Emergency symptoms — go to vet NOW
          </span>
          <span className="text-[hsl(0_75%_40%)] text-[12px]">{showEmergency ? "Hide" : "Show"}</span>
        </button>
        {showEmergency && (
          <ul className="mt-2 space-y-1 text-[12px] font-body text-[hsl(0_70%_30%)] list-disc list-inside">
            {petCareData.illness.emergencySymptoms.map((s) => <li key={s}>{s}</li>)}
          </ul>
        )}
      </div>

      {!submitted ? (
        <div className="space-y-3">
          <h3 className="font-heading font-bold text-[15px]">What symptoms is your pet showing?</h3>
          <p className="text-[12px] text-muted-foreground font-body">Select up to 3.</p>
          <div className="flex flex-wrap gap-2">
            {SYMPTOMS.map((s) => {
              const sel = selected.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggle(s)}
                  className={`px-3 py-1.5 rounded-full text-[12px] font-heading font-semibold border-2 transition-all ${
                    sel ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground"
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          <Button className="w-full" disabled={selected.length === 0} onClick={() => setSubmitted(true)}>
            Get Guidance →
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {selected.map((sym) => {
            const key = SYMPTOM_TO_KEY[sym];
            const cond = key ? conditions[key] : undefined;
            if (!cond) {
              return (
                <div key={sym} className="rounded-[18px] bg-card border border-border p-4">
                  <h4 className="font-heading font-bold text-[14px]">{sym}</h4>
                  <p className="text-[12px] text-muted-foreground font-body mt-1">
                    Specific guidance is not available — please consult your vet.
                  </p>
                </div>
              );
            }
            const applies = !cond.species || cond.species.includes(petType);
            return (
              <div key={sym} className="rounded-[22px] bg-card border border-border shadow-petosauras p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-heading font-bold text-[15px]">{sym}</h4>
                  {!applies && (
                    <span className="text-[10px] font-heading font-bold uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      General info
                    </span>
                  )}
                </div>

                {cond.description && (
                  <div>
                    <p className="text-[11px] font-heading font-bold text-muted-foreground uppercase mb-1">About</p>
                    <p className="text-[13px] font-body leading-relaxed">{cond.description}</p>
                  </div>
                )}

                {cond.whenToWorry && (
                  <div className="rounded-[14px] bg-[hsl(40_95%_94%)] p-3">
                    <p className="text-[11px] font-heading font-bold text-[hsl(35_85%_38%)] mb-1">⚠️ When to worry</p>
                    <p className="text-[13px] font-body text-[hsl(35_70%_28%)]">{cond.whenToWorry}</p>
                  </div>
                )}

                {cond.howToCheck && (
                  <div className="rounded-[14px] bg-muted p-3">
                    <p className="text-[11px] font-heading font-bold text-muted-foreground mb-1">How to check</p>
                    <p className="text-[13px] font-body">{cond.howToCheck}</p>
                  </div>
                )}

                {cond.homeRemedies && cond.homeRemedies.length > 0 && (
                  <div>
                    <p className="text-[11px] font-heading font-bold text-muted-foreground uppercase mb-1">🏠 Home remedies</p>
                    <ol className="space-y-1.5 text-[13px] font-body list-decimal list-inside">
                      {cond.homeRemedies.map((r) => <li key={r}>{r}</li>)}
                    </ol>
                  </div>
                )}

                {cond.treatment && (
                  <div>
                    <p className="text-[11px] font-heading font-bold text-muted-foreground uppercase mb-1">Treatment</p>
                    <p className="text-[13px] font-body">{cond.treatment}</p>
                  </div>
                )}

                {cond.vetRequired && (
                  <div className="rounded-[14px] bg-[hsl(0_85%_96%)] p-3">
                    <p className="text-[11px] font-heading font-bold text-[hsl(0_75%_40%)] mb-1">🏥 When to see a vet</p>
                    <p className="text-[13px] font-body text-[hsl(0_70%_30%)]">{cond.vetRequired}</p>
                  </div>
                )}

                {cond.warning && (
                  <div className="rounded-[14px] bg-[hsl(0_85%_96%)] p-3">
                    <p className="text-[13px] font-body text-[hsl(0_70%_30%)]">⚠️ {cond.warning}</p>
                  </div>
                )}

                {cond.indiaNote && (
                  <div className="rounded-[14px] bg-[hsl(175_55%_92%)] p-3">
                    <p className="text-[11px] font-heading font-bold text-[hsl(175_60%_30%)] mb-1">🇮🇳 India note</p>
                    <p className="text-[13px] font-body text-[hsl(175_55%_22%)]">{cond.indiaNote}</p>
                  </div>
                )}
              </div>
            );
          })}

          <div className="rounded-[18px] border-2 border-primary bg-primary-light p-4">
            <p className="text-[13px] font-body text-primary leading-relaxed">
              <strong className="font-heading">Important:</strong> This is general guidance only.
              Do not use this as a substitute for veterinary diagnosis. If in doubt, visit your vet.
            </p>
          </div>

          <Button variant="outline" className="w-full" onClick={() => { setSubmitted(false); setSelected([]); }}>
            Choose different symptoms
          </Button>
        </div>
      )}
    </div>
  );
};

export default IllnessResults;
