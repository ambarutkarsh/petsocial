import MainLayout from "@/components/MainLayout";
import PageWrapper from "@/components/PageWrapper";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { { type PetCareCategory, { type PetDetails } from "@/components/petcare/StepPetDetails";
import { toast } from "@/hooks/use-toast";
import { BackIcon, ShareIcon } from "@/components/icons/PetosauraIcons";
import PetCareStepper from "@/components/petcare/PetCareStepper";
import PetCareDisclaimer from "@/components/petcare/PetCareDisclaimer";
import StepCategory, PETCARE_CATEGORIES } from "@/components/petcare/StepCategory";
import StepPetDetails, useMemo, useState } from "react";

import DietResults from "@/components/petcare/results/DietResults";
import IllnessResults from "@/components/petcare/results/IllnessResults";
import TrainingResults from "@/components/petcare/results/TrainingResults";
import PoisonResults from "@/components/petcare/results/PoisonResults";
import SafetyResults from "@/components/petcare/results/SafetyResults";

const initialPetDetails: PetDetails = {
  petType: "",
  breed: "",
  age: "",
  weightKg: "",
  weather: "summer",
  allergies: "",
  petId: null,
};

const PetCareScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<PetCareCategory | null>(null);
  const [pet, setPet] = useState<PetDetails>(initialPetDetails);

  const categoryDef = useMemo(
    () => PETCARE_CATEGORIES.find((c) => c.id === category) ?? null,
    [category]
  );

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else navigate("/hub");
  };

  const reset = () => {
    setStep(1);
    setCategory(null);
    setPet(initialPetDetails);
  };

  const share = async () => {
    const url = "https://petosauras.com/hub/pet-care";
    const title = `Pet Care · ${categoryDef?.label ?? "Petosauras"}`;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((navigator as any).share) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (navigator as any).share({ title, text: "Expert pet guidance on Petosauras", url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Link copied", description: url });
      }
    } catch {
      // user cancelled
    }
  };

  return (
    <MainLayout>
      <PageWrapper>
        {/* Header */}
        <header className="flex items-center gap-3">
          <button
            onClick={handleBack}
            aria-label="Back"
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center hover:bg-muted transition-colors"
          >
            <BackIcon className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="font-heading font-bold text-[20px] leading-tight flex items-center gap-2">
              <span>🩺</span>
              <span className="truncate">Pet Care</span>
            </h1>
            <p className="text-xs text-muted-foreground font-body truncate">Expert guidance for your pet</p>
          </div>
          {step === 3 && (
            <button
              onClick={share}
              aria-label="Share"
              className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ShareIcon className="w-4 h-4" strokeWidth={1.8} />
            </button>
          )}
        </header>

        {/* Stepper */}
        <div className="mt-4">
          <PetCareStepper step={step} />
        </div>

        {/* Step content */}
        <div className="mt-5 space-y-4">
          {step === 1 && (
            <>
              <h2 className="font-heading font-bold text-[16px]">Pick a category</h2>
              <StepCategory
                selected={category}
                onSelect={(id) => {
                  setCategory(id);
                  // Slide forward after a short tick
                  setTimeout(() => setStep(2), 150);
                }}
              />
            </>
          )}

          {step === 2 && (
            <StepPetDetails
              initial={pet}
              onSubmit={(d) => {
                setPet(d);
                setStep(3);
              }}
            />
          )}

          {step === 3 && categoryDef && (
            <>
              <PetCareDisclaimer />

              <div className="rounded-[18px] bg-card border border-border p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-[22px]" style={{ background: categoryDef.tint }}>
                  {categoryDef.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-[14px] leading-tight">{categoryDef.label}</p>
                  <p className="text-[11px] text-muted-foreground font-body truncate">
                    {pet.breed || pet.petType} · {pet.age}{pet.weightKg ? ` · ${pet.weightKg}kg` : ""}
                  </p>
                </div>
              </div>

              {category === "diet" && (
                <DietResults
                  petType={pet.petType}
                  breed={pet.breed}
                  age={pet.age as "Baby" | "Young" | "Adult" | "Senior"}
                  weightKg={pet.weightKg}
                  weather={pet.weather}
                />
              )}
              {category === "illness" && <IllnessResults petType={pet.petType} />}
              {category === "training" && <TrainingResults petType={pet.petType} breed={pet.breed} age={pet.age} />}
              {category === "poison" && <PoisonResults petType={pet.petType} />}
              {category === "safety" && <SafetyResults weather={pet.weather} />}

              <Button variant="outline" className="w-full" onClick={reset}>
                <RotateCcw className="w-4 h-4" /> Start Over
              </Button>
            </>
          )}
        </div>
      </PageWrapper>
    </MainLayout>
  );
};

export default PetCareScreen;
