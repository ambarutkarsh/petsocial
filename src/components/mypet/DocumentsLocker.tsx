import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  fetchPetDocuments,
  deletePetDocument,
  getSignedUrl,
  DOCUMENT_TYPE_LABEL,
  type DocumentType,
} from "@/lib/petDocuments";
import UploadDocumentSheet from "./UploadDocumentSheet";
import { PlusIcon } from "@/components/icons/PetosauraIcons";
import { Eye, Trash2, Lock } from "lucide-react";

interface Props {
  petId: string;
  petName?: string;
}

const FILTERS: (DocumentType | "all")[] = [
  "all",
  "vaccination_certificate",
  "prescription",
  "lab_report",
  "insurance",
  "adoption_registration",
  "microchip_certificate",
  "invoice",
  "other",
];

const DocumentsLocker = ({ petId, petName }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const [showUpload, setShowUpload] = useState(false);

  const { data: docs = [] } = useQuery({
    queryKey: ["pet-documents", petId],
    enabled: !!user && !!petId,
    queryFn: () => fetchPetDocuments({ ownerId: user!.id, petId }),
  });

  // Lookup record titles to show "Linked to" labels
  const recordIds = useMemo(
    () => Array.from(new Set(docs.map((d: any) => d.health_record_id).filter(Boolean))) as string[],
    [docs]
  );
  const { data: recordsMap = {} } = useQuery({
    queryKey: ["pet-records-titles", petId, recordIds.join(",")],
    enabled: !!user && recordIds.length > 0,
    queryFn: async () => {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await (supabase as any)
        .from("pet_health_records")
        .select("id,title,record_type")
        .eq("owner_id", user!.id)
        .eq("pet_id", petId)
        .in("id", recordIds);
      const map: Record<string, any> = {};
      (data || []).forEach((r: any) => (map[r.id] = r));
      return map;
    },
  });

  const filtered = filter === "all" ? docs : docs.filter((d: any) => d.document_type === filter);

  const view = async (d: any) => {
    const url = await getSignedUrl(d.file_url);
    if (url) window.open(url, "_blank");
    else toast.error("Could not load file");
  };

  const remove = async (d: any) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deletePetDocument(d);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["pet-documents", petId] });
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-primary-light/40 border border-primary/20 p-3 flex items-center gap-2">
        <Lock className="w-4 h-4 text-primary" />
        <p className="text-xs font-body">
          <span className="font-semibold">Private</span> — visible only to {petName || "this pet"}'s owner
        </p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground font-body">
          {petName ? `${petName}'s secure health locker` : "Secure health locker"}
        </p>
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <PlusIcon className="w-3.5 h-3.5" /> Upload
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-body font-semibold transition-colors ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f === "all" ? "All" : DOCUMENT_TYPE_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface-alt p-6 text-center">
          <p className="text-3xl mb-1">📂</p>
          <p className="text-sm font-body text-muted-foreground">No documents yet</p>
        </div>
      ) : (
        filtered.map((d: any) => {
          const linked = d.health_record_id ? recordsMap[d.health_record_id] : null;
          return (
            <div key={d.id} className="rounded-2xl border border-border bg-card p-3 flex items-start gap-3">
              <div className="text-2xl">📄</div>
              <div className="flex-1 min-w-0">
                <p className="font-body font-semibold text-sm truncate">{d.file_name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {DOCUMENT_TYPE_LABEL[d.document_type as DocumentType] || d.document_type}
                  {" • "}
                  {format(new Date(d.uploaded_at), "dd MMM yyyy")}
                </p>
                {linked && (
                  <p className="text-[10px] text-primary font-body font-semibold mt-1">
                    🔗 Linked to {linked.title}
                  </p>
                )}
              </div>
              <button onClick={() => view(d)} className="p-2 hover:bg-muted rounded-lg" aria-label="View">
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => remove(d)} className="p-2 hover:bg-muted rounded-lg" aria-label="Delete">
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>
          );
        })
      )}

      <UploadDocumentSheet
        open={showUpload}
        onClose={() => setShowUpload(false)}
        petId={petId}
        recordType="general_document"
        title="Upload Document"
      />
    </div>
  );
};

export default DocumentsLocker;
