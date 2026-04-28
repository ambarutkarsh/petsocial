import { InfoIcon } from "@/components/icons/PetosauraIcons";
const ChipDisclaimer = ({ compact = false }: { compact?: boolean }) => (
  <div className="rounded-[14px] bg-surface-alt border border-border p-3 flex gap-2">
    <InfoIcon className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" strokeWidth={2} />
    <div className="text-[12px] leading-relaxed text-muted-foreground font-body">
      {compact ? (
        <p>
          Petosauras is a self-declaration registry. <strong>Document Verified</strong> means the
          owner has uploaded supporting paperwork. Physical chip verification requires an RFID
          scanner at a vet clinic.
        </p>
      ) : (
        <>
          <p className="font-semibold text-foreground mb-1">About this registry</p>
          <p className="mb-1">
            Petosauras validates chip number format (ISO/AVID/FECAVA standards) and checks our
            own registry. We cannot verify if a chip is physically implanted in an animal — this
            requires an RFID scanner at a veterinary clinic.
          </p>
          <p>
            <strong>Document Verified</strong> = owner has uploaded supporting paperwork.{" "}
            <strong>Self-Declared</strong> = no document yet.
          </p>
        </>
      )}
    </div>
  </div>
);

export default ChipDisclaimer;
