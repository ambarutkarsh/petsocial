import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
import { FolderOpen, Lock, MoreHorizontal, Plus, Shield, FlaskConical, FileText, FileBadge } from "lucide-react";

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
  "other",
];

const FILTER_LABEL: Record<string, string> = {
  all: "All",
  vaccination_certificate: "Vaccination Certificates",
  prescription: "Prescriptions",
  lab_report: "Lab Reports",
  insurance: "Insurance",
  other: "Other",
};

const TYPE_ICON: Record<string, React.ReactNode> = {
  vaccination_certificate: <Shield className="w-5 h-5 text-primary" />,
  prescription: <FileText className="w-5 h-5 text-primary" />,
  lab_report: <FlaskConical className="w-5 h-5 text-primary" />,
  insurance: <FileBadge className="w-5 h-5 text-primary" />,
  microchip_certificate: <FileBadge className="w-5 h-5 text-primary" />,
  adoption_registration: <FileText className="w-5 h-5 text-primary" />,
  invoice: <FileText className="w-5 h-5 text-primary" />,
  other: <FileText className="w-5 h-5 text-primary" />,
};

const ext = (name: string) => (name.split(".").pop() || "").toUpperCase().slice(0, 4);
const extTone = (e: string) =>
  e === "PDF" ? "bg-accent/15 text-accent" : "bg-secondary/15 text-secondary";

const DocumentsLocker = ({ petId, petName }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<DocumentType | "all">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const { data: docs = [] } = useQuery({
    queryKey: ["pet-documents", petId],
    enabled: !!user && !!petId,
    queryFn: () => fetchPetDocuments({ ownerId: user!.id, petId }),
  });

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
    <div className="space-y-3 pb-20">
      {/* Header with private badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg leading-tight">Documents</h3>
            <p className="text-[11px] text-muted-foreground font-body">
              {petName ? `${petName}'s secure health locker` : "Secure health locker"}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/15 text-secondary px-2.5 py-1 text-[10px] font-body font-bold">
          <Lock className="w-3 h-3" /> Private
        </span>
      </div>

      <p className="text-[10px] text-muted-foreground font-body -mt-1">
        Visible only to {petName || "this pet"}'s owner
      </p>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-body font-semibold transition-colors border ${
              filter === f
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border"
            }`}
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-surface-alt p-8 text-center">
          <p className="text-3xl mb-1">📂</p>
          <p className="text-sm font-body text-muted-foreground">No documents yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((d: any) => {
            const linked = d.health_record_id ? recordsMap[d.health_record_id] : null;
            const fileExt = ext(d.file_name);
            return (
              <div key={d.id} className="rounded-2xl border border-border bg-card p-3 flex items-start gap-3 relative">
                <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center shrink-0">
                  {TYPE_ICON[d.document_type] || TYPE_ICON.other}
                </div>
                <button onClick={() => view(d)} className="flex-1 min-w-0 text-left">
                  <p className="font-body font-bold text-sm truncate">
                    {DOCUMENT_TYPE_LABEL[d.document_type as DocumentType] || d.file_name}
                  </p>
                  {linked && (
                    <p className="text-[11px] font-body text-muted-foreground truncate">
                      Linked to: <span className="text-primary font-semibold">{linked.title}</span>
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground font-body mt-0.5">
                    Uploaded: {format(new Date(d.uploaded_at), "dd MMM yyyy")} • {d.file_name}
                  </p>
                </button>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${extTone(fileExt)}`}>
                    {fileExt || "FILE"}
                  </span>
                  <button
                    onClick={() => setMenuFor(menuFor === d.id ? null : d.id)}
                    className="p-1 hover:bg-muted rounded"
                    aria-label="More"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
                {menuFor === d.id && (
                  <div
                    className="absolute right-2 top-12 z-10 bg-card border border-border rounded-xl shadow-petosauras py-1 min-w-[120px]"
                    onMouseLeave={() => setMenuFor(null)}
                  >
                    <button
                      onClick={() => { view(d); setMenuFor(null); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-body hover:bg-muted"
                    >
                      View
                    </button>
                    <button
                      onClick={() => { remove(d); setMenuFor(null); }}
                      className="w-full text-left px-3 py-1.5 text-xs font-body text-destructive hover:bg-muted"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Big bottom CTA */}
      <button
        onClick={() => setShowUpload(true)}
        className="w-full flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary-light/30 py-3.5 text-primary font-body font-bold text-sm hover:bg-primary-light/50 transition-colors"
      >
        <Plus className="w-4 h-4" /> Upload Document
      </button>

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
