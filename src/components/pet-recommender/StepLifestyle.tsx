import type { LifestyleAnswers } from "@/lib/petMatcher";

interface Props {
  value: Partial<LifestyleAnswers>;
  onChange: (v: Partial<LifestyleAnswers>) => void;
  onNext: () => void;
  onBack: () => void;
}

type Q<K extends keyof LifestyleAnswers> = {
  key: K;
  title: string;
  options: { value: LifestyleAnswers[K]; label: string }[];
};

const QUESTIONS: Q<keyof LifestyleAnswers>[] = [
  {
    key: "homeType",
    title: "What's your home like?",
    options: [
      { value: "apartment", label: "Apartment" },
      { value: "house_yard", label: "Independent house with yard" },
      { value: "farmhouse", label: "Farmhouse / large space" },
    ],
  },
  {
    key: "aloneHours",
    title: "Hours your pet will be alone daily",
    options: [
      { value: "0-2", label: "0–2 hours" },
      { value: "3-5", label: "3–5 hours" },
      { value: "6-8", label: "6–8 hours" },
      { value: "9+", label: "9+ hours" },
    ],
  },
  {
    key: "climate",
    title: "Your local climate",
    options: [
      { value: "hot_humid", label: "Hot & humid" },
      { value: "hot_dry", label: "Hot & dry" },
      { value: "moderate", label: "Moderate" },
      { value: "cool", label: "Cool" },
    ],
  },
  {
    key: "experience",
    title: "Your experience with pets",
    options: [
      { value: "first_time", label: "First-time owner" },
      { value: "had_before", label: "Had pets before" },
      { value: "experienced", label: "Experienced" },
    ],
  },
  {
    key: "household",
    title: "Your household",
    options: [
      { value: "just_me", label: "Just me" },
      { value: "couple", label: "Couple" },
      { value: "family_young_kids", label: "Family with young kids" },
      { value: "family_teens", label: "Family with teens" },
      { value: "multi_gen", label: "Multi-generational" },
    ],
  },
  {
    key: "activity",
    title: "Your activity level",
    options: [
      { value: "sedentary", label: "Sedentary" },
      { value: "moderate", label: "Moderate" },
      { value: "active", label: "Active" },
      { value: "very_active", label: "Very active" },
    ],
  },
];

const StepLifestyle = ({ value, onChange, onNext, onBack }: Props) => {
  const allAnswered = QUESTIONS.every((q) => value[q.key] !== undefined);

  return (
    <div className="space-y-4">
      {QUESTIONS.map((q) => (
        <div
          key={q.key}
          className="rounded-[16px] border border-border bg-card p-4"
        >
          <div className="font-heading font-bold text-[14px] mb-3">
            {q.title}
          </div>
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => {
              const active = value[q.key] === opt.value;
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() =>
                    onChange({ ...value, [q.key]: opt.value })
                  }
                  className={[
                    "px-3 py-2 rounded-[10px] text-[12px] font-body font-semibold border transition-colors",
                    active
                      ? "bg-foreground text-background border-foreground"
                      : "bg-background text-foreground border-border hover:border-primary/40",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-border bg-card py-3 font-body font-bold text-[14px]"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!allAnswered}
          className="flex-1 rounded-full bg-foreground text-background py-3 font-body font-bold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default StepLifestyle;
