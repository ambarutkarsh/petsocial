import { supabase } from "@/integrations/supabase/client";

export type DocumentType =
  | "vaccination_certificate"
  | "prescription"
  | "lab_report"
  | "insurance"
  | "adoption_registration"
  | "microchip_certificate"
  | "invoice"
  | "other";

export type RecordType =
  | "vaccine"
  | "deworming"
  | "vet_visit"
  | "lab_report"
  | "prescription"
  | "surgery"
  | "allergy"
  | "medication"
  | "insurance"
  | "microchip"
  | "general_document";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  vaccination_certificate: "Vaccination Certificate",
  prescription: "Prescription",
  lab_report: "Lab Report",
  insurance: "Insurance",
  adoption_registration: "Adoption / Registration",
  microchip_certificate: "Microchip",
  invoice: "Invoice",
  other: "Other",
};

export const RECORD_TYPE_LABEL: Record<RecordType, string> = {
  vaccine: "Vaccine",
  deworming: "Deworming",
  vet_visit: "Vet Visit",
  lab_report: "Lab Report",
  prescription: "Prescription",
  surgery: "Surgery",
  allergy: "Allergy",
  medication: "Medication",
  insurance: "Insurance",
  microchip: "Microchip",
  general_document: "Document",
};

const BUCKET = "pet-documents";
const db = supabase as any;

/**
 * Fetch documents strictly scoped to the owner + pet.
 * If healthRecordId is provided, additionally scopes by that record.
 */
export async function fetchPetDocuments(params: {
  ownerId: string;
  petId: string;
  healthRecordId?: string;
  documentType?: DocumentType;
}) {
  let q = db
    .from("pet_documents")
    .select("*")
    .eq("owner_id", params.ownerId)
    .eq("pet_id", params.petId)
    .order("uploaded_at", { ascending: false });
  if (params.healthRecordId) q = q.eq("health_record_id", params.healthRecordId);
  if (params.documentType) q = q.eq("document_type", params.documentType);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as any[];
}

export async function fetchHealthRecords(params: {
  ownerId: string;
  petId: string;
  recordType?: RecordType;
}) {
  let q = db
    .from("pet_health_records")
    .select("*")
    .eq("owner_id", params.ownerId)
    .eq("pet_id", params.petId)
    .order("record_date", { ascending: false, nullsFirst: false });
  if (params.recordType) q = q.eq("record_type", params.recordType);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []) as any[];
}

export async function getSignedUrl(filePath: string, expiresIn = 3600) {
  const { data } = await supabase.storage.from(BUCKET).createSignedUrl(filePath, expiresIn);
  return data?.signedUrl ?? null;
}

export async function uploadPetDocument(opts: {
  ownerId: string;
  petId: string;
  recordType: RecordType;
  recordId?: string | null;
  documentType: DocumentType;
  healthRecordId?: string | null;
  file: File;
}) {
  const safeName = opts.file.name.replace(/[^\w.\-]+/g, "_");
  const recordSeg = opts.recordId || "general";
  const path = `${opts.ownerId}/${opts.petId}/${opts.recordType}/${recordSeg}/${Date.now()}_${safeName}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, opts.file, {
    contentType: opts.file.type,
    upsert: false,
  });
  if (upErr) throw upErr;

  const { data, error } = await db
    .from("pet_documents")
    .insert({
      owner_id: opts.ownerId,
      pet_id: opts.petId,
      health_record_id: opts.healthRecordId ?? null,
      document_type: opts.documentType,
      file_name: opts.file.name,
      file_url: path,
      file_mime_type: opts.file.type || null,
      file_size: opts.file.size,
    })
    .select()
    .single();
  if (error) {
    // best-effort cleanup
    await supabase.storage.from(BUCKET).remove([path]);
    throw error;
  }
  return data;
}

export async function deletePetDocument(doc: { id: string; file_url: string; owner_id: string }) {
  await supabase.storage.from(BUCKET).remove([doc.file_url]);
  const { error } = await db
    .from("pet_documents")
    .delete()
    .eq("id", doc.id)
    .eq("owner_id", doc.owner_id);
  if (error) throw error;
}

export async function createHealthRecord(opts: {
  ownerId: string;
  petId: string;
  recordType: RecordType;
  title: string;
  recordDate?: string | null;
  nextDueDate?: string | null;
  status?: string;
  notes?: string | null;
}) {
  const { data, error } = await db
    .from("pet_health_records")
    .insert({
      owner_id: opts.ownerId,
      pet_id: opts.petId,
      record_type: opts.recordType,
      title: opts.title,
      record_date: opts.recordDate ?? null,
      next_due_date: opts.nextDueDate ?? null,
      status: opts.status ?? "done",
      notes: opts.notes ?? null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateHealthRecord(id: string, ownerId: string, patch: Record<string, any>) {
  const { error } = await db
    .from("pet_health_records")
    .update(patch)
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (error) throw error;
}

export async function deleteHealthRecord(id: string, ownerId: string) {
  // also clean up any storage objects under the record path (best-effort)
  const { data: docs } = await db
    .from("pet_documents")
    .select("file_url")
    .eq("owner_id", ownerId)
    .eq("health_record_id", id);
  const paths = (docs || []).map((d: any) => d.file_url).filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
  const { error } = await db
    .from("pet_health_records")
    .delete()
    .eq("id", id)
    .eq("owner_id", ownerId);
  if (error) throw error;
}
