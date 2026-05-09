import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
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
import { ChevronDown, ChevronUp, Eye, Pencil, Trash2, Plus, FileText, Shield, Syringe, Bug } from "lucide-react";

interface Props {
  petId: string;
  recordType: RecordType;
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
  const [frequency, setFrequency] = useState("");
  const [notes, setNotes] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploadFor, setUploadFor] = useState<string | null>(null);

  const { data: records = [] } = useQuery({
    queryKey: ["pet-health-records", petId, recordType],
    enabled: !!user && !!petId,
    queryFn: () => fetchHealthRecords({ ownerId: user!.id, petId, recordType }),
  });

  const stats = useMemo(() => {
    const now = new Date();
    let upcoming = 0, dueSoon = 0, completed = 0;
    records.forEach((r: any) => {
      if (r.next_due_date) {
        const days = differenceInDays(new Date(r.next_due_date), now);
        if (days < 0) upcoming++;
        else if (days <= 14) dueSoon++;
      }
      if (r.status === "done" || (!r.next_due_date && r.record_date)) completed++;
    });
    if (recordType === "vaccine") {
      // recompute: upcoming = future due
      upcoming = records.filter((r: any) => r.next_due_date && new Date(r.next_due_date) > now).length;
    }
    return { upcoming, dueSoon, completed, total: records.length };
  }, [records, recordType]);

  const reset = () => {
    setEditingId(null);
    setTitle("");
    setRecordDate(format(new Date(), "yyyy-MM-dd"));
    setNextDue("");
    setStatus("done");
    setFrequency("");
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
          metadata: frequency ? { frequency } : null,
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
    setFrequency(r.metadata?.frequency || "");
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

  const isVaccine = recordType === "vaccine";
  const headerIcon = isVaccine ? <Shield className="w-5 h-5 text-primary" /> : <FileText className="w-5 h-5 text-primary" />;
  const headerLabel = isVaccine ? "Vaccines" : RECORD_TYPE_LABEL[recordType] + "s";
  const headerSub = isVaccine
    ? "Stay on top of vaccinations"
    : `Manage ${RECORD_TYPE_LABEL[recordType].toLowerCase()} records`;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center">
            {headerIcon}
          </div>
          <div>
            <h3 className="font-heading font-bold text-lg leading-tight">{headerLabel}</h3>
            <p className="text-[11px] text-muted-foreground font-body">{headerSub}</p>
          </div>
        </div>
        <Button size="sm" className="rounded-full h-8" onClick={() => { reset(); setShowForm(true); }}>
          <Plus className="w-3.5 h-3.5" /> Add
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        <StatBox value={stats.upcoming} label="Upcoming" tone="bg-accent/15 text-accent" />
        <StatBox value={stats.dueSoon} label="Due soon" tone="bg-destructive/10 text-destructive" />
        <StatBox value={stats.completed} label="Completed" tone="bg-secondary/15 text-secondary" />
        <StatBox value={stats.total} label="Total records" tone="bg-primary-light text-primary" />
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="rounded-3xl border-2 border-dashed border-border bg-surface-alt p-8 text-center">
          <p className="text-3xl mb-2">{isVaccine ? "💉" : "📋"}</p>
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
            recordType={recordType}
            isOpen={openId === r.id}
            onToggle={() => setOpenId((prev) => (prev === r.id ? null : r.id))}
            onEdit={() => startEdit(r)}
            onDelete={() => remove(r.id)}
            onUpload={() => setUploadFor(r.id)}
          />
        ))
      )}

      {/* Add/Edit sheet */}
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
              <Field label="Administered">
                <Input type="date" value={recordDate} onChange={(e) => setRecordDate(e.target.value)} />
              </Field>
              <Field label="Next due">
                <Input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Frequency">
                <Input placeholder="e.g. Yearly" value={frequency} onChange={(e) => setFrequency(e.target.value)} />
              </Field>
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
            </div>
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

const StatBox = ({ value, label, tone }: { value: number; label: string; tone: string }) => (
  <div className={`rounded-2xl p-2.5 ${tone}`}>
    <p className="font-heading font-bold text-2xl leading-none">{value}</p>
    <p className="text-[10px] font-body font-semibold mt-1 leading-tight">{label}</p>
  </div>
);

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
  recordType,
  isOpen,
  onToggle,
  onEdit,
  onDelete,
  onUpload,
}: {
  record: any;
  petId: string;
  recordType: RecordType;
  isOpen: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpload: () => void;
}) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: docs = [] } = useQuery({
    queryKey: ["pet-record-documents", record.id],
    enabled: !!user,
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
      ? "bg-accent/20 text-accent"
      : record.status === "overdue"
      ? "bg-destructive/15 text-destructive"
      : "bg-secondary/15 text-secondary";

  const dotTone =
    record.status === "upcoming"
      ? "bg-accent"
      : record.status === "overdue"
      ? "bg-destructive"
      : "bg-secondary";

  const Icon = recordType === "deworming" ? Bug : Syringe;
  const frequency = record.metadata?.frequency || (recordType === "vaccine" ? "Yearly" : "—");

  return (
    <div className="rounded-3xl border border-border bg-card overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full ${dotTone} shrink-0`} />
            <Icon className="w-4 h-4 text-foreground/70 shrink-0" />
            <p className="font-body font-bold text-sm truncate">{record.title}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${statusTone}`}>
              {record.status || "done"}
            </span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>

        {isOpen && (
          <div className="grid grid-cols-4 gap-2 mt-3">
            <Meta label="Administered" value={record.record_date ? format(new Date(record.record_date), "dd MMM yyyy") : "—"} />
            <Meta label="Next due" value={record.next_due_date ? format(new Date(record.next_due_date), "dd MMM yyyy") : "—"} />
            <Meta label="Frequency" value={frequency} />
            <Meta label="Documents" value={`${docs.length} attached`} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          {record.notes && (
            <p className="text-xs font-body text-muted-foreground">{record.notes}</p>
          )}

          {docs.length > 0 ? (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary-light/30 p-2.5 space-y-1.5">
              {docs.map((d: any) => (
                <div key={d.id} className="flex items-center gap-2 rounded-xl bg-card px-2 py-1.5">
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-semibold truncate">{d.file_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Uploaded on {format(new Date(d.uploaded_at), "dd MMM yyyy")}
                    </p>
                  </div>
                  <button onClick={() => view(d)} className="text-[11px] font-bold text-primary border border-primary/40 rounded-full px-2.5 py-1">
                    View
                  </button>
                  <button onClick={() => removeDoc(d)} className="p-1 hover:bg-muted rounded">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          {/* Bottom action bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <ActionLink icon={<Eye className="w-3.5 h-3.5" />} label="View details" onClick={onUpload} />
            <ActionLink icon={<Plus className="w-3.5 h-3.5" />} label="Add document" onClick={onUpload} />
            <ActionLink icon={<Pencil className="w-3.5 h-3.5" />} label="Edit" onClick={onEdit} />
            <button onClick={onDelete} className="p-1.5 hover:bg-muted rounded">
              <Trash2 className="w-3.5 h-3.5 text-destructive" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const Meta = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wide">{label}</p>
    <p className="text-xs font-body font-semibold mt-0.5">{value}</p>
  </div>
);

const ActionLink = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-1 text-[11px] font-body font-bold text-primary px-1.5 py-1 hover:bg-primary-light/40 rounded"
  >
    {icon}
    {label}
  </button>
);

export default HealthRecordsPanel;
