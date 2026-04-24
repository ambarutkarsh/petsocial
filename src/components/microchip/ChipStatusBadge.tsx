import { CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ChipVerificationStatus = "document_verified" | "self_declared";

interface Props {
  status: ChipVerificationStatus;
  className?: string;
}

const ChipStatusBadge = ({ status, className }: Props) => {
  if (status === "document_verified") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F7EE] text-[#1F8A4D] text-[11px] font-semibold font-body",
          className
        )}
      >
        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.2} />
        Document Verified
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E6F0FB] text-[#2D6FB8] text-[11px] font-semibold font-body",
        className
      )}
    >
      <Info className="w-3.5 h-3.5" strokeWidth={2.2} />
      Self-Declared
    </span>
  );
};

export default ChipStatusBadge;
