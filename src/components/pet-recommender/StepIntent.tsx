import { useEffect, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

const PLACEHOLDERS = [
  "I want someone to guard my house",
  "A cuddly companion for my kid",
  "Something beautiful for my living room",
  "An independent pet for my busy schedule",
];

const PRESETS = [
  "Guard my home",
  "Cuddly companion",
  "Beautiful display pet",
  "First pet for my child",
  "Active running buddy",
  "Quiet, low-maintenance pet",
];

const StepIntent = ({ value, onChange, onNext }: Props) => {
  const [phIndex, setPhIndex] = useState(0);
  const [showPresets, setShowPresets] = useState(false);

  useEffect(() => {
    const t = setInterval(
      () => setPhIndex((i) => (i + 1) % PLACEHOLDERS.length),
      2800
    );
    return () => clearInterval(t);
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-heading font-bold text-[20px] leading-tight">
          In one line, why do you want a pet?
        </h2>
        <p className="text-xs text-muted-foreground font-body mt-1">
          We'll use this to figure out the best category for you.
        </p>
      </div>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDERS[phIndex]}
        rows={3}
        className="w-full rounded-[14px] border border-border bg-card px-4 py-3 text-[15px] font-body resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
      />

      <button
        type="button"
        onClick={() => setShowPresets((s) => !s)}
        className="text-[13px] font-body font-semibold text-primary underline-offset-2 hover:underline"
      >
        Not sure? Pick from common reasons
      </button>

      {showPresets && (
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onChange(p)}
              className={[
                "px-3 py-1.5 rounded-full text-[12px] font-body font-semibold border transition-colors",
                value === p
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:border-primary/40",
              ].join(" ")}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        disabled={value.trim().length < 3}
        className="w-full rounded-full bg-foreground text-background py-3 font-body font-bold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue
      </button>
    </div>
  );
};

export default StepIntent;
