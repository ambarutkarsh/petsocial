import HubSubLayout from "@/components/HubSubLayout";
import { ExternalLink } from "lucide-react";

const PROVIDERS = [
  {
    name: "Bajaj Allianz Pet Insurance",
    desc: "Covers accidents, illness, and third-party liability for dogs.",
    url: "https://www.bajajallianz.com/health-insurance-plans/pet-dog-insurance.html",
    tag: "Dogs",
  },
  {
    name: "Future Generali Pet Insurance",
    desc: "Comprehensive cover incl. surgery, hospitalisation, theft.",
    url: "https://general.futuregenerali.in/health-insurance/pet-insurance",
    tag: "Dogs",
  },
  {
    name: "Pawtect by Vetina",
    desc: "Wellness + accident plans, OPD covered.",
    url: "https://www.pawtect.in/",
    tag: "Dogs & Cats",
  },
  {
    name: "Digit Pet Insurance",
    desc: "Digital-first claims, fast reimbursement.",
    url: "https://www.godigit.com/pet-insurance",
    tag: "Dogs",
  },
];

const InsuranceScreen = () => (
  <HubSubLayout title="Pet Insurance" subtitle="Compare trusted providers in India" emoji="🛡️">
    <div className="space-y-3">
      <div className="rounded-[16px] bg-primary-light/40 border border-primary/20 p-4">
        <p className="text-xs font-body text-foreground">
          💡 <strong>Tip:</strong> Insurance premiums depend on breed, age, and city. Most plans require pets to be 8 weeks–8 years old.
        </p>
      </div>
      {PROVIDERS.map((p) => (
        <a
          key={p.name}
          href={p.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-[18px] bg-card border border-border p-4 shadow-petosauras hover:shadow-petosauras-md transition-all"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-heading font-bold text-[15px]">{p.name}</h3>
              <p className="text-xs text-muted-foreground font-body mt-1">{p.desc}</p>
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                {p.tag}
              </span>
            </div>
            <ExternalLink className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.8} />
          </div>
        </a>
      ))}
    </div>
  </HubSubLayout>
);

export default InsuranceScreen;
