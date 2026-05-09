import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  fetchHealthRecords,
  fetchPetDocuments,
  createHealthRecord,
  updateHealthRecord,
  deleteHealthRecord,
  deletePetDocument,
  getSignedUrl,
  RECORD_TYPE_LABEL,
  type RecordType,
  type DocumentType,
} from "@/lib/petDocuments";
import UploadDocumentSheet from "./UploadDocumentSheet";
import { PlusIcon, UploadIcon } from "@/components/icons/PetosauraIcons";
import { Eye, Trash2, Pencil } from "lucide-react";

interface Props {
  petId: string;
  recordType: RecordType;
  /** Default document type to use when uploading inside a record (e.g. vaccine → vaccination_certificate). */
  defaultDocumentType: DocumentType;
}

const HealthRecordsPanel = ({ petId, recordType, defaultDocumentType }: Props) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [recordDate, setRecordDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [nextDue, setNextDue] = useState("");
  const [status, setStatus] = useState("done");
  const [notes, setNotes] = useState("");
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);

  const { data: records = [] } = useQuery({
    queryKey: ["pet-health-records", petId, recordType],
    enabled: !!user && !!petId,
    queryFn: () => fetchHealthRecords({ ownerId: user!.id, petId, recordType }),
  });

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setRecordDate(format(new Date(), "yyyy-MM-dd"));
    setNextDue("");
    setStatus("done");
    setNotes("");
  };

  const save = async () => {
    if (!user || !title.trim()) {
      toast.error("Add a title");
      return;
    }
    try {
      if (editingId) {
        await updateHealthRecord(editingId, user.id, {
          title,
          record_date: recordDate || null,
          next_due_date: nextDue || null,
          status,
          notes: notes || null,
        });
        toast.success("Updated");
      } else {
        await createHealthRecord({
          ownerId: user.id,
          petId,
          recordType,
          title,
          recordDate: recordDate || null,
          nextDueDate: nextDue || null,
          status,
          notes: notes || null,
        });
        toast.success("Added");
      }
      qc.invalidateQueries({ queryKey: ["pet-health-records", petId, recordType] });
      qc.invalidateQueries({ queryKey: ["mypet-summary", petId] });
      setShowForm(false);
      reset();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  };

  const startEdit = (r: any) => {
    setEditingId(r.id);
    setTitle(r.title || "");
    setRecordDate(r.record_date || "");
    setNextDue(r.next_due_date || "");
    setStatus(r.status || "done");
    setNotes(r.notes || "");
    setShowForm(true);
  };

  const remove = async (id: string) => {
    if (!user || !confirm("Delete this record and its linked documents?")) return;
    try {
      await deleteHealthRecord(id, user.id);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["pet-health-records", petId, recordType] });
      qc.invalidateQueries({ queryKey: ["pet-documents", petId] });
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground font-body">
          {records.length} {RECORD_TYPE_LABEL[recordType]}{records.length === 1 ? "" : "s"}
        </p>
        <Button
          size="sm"
          onClick={() => {
            reset();
            setShowForm(true);
          }}
        >
          <PlusIcon className="w-3.5 h-3.5" /> Add {RECORD_TYPE_LABEL[recordType]}
        </Button>
      </div>

      {records.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-surface-alt p-6 text-center">
          <p className="text-sm font-body text-muted-foreground">
            No {RECORD_TYPE_LABEL[recordType].toLowerCase()} records yet
          </p>
        </div>
      ) : (
        records.map((r: any) => (
          <RecordCard
            key={r.id}
            record={r}
            petId={petId}
            isOpen={openRecordId === r.id}
            onToggle={() => setOpenRecordId((prev) => (prev === r.id ? null : r.id))}
            onEdit={() => startEdit(r)}
            onDelete={() => remove(r.id)}
            onUpload={() => setUploadFor(r.id)}
          />
        ))
      )}

      <Sheet open={showForm} onOpenChange={(v) => !v && setShowForm(false)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-heading">
              {editingId ? "Edit" : "Add"} {RECORD_TYPE_LABEL[recordType]}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-4 pb-6">
            <Field label="Title">
              <Input
                placeholder={recordType === "vaccine" ? "e.g. Rabies" : "Title"}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Date">
                <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
              </Field>
              <Field label="Next due">
                <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
              </Field>
            </div>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 rounded-2xl border border-input bg-background px-3 text-sm font-body"
              >
                <option value="done">Done</option>
                <option value="upcoming">Upcoming</option>
                <option value="overdue">Overdue</option>
              </select>
            </Field>
            <Field label="Notes">
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </Field>
            <Button className="w-full" onClick={save}>
              {editingId ? "Save changes" : "Add record"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {uploadFor && (
        <UploadDocumentSheet
          open={!!uploadFor}
          onClose={() => setUploadFor(null)}
          petId={petId}
          recordType={recordType}
          healthRecordId={uploadFor}
          defaultDocumentType={defaultDocumentType}
          title={`Attach to ${RECORD_TYPE_LABEL[recordType]}`}
        />
      )}
    </div>
  );
};

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[11px] font-semibold uppercase text-muted-foreground block mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const RecordCard = ({
  record,
  petId,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onUpload,
}: {
  record: any;
  petId: string;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpload: () => void;
}) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // STRICT scope: owner + pet + this record only
  const { data: docs = [] } = useQuery({
    queryKey: ["pet-record-documents", record.id],
    enabled: isOpen && !!user,
    queryFn: () =>
      fetchPetDocuments({ ownerId: user!.id, petId, healthRecordId: record.id }),
  });

  const view = async (d: any) => {
    const url = await getSignedUrl(d.file_url);
    if (url) window.open(url, "_blank");
    else toast.error("Could not load file");
  };

  const removeDoc = async (d: any) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deletePetDocument(d);
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["pet-record-documents", record.id] });
      qc.invalidateQueries({ queryKey: ["pet-documents", petId] });
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    }
  };

  const statusTone =
    record.status === "upcoming"
      ? "bg-accent/20 text-accent-foreground"
      : record.status === "overdue"
      ? "bg-destructive/15 text-destructive"
      : "bg-secondary/15 text-secondary";

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <button onClick={onToggle} className="w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-body font-semibold text-sm truncate">{record.title}</p>
            <p className="text-[11px] text-muted-foreground font-body mt-0.5">
              {record.record_date ? format(new Date(record.record_date), "dd MMM yyyy") : "No date"}
              {record.next_due_date && ` • Next: ${format(new Date(record.next_due_date), "dd MMM yyyy")}`}
            </p>
          </div>
          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusTone}`}>
            {record.status || "done"}
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {record.notes && (
            <p className="text-xs font-body text-muted-foreground">{record.notes}</p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase font-semibold text-muted-foreground">
              {docs.length} document{docs.length === 1 ? "" : "s"} attached
            </p>
            <div className="flex gap-1.5">
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={onEdit}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button size="sm" variant="outline" className="h-7 px-2" onClick={onDelete}>
                <Trash2 className="w-3 h-3" />
              </Button>
              <Button size="sm" className="h-7 px-2" onClick={onUpload}>
                <UploadIcon className="w-3 h-3" /> Add
              </Button>
            </div>
          </div>

          {docs.map((d: any) => (
            <div
              key={d.id}
              className="flex items-center gap-2 rounded-xl bg-muted/40 p-2"
            >
              <div className="text-lg">📄</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-body font-semibold truncate">{d.file_name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {format(new Date(d.uploaded_at), "dd MMM yyyy")}
                </p>
              </div>
              <button onClick={() => view(d)} className="p-1.5 hover:bg-muted rounded-lg">
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => removeDoc(d)} className="p-1.5 hover:bg-muted rounded-lg">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthRecordsPanel;
