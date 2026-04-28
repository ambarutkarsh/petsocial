import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { BackIcon, FeedsIcon, HeartIcon, ShopIcon } from "@/components/icons/PetosauraIcons";

const STEPS = [
  {
    emoji: "📸",
    icon: FeedsIcon,
    title: "Share pet moments",
    desc: "Reels, photos & stories — connect with millions of pet parents across India.",
    color: "from-primary to-[#7B5EA7]",
  },
  {
    emoji: "🏥",
    icon: HeartIcon,
    title: "Care made simple",
    desc: "Vet near me, SOS, insurance, vaccines, budget tools — everything in one Hub.",
    color: "from-secondary to-[#FFA577]",
  },
  {
    emoji: "🛍️",
    icon: ShopIcon,
    title: "Shop, learn & play",
    desc: "Curated pet products, expert articles, find mates, join pet clubs & competitions.",
    color: "from-accent to-[#7BCFC4]",
  },
];

const OnboardingScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (isLast) {
      localStorage.setItem("onboardingComplete", "true");
      navigate("/auth", { replace: true });
    } else {
      setStep(step + 1);
    }
  };

  const skip = () => {
    localStorage.setItem("onboardingComplete", "true");
    navigate("/auth", { replace: true });
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <MobileLayout>
      <div
        className="min-h-screen flex flex-col"
        style={{ background: "radial-gradient(ellipse at top, #EDE5FF 0%, #FBF8F4 50%, #FFF0EB 100%)" }}
      >
        <div className="flex justify-between items-center px-5 pt-5">
          {step > 0 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="w-9 h-9 rounded-full bg-card shadow-petosauras flex items-center justify-center"
              aria-label="Back"
            >
              <BackIcon className="w-4 h-4" strokeWidth={1.8} />
            </button>
          ) : <span className="w-9" />}
          <button onClick={skip} className="text-sm font-body font-semibold text-muted-foreground">
            Skip
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div
            className={`w-32 h-32 rounded-[40px] bg-gradient-to-br ${current.color} shadow-[0_20px_50px_rgba(123, 94, 167,0.3)] flex items-center justify-center text-7xl mb-8 animate-fade-in`}
            key={step}
          >
            {current.emoji}
          </div>
          <h1 className="font-heading font-bold text-[26px] leading-tight mb-3 animate-fade-in" key={`t-${step}`}>
            {current.title}
          </h1>
          <p className="text-[15px] text-muted-foreground font-body leading-relaxed max-w-[300px] animate-fade-in" key={`d-${step}`}>
            {current.desc}
          </p>
        </div>

        <div className="px-6 pb-10">
          <div className="flex justify-center gap-2 mb-6">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-8 bg-primary" : "w-1.5 bg-border"
                }`}
              />
            ))}
          </div>
          <Button onClick={next} className="w-full" size="lg">
            {isLast ? "Get Started" : "Next"}
            <ArrowRight className="w-4 h-4 ml-1" strokeWidth={2} />
          </Button>
        </div>
      </div>
    </MobileLayout>
  );
};

export default OnboardingScreen;
