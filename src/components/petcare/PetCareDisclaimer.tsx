import { AlertTriangle } from "lucide-react";

const PetCareDisclaimer = () => (
  <div className="rounded-[18px] border border-[hsl(40_90%_70%)] bg-[hsl(40_95%_94%)] p-3 flex gap-2">
    <AlertTriangle className="w-4 h-4 text-[hsl(35_85%_42%)] shrink-0 mt-0.5" />
    <p className="text-[12px] font-body text-[hsl(35_80%_30%)] leading-snug">
      This information is for general guidance only. Always consult a licensed
      veterinarian for medical decisions.
    </p>
  </div>
);

export default PetCareDisclaimer;
