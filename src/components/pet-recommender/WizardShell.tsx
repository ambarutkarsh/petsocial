import { useState } from "react";
import ProgressIndicator from "./ProgressIndicator";
import StepIntent from "./StepIntent";
import StepLifestyle from "./StepLifestyle";
import StepBudget from "./StepBudget";
import StepResults from "./StepResults";
import type { LifestyleAnswers, RecommendationInput } from "@/lib/petMatcher";

type Step = 0 | 1 | 2 | 3;

const DEFAULT_LIFESTYLE: Partial<LifestyleAnswers> = {};

const WizardShell = () => {
  const [step, setStep] = useState<Step>(0);
  const [intentText, setIntentText] = useState("");
  const [lifestyle, setLifestyle] =
    useState<Partial<LifestyleAnswers>>(DEFAULT_LIFESTYLE);
  const [pin, setPin] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState(3000);
  const [upfrontBudget, setUpfrontBudget] = useState(15000);

  const reset = () => {
    setStep(0);
    setIntentText("");
    setLifestyle(DEFAULT_LIFESTYLE);
    setPin("");
    setMonthlyBudget(3000);
    setUpfrontBudget(15000);
  };

  const recommendationInput: RecommendationInput = {
    intentText,
    lifestyle: lifestyle as LifestyleAnswers,
    pin,
    monthlyBudget,
    upfrontBudget,
  };

  return (
    <div className="md:grid md:grid-cols-[200px_1fr] md:gap-6">
      <aside className="md:sticky md:top-4 md:self-start">
        <ProgressIndicator step={step} />
      </aside>

      <section className="mt-5 md:mt-0">
        {step === 0 && (
          <StepIntent
            value={intentText}
            onChange={setIntentText}
            onNext={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepLifestyle
            value={lifestyle}
            onChange={setLifestyle}
            onNext={() => setStep(2)}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepBudget
            pin={pin}
            monthlyBudget={monthlyBudget}
            upfrontBudget={upfrontBudget}
            onChangePin={setPin}
            onChangeMonthly={setMonthlyBudget}
            onChangeUpfront={setUpfrontBudget}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepResults
            input={recommendationInput}
            onBack={() => setStep(2)}
            onRestart={reset}
          />
        )}
      </section>
    </div>
  );
};

export default WizardShell;
