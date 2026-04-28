import { useMemo } from "react";
import { recommend, type RecommendationInput } from "@/lib/petMatcher";
import BreedCard from "./BreedCard";

interface Props {
  input: RecommendationInput;
  onRestart: () => void;
  onBack: () => void;
}

const StepResults = ({ input, onRestart, onBack }: Props) => {
  const result = useMemo(() => recommend(input), [input]);

  const mailtoBody = encodeURIComponent(
    [
      "My Petosauras pet recommender results:",
      "",
      `Intent: ${input.intentText}`,
      `Location: ${result.tier.city} (${result.tier.tier})`,
      `Monthly budget: ₹${input.monthlyBudget.toLocaleString("en-IN")}`,
      `Upfront budget: ₹${input.upfrontBudget.toLocaleString("en-IN")}`,
      "",
      "Top matches:",
      ...result.topBreeds.map(
        (r, i) =>
          `${i + 1}. ${r.breed.name} — ${r.score}% match · monthly ₹${r.costs.monthlyLow.toLocaleString(
            "en-IN"
          )}–₹${r.costs.monthlyHigh.toLocaleString("en-IN")}`
      ),
    ].join("\n")
  );
  const mailto = `mailto:?subject=${encodeURIComponent(
    "My pet recommendations from Petosauras"
  )}&body=${mailtoBody}`;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading font-bold text-[20px] leading-tight">
          Your top matches
        </h2>
        <p className="text-xs text-muted-foreground font-body mt-1">
          Ranked by lifestyle fit and your budget in{" "}
          {result.tier.city === "Unknown" ? "your area" : result.tier.city}.
        </p>
      </div>

      {result.limitedMatches && (
        <div className="rounded-[12px] border border-border bg-muted/30 p-3 text-[12px] font-body text-foreground/80">
          We found limited matches given your filters — try widening your budget
          or experience level for more options.
        </div>
      )}

      <div className="space-y-3">
        {result.topBreeds.length === 0 ? (
          <div className="rounded-[16px] border border-border bg-card p-5 text-center text-[13px] font-body text-muted-foreground">
            No breeds matched your inputs. Go back and adjust your answers.
          </div>
        ) : (
          result.topBreeds.map((b) => (
            <BreedCard key={b.breed.id} result={b} />
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <a
          href={mailto}
          className="w-full rounded-full bg-foreground text-background py-3 font-body font-bold text-[14px] text-center"
        >
          Email me these results
        </a>
        <div className="flex gap-2">
          <button
            onClick={onBack}
            className="flex-1 rounded-full border border-border bg-card py-3 font-body font-bold text-[14px]"
          >
            Back
          </button>
          <button
            onClick={onRestart}
            className="flex-1 rounded-full border border-border bg-card py-3 font-body font-bold text-[14px]"
          >
            Start over
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepResults;
