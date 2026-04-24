export type PetCareCategory = "diet" | "illness" | "training" | "poison" | "safety";

export interface CategoryDef {
  id: PetCareCategory;
  emoji: string;
  label: string;
  desc: string;
  /** Tint colour as inline style background (HSL). */
  tint: string;
}

export const PETCARE_CATEGORIES: CategoryDef[] = [
  { id: "diet",     emoji: "🥗", label: "Diet",                desc: "Daily nutrition guides",     tint: "hsl(145 50% 92%)" },
  { id: "illness",  emoji: "🩺", label: "Illness / Symptoms", desc: "Spot warning signs early",   tint: "hsl(40 95% 92%)"  },
  { id: "training", emoji: "🎓", label: "Training",            desc: "15-day starter plan",        tint: "hsl(210 80% 93%)" },
  { id: "poison",   emoji: "☠️", label: "Poison Prevention",   desc: "Toxic foods, plants, items", tint: "hsl(0 80% 95%)"   },
  { id: "safety",   emoji: "🛡️", label: "Safety",              desc: "Travel, kids, first aid",   tint: "hsl(265 60% 94%)" },
];

interface Props {
  selected: PetCareCategory | null;
  onSelect: (id: PetCareCategory) => void;
}

const StepCategory = ({ selected, onSelect }: Props) => (
  <div className="grid grid-cols-2 gap-3">
    {PETCARE_CATEGORIES.map((cat) => {
      const isSelected = selected === cat.id;
      return (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`text-left rounded-[22px] p-4 border-2 transition-all active:scale-[0.97] ${
            isSelected ? "border-primary shadow-petosauras-md" : "border-transparent shadow-petosauras"
          } ${cat.id === "safety" ? "col-span-2" : ""}`}
          style={{ background: cat.tint }}
        >
          <div className="w-12 h-12 rounded-full bg-card flex items-center justify-center mb-2 text-[26px]">
            {cat.emoji}
          </div>
          <h3 className="font-heading font-bold text-[15px] leading-tight text-foreground">{cat.label}</h3>
          <p className="text-[12px] font-body text-muted-foreground mt-0.5 leading-snug">{cat.desc}</p>
        </button>
      );
    })}
  </div>
);

export default StepCategory;
