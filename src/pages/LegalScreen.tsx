import { useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/icons/PetosauraIcons";
import { ExternalLink } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import PageWrapper from "@/components/PageWrapper";
import BottomNav from "@/components/BottomNav";

const RIGHTS = [
  {
    emoji: "🍲",
    title: "Feeding strays is legal",
    desc: "Supreme Court ruling (2023) confirms feeding stray animals is a fundamental right under Article 51A(g).",
    search: "supreme court 2023 feeding stray dogs ruling india",
  },
  {
    emoji: "🏘️",
    title: "Housing societies cannot ban pets",
    desc: "Animal Welfare Board of India 2015 — RWAs and societies cannot prohibit pet ownership.",
    search: "AWBI guidelines housing society pets india 2015",
  },
  {
    emoji: "⚖️",
    title: "Animal cruelty is punishable",
    desc: "IPC Sections 428/429 criminalize harming animals. PCA Act 1960 protects all animals.",
    search: "IPC 428 429 animal cruelty punishment india",
  },
  {
    emoji: "📜",
    title: "PCA Act 1960",
    desc: "The Prevention of Cruelty to Animals Act protects every animal from unnecessary suffering.",
    search: "Prevention of Cruelty to Animals Act 1960 india",
  },
];

const LegalScreen = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <PageWrapper>
        <header className="flex items-center gap-2">
          <BackButton fallback="/hub" />
          <h1 className="font-heading text-xl font-bold">⚖️ Legal & Rights</h1>
        </header>
        <p className="text-sm text-muted-foreground font-body mt-2">
          Know Your Rights as a Pet Owner in India
        </p>

        <div className="mt-4 space-y-3">
          {RIGHTS.map((r, i) => (
            <div
              key={i}
              className="paw-card p-4 animate-fade-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{r.emoji}</span>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-sm">{r.title}</h3>
                  <p className="text-xs text-muted-foreground font-body mt-1">{r.desc}</p>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(r.search)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary font-heading font-bold mt-2"
                  >
                    Learn More <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PageWrapper>
      <BottomNav />
    </MobileLayout>
  );
};

export default LegalScreen;
