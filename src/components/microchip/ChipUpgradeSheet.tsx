import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import ChipDocUploadZone, { PickedFile } from "./ChipDocUploadZone";
import AcceptedDocsInfo from "./AcceptedDocsInfo";
import { DOC_TYPES } from "./docTypes";

interface Props {
  open: boolean;
  onClose: () => void;
  chipId: string;
  chipNumber: string;
  onUpgraded: () => void;
}

const ChipUpgradeSheet = ({ open, onClose, chipId, chipNumber, onUpgraded }: Props) => {
  const { user } = useAuth();
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [docType, setDocType] = useState<string>("implant_certificate");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!picked || !user) {
      toast.error("Please select a document first");
      return;
    }
    setBusy(true);
    try {
      const ext = picked.file.name.split(".").pop() || "bin";
      const path = `${user.id}/${chipNumber}/${Date.now()}_${picked.file.name}`;
      const { error: upErr } = await supabase.storage
        .from("chip-documents")
        .upload(path, picked.file, { upsert: false, contentType: picked.file.type });
      if (upErr) throw upErr;

      const { error: updErr } = await supabase
        .from("pet_microchips")
        .update({
          document_url: path,
          document_name: picked.file.name,
          document_type: docType,
          document_uploaded_at: new Date().toISOString(),
          document_size_kb: Math.round(picked.file.size / 1024),
          verification_status: "document_verified",
        })
        .eq("id", chipId)
        .eq("owner_id", user.id);
      if (updErr) throw updErr;

      toast.success("✅ Status upgraded to Document Verified!");
      onUpgraded();
      onClose();
      setPicked(null);
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="rounded-t-[24px] max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading text-left">Upload Proof Document</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-2 pb-6">
          <p className="text-xs text-muted-foreground font-body">
            Chip <span className="font-mono font-semibold text-foreground">{chipNumber}</span> will
            be upgraded from Self-Declared to Document Verified.
          </p>

          <AcceptedDocsInfo />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground font-body mb-2">
              Upload zone
            </p>
            <ChipDocUploadZone value={picked} onChange={setPicked} />
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground font-body block mb-1.5">
              What type of document is this?
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full h-12 rounded-[16px] border-[1.5px] border-border bg-surface-alt px-4 text-[15px] font-body"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <Button onClick={submit} disabled={!picked || busy} className="w-full rounded-full h-12">
            {busy ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Upgrade to Document Verified
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ChipUpgradeSheet;
