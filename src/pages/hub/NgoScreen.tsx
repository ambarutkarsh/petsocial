import HubSubLayout from "@/components/HubSubLayout";
import { ExternalLink, Phone } from "lucide-react";

const NGOS = [
  { name: "PFA (People for Animals)", phone: "+91-11-26491800", site: "https://www.peopleforanimalsindia.org/", city: "Pan-India" },
  { name: "CUPA Bangalore", phone: "+91-80-22943225", site: "https://cupabangalore.org/", city: "Bangalore" },
  { name: "Welfare of Stray Dogs", phone: "+91-22-64222838", site: "https://www.wsdindia.org/", city: "Mumbai" },
  { name: "Friendicoes SECA", phone: "+91-11-24314787", site: "https://friendicoes.org/", city: "Delhi NCR" },
  { name: "Blue Cross of India", phone: "+91-44-22300666", site: "https://bluecrossofindia.org/", city: "Chennai" },
  { name: "Karuna Society for Animals", phone: "+91-9966005006", site: "https://karunasociety.org/", city: "Andhra Pradesh" },
];

const NgoScreen = () => (
  <HubSubLayout title="NGO Connect" subtitle="Animal welfare organisations in India" emoji="🤝">
    <div className="space-y-3">
      {NGOS.map((n) => (
        <div key={n.name} className="rounded-[18px] bg-card border border-border p-4 shadow-petosauras">
          <h3 className="font-heading font-bold text-[15px]">{n.name}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{n.city}</p>
          <div className="flex items-center gap-2 mt-3">
            <a
              href={`tel:${n.phone}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold"
            >
              <Phone className="w-3 h-3" strokeWidth={2.2} /> Call
            </a>
            <a
              href={n.site}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted text-foreground text-xs font-bold"
            >
              <ExternalLink className="w-3 h-3" strokeWidth={2.2} /> Visit
            </a>
          </div>
        </div>
      ))}
    </div>
  </HubSubLayout>
);

export default NgoScreen;
