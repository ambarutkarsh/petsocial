import { useMemo } from "react";
import { getTierFromPin } from "./petMatcher";

interface Props {
  pin: string;
  monthlyBudget: number;
  upfrontBudget: number;
  onChangePin: (v: string) => void;
  onChangeMonthly: (v: number) => void;
  onChangeUpfront: (v: number) => void;
  onNext: () => void;
  onBack: () => void;
}

const fmt = (n: number) =>
  "₹" + n.toLocaleString("en-IN");

const StepBudget = ({
  pin,
  monthlyBudget,
  upfrontBudget,
  onChangePin,
  onChangeMonthly,
  onChangeUpfront,
  onNext,
  onBack,
}: Props) => {
  const tierInfo = useMemo(() => getTierFromPin(pin), [pin]);
  const tierLabel =
    tierInfo.tier === "tier1"
      ? "Metro"
      : tierInfo.tier === "tier2"
      ? "Tier-2 city"
      : "Smaller city";
  const pinValid = /^\d{6}$/.test(pin);

  return (
    <div className="space-y-5">
      <div className="rounded-[16px] border border-border bg-card p-4">
        <label className="font-heading font-bold text-[14px] block mb-2">
          PIN code
        </label>
        <input
          inputMode="numeric"
          pattern="\d{6}"
          maxLength={6}
          value={pin}
          onChange={(e) =>
            onChangePin(e.target.value.replace(/\D/g, "").slice(0, 6))
          }
          placeholder="e.g. 600028"
          className="w-full rounded-[12px] border border-border bg-background px-3 py-2.5 text-[15px] font-body tracking-wider focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        {pinValid && (
          <p className="text-xs text-muted-foreground font-body mt-2">
            {tierInfo.city === "Unknown"
              ? "Location not in our sample list — pricing defaults to Tier-2."
              : `${tierInfo.city} · ${tierLabel}`}
          </p>
        )}
      </div>

      <div className="rounded-[16px] border border-border bg-card p-4">
        <label className="font-heading font-bold text-[14px] block">
          Monthly recurring budget
        </label>
        <p className="text-[13px] font-body text-muted-foreground mb-3">
          Food, grooming, vet — covers month-to-month spend.
        </p>
        <input
          type="range"
          min={500}
          max={10000}
          step={500}
          value={monthlyBudget}
          onChange={(e) => onChangeMonthly(Number(e.target.value))}
          className="w-full accent-[hsl(var(--primary))]"
        />
        <div className="flex justify-between text-[11px] font-body text-muted-foreground mt-1">
          <span>₹500</span>
          <span className="font-bold text-foreground text-[14px]">
            {fmt(monthlyBudget)}
          </span>
          <span>₹10,000</span>
        </div>
      </div>

      <div className="rounded-[16px] border border-border bg-card p-4">
        <label className="font-heading font-bold text-[14px] block">
          Upfront one-time budget
        </label>
        <p className="text-[13px] font-body text-muted-foreground mb-3">
          Purchase / adoption fee plus initial setup.
        </p>
        <input
          type="range"
          min={0}
          max={75000}
          step={2500}
          value={upfrontBudget}
          onChange={(e) => onChangeUpfront(Number(e.target.value))}
          className="w-full accent-[hsl(var(--primary))]"
        />
        <div className="flex justify-between text-[11px] font-body text-muted-foreground mt-1">
          <span>₹0</span>
          <span className="font-bold text-foreground text-[14px]">
            {fmt(upfrontBudget)}
          </span>
          <span>₹75,000</span>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onBack}
          className="flex-1 rounded-full border border-border bg-card py-3 font-body font-bold text-[14px]"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!pinValid}
          className="flex-1 rounded-full bg-foreground text-background py-3 font-body font-bold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          See matches
        </button>
      </div>
    </div>
  );
};

export default StepBudget;
