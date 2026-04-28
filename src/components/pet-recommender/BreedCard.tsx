import type { BudgetFilteredBreed } from "@/lib/petMatcher";
import { LucideIcon } from "lucide-react";
import { BirdIcon, CatIcon, DogIcon, FishIcon, MyPetIcon, RabbitIcon, ReptileIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  result: BudgetFilteredBreed;
}

const ICONS: Record<string, LucideIcon> = {
  canine: DogIcon,
  feline: CatIcon,
  small_mammal: RabbitIcon,
  aquatic: FishIcon,
  aquatic_exotic: FishIcon,
  avian: BirdIcon,
  reptile: ReptileIcon,
};

const fmt = (n: number) =>
  "₹" + Math.round(n).toLocaleString("en-IN");

const BreedCard = ({ result }: Props) => {
  const { breed, score, reasons, costs, overBudget } = result;
  const Icon = ICONS[breed.category] ?? MyPetIcon;
  const adoption = breed.suitabilityFlags.adoptionRecommended;

  return (
    <article className="rounded-[16px] border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-[12px] bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-foreground" strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-heading font-bold text-[16px] leading-tight">
              {breed.name}
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-body font-bold">
              {score}% match
            </span>
            {overBudget && (
              <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent-foreground text-[11px] font-body font-semibold border border-accent/30">
                Slightly over budget
              </span>
            )}
          </div>
          <p className="text-[12px] text-muted-foreground font-body mt-0.5">
            {breed.adultWeightKg} kg · Lives {breed.lifeExpectancyYears} yrs
          </p>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5">
        {reasons.map((r, i) => (
          <li
            key={i}
            className="text-[13px] font-body text-foreground/80 flex gap-2"
          >
            <span className="text-primary mt-1.5 shrink-0">•</span>
            <span>{r}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-[12px] bg-muted/40 border border-border p-3">
        <div className="text-[11px] font-body font-bold uppercase tracking-wide text-muted-foreground mb-2">
          Cost breakdown (your city)
        </div>
        <dl className="grid grid-cols-2 gap-y-1.5 text-[12px] font-body">
          <dt className="text-muted-foreground">Purchase</dt>
          <dd className="text-right font-semibold">
            {fmt(costs.purchaseLow)} – {fmt(costs.purchaseHigh)}
          </dd>
          <dt className="text-muted-foreground">Monthly (food + grooming + vet)</dt>
          <dd className="text-right font-semibold">
            {fmt(costs.monthlyLow)} – {fmt(costs.monthlyHigh)}
          </dd>
          <dt className="text-muted-foreground">First-year total</dt>
          <dd className="text-right font-semibold">
            {fmt(costs.firstYearLow)} – {fmt(costs.firstYearHigh)}
          </dd>
        </dl>
      </div>

      {adoption && (
        <p className="mt-3 text-[12px] font-body text-foreground/70 bg-secondary/15 border border-secondary/30 rounded-[10px] px-3 py-2">
          Consider adopting — these are commonly available in shelters.
        </p>
      )}
    </article>
  );
};

export default BreedCard;
