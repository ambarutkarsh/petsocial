import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Syringe, Upload, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import ChipStatusBadge, { ChipVerificationStatus } from "./ChipStatusBadge";
import { formatChipNumber, ChipFormat } from "@/lib/microchipValidator";

interface Props {
  petId: string;
  ownerId: string;
}

const PetMicrochipCard = ({ petId, ownerId }: Props) => {
  const navigate = useNavigate();
  const { data: chip } = useQuery({
    queryKey: ["pet-chip", petId],
    enabled: !!petId && !!ownerId,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_microchips")
        .select("id, chip_number, chip_format, verification_status, registered_at")
        .eq("pet_id", petId)
        .eq("owner_id", ownerId)
        .eq("is_active", true)
        .order("registered_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (!chip) {
    return (
      <div className="rounded-[18px] border-2 border-dashed border-border bg-surface-alt p-4">
        <div className="flex items-center gap-2 mb-2">
          <Syringe className="w-4 h-4 text-muted-foreground" strokeWidth={2} />
          <p className="font-body text-sm font-semibold">No Microchip Registered</p>
        </div>
        <p className="text-xs text-muted-foreground font-body mb-3">
          Register your chip to protect your pet.
        </p>
        <Button size="sm" className="rounded-full" onClick={() => navigate("/hub/microchip/register")}>
          Register Chip →
        </Button>
      </div>
    );
  }

  const status = (chip.verification_status as ChipVerificationStatus) || "self_declared";
  const formatted = formatChipNumber(chip.chip_number, chip.chip_format as ChipFormat);
  const borderColor = status === "document_verified" ? "border-[#243660]" : "border-[#243660]";

  return (
    <div className={`rounded-[18px] border-2 ${borderColor} bg-card p-4`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <Syringe className="w-4 h-4 text-primary flex-shrink-0" strokeWidth={2} />
          <p className="font-body text-sm font-semibold">Microchip</p>
        </div>
        <ChipStatusBadge status={status} />
      </div>
      <p className="font-mono font-bold text-[14px] tracking-wide break-all">{formatted}</p>
      <p className="text-[11px] text-muted-foreground font-body mt-0.5">{chip.chip_format}</p>
      <div className="flex gap-2 mt-3">
        {status === "self_declared" && (
          <Button size="sm" className="rounded-full flex-1" onClick={() => navigate("/hub/microchip")}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Upload Doc
          </Button>
        )}
        <Button
          size="sm"
          variant={status === "self_declared" ? "outline" : "default"}
          className="rounded-full flex-1"
          onClick={() => navigate("/hub/microchip")}
        >
          <Eye className="w-3.5 h-3.5 mr-1" /> View Details
        </Button>
      </div>
    </div>
  );
};

export default PetMicrochipCard;
