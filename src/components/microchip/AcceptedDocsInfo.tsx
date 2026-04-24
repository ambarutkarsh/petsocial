import { useState } from "react";
import { ChevronDown } from "lucide-react";

const ACCEPTED = [
  { ok: true, title: "Microchip implant certificate from vet", desc: "The receipt/certificate given by your vet when the chip was implanted. Must show chip number." },
  { ok: true, title: "GCC Chennai pet license", desc: "Shows chip number + your name (Tamil Nadu)." },
  { ok: true, title: "BBMP pet registration certificate", desc: "Bengaluru/Karnataka municipal pet registration." },
  { ok: true, title: "Other municipal pet registration", desc: "Any official municipal document showing the chip number." },
  { ok: true, title: "Vet clinic letter on letterhead", desc: "Letter from your vet clinic mentioning the chip number." },
  { ok: true, title: "KCI certificate with chip number", desc: "Kennel Club of India registration certificate." },
];

const REJECTED = [
  "Photos of the chip box alone",
  "Receipts without chip number",
  "Screenshots without chip number",
  "Documents in unreadable condition",
];

const AcceptedDocsInfo = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-[16px] border border-border bg-surface-alt overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-body text-sm font-semibold">What documents are accepted?</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} strokeWidth={2} />
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          {ACCEPTED.map((d) => (
            <div key={d.title} className="flex gap-2">
              <span className="text-[#1F8A4D] font-bold leading-tight">✅</span>
              <div>
                <p className="font-body text-sm font-medium">{d.title}</p>
                <p className="font-body text-xs text-muted-foreground mt-0.5">{d.desc}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <p className="font-body text-xs font-semibold text-muted-foreground mb-2">NOT ACCEPTED</p>
            {REJECTED.map((r) => (
              <div key={r} className="flex gap-2 mb-1">
                <span className="text-destructive">❌</span>
                <p className="font-body text-xs">{r}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AcceptedDocsInfo;
