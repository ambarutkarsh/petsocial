import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  uploadPetDocument,
  DOCUMENT_TYPE_LABEL,
  type DocumentType,
  type RecordType,
} from "@/lib/petDocuments";
import { UploadIcon } from "@/components/icons/PetosauraIcons";

interface Props {
  open: boolean;
  onClose: () => void;
  petId: string;
  /** Record type for storage path. Defaults to general_document. */
  recordType?: RecordType;
  /** Optional record id to link the document to. */
  healthRecordId?: string | null;
  /** Pre-fill / lock document type (used when uploading inside a vaccine etc.) */
  defaultDocumentType?: DocumentType;
  lockDocumentType?: boolean;
  title?: string;
}

const TYPES: DocumentType[] = [
  "vaccination_certificate",
  "prescription",
  "lab_report",
  "insurance",
  "adoption_registration",
  "microchip_certificate",
  "invoice",
  "other",
];

const UploadDocumentSheet = ({
  open,
  onClose,
  petId,
  recordType = "general_document",
  healthRecordId = null,
  defaultDocumentType,
  lockDocumentType = false,
  title = "Upload Document",
}: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<DocumentType>(defaultDocumentType ?? "other");
  const [busy, setBusy] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      toast.error("File too large. Max 10MB.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!user || !file) return;
    setBusy(true);
    try {
      await uploadPetDocument({
        ownerId: user.id,
        petId,
        recordType,
        recordId: healthRecordId ?? undefined,
        healthRecordId: healthRecordId ?? null,
        documentType: docType,
        file,
      });
      toast.success("Document uploaded");
      qc.invalidateQueries({ queryKey: ["pet-documents", petId] });
      if (healthRecordId) qc.invalidateQueries({ queryKey: ["pet-record-documents", healthRecordId] });
      setFile(null);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 flex flex-col z-[1200]"
        style={{
          maxHeight: "calc(100vh - env(safe-area-inset-top, 0px) - 24px)",
        }}
      >
        <SheetHeader className="px-6 pt-6 pb-2 shrink-0">
          <SheetTitle className="font-heading">{title}</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-4 mt-2">
          <div>
            <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
              Document Type
            </label>
            <Select
              value={docType}
              onValueChange={(v) => setDocType(v as DocumentType)}
              disabled={lockDocumentType}
            >
              <SelectTrigger className="w-full h-11 rounded-2xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-[1300]">
                {TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {DOCUMENT_TYPE_LABEL[t]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
              File
            </label>
            <Input type="file" accept="image/*,application/pdf" onChange={handleFile} />
            {file && (
              <p className="text-[11px] text-muted-foreground mt-1.5 font-body">
                {file.name} • {Math.round(file.size / 1024)} KB
              </p>
            )}
          </div>

          <div className="rounded-xl bg-muted/40 p-3 text-[11px] text-muted-foreground font-body">
            🔒 Stored privately in your pet's secure locker. Only you can view it.
          </div>
        </div>
        <div
          className="shrink-0 px-6 pt-3 border-t border-border bg-background"
          style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 16px)" }}
        >
          <Button
            disabled={!file || busy}
            onClick={handleUpload}
            className="w-full"
          >
            <UploadIcon className="w-4 h-4" />
            {busy ? "Uploading…" : "Upload Document"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default UploadDocumentSheet;
