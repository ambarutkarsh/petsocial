import { ValidationResult } from "@/lib/microchipValidator";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Loader2 } from "lucide-react";
import { BackIcon, UploadIcon, VerifiedIcon, WarningIcon } from "@/components/icons/PetosauraIcons";
import { formatChipNumber, validateMicrochip } from "@/lib/microchipValidator";

import ChipStepper from "@/components/microchip/ChipStepper";
import ChipDocUploadZone, { type PickedFile } from "@/components/microchip/ChipDocUploadZone";
import { DOC_TYPES, docTypeLabel } from "@/components/microchip/docTypes";

import HubSubLayout from "@/components/HubSubLayout";

import AcceptedDocsInfo from "@/components/microchip/AcceptedDocsInfo";
import ChipDisclaimer from "@/components/microchip/ChipDisclaimer";
import ChipStatusBadge from "@/components/microchip/ChipStatusBadge";

const STEP_LABELS = ["Chip Number", "Link Pet", "Upload Proof", "Confirm"];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Chandigarh","Puducherry"
];

const RegisterMicrochipScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [searchParams] = useSearchParams();
  const prefilledPetId = searchParams.get("pet");

  // Guest gate
  useEffect(() => {
    if (!user) triggerGuestPopup();
  }, [user, triggerGuestPopup]);

  const [step, setStep] = useState(1);

  // Step 1 state
  const [chipInput, setChipInput] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [chipConflict, setChipConflict] = useState<"none" | "self" | "other">("none");
  const [checkingConflict, setCheckingConflict] = useState(false);
  const debounceRef = useRef<number | null>(null);

  // Step 2
  const [selectedPetId, setSelectedPetId] = useState<string | null | "none">(null);

  // Step 3
  const [picked, setPicked] = useState<PickedFile | null>(null);
  const [docType, setDocType] = useState<string>("implant_certificate");
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);

  // Step 4
  const [implantDate, setImplantDate] = useState<string>("");
  const [vetClinic, setVetClinic] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [stateName, setStateName] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<null | { status: "document_verified" | "self_declared"; chipNumber: string; petName: string | null; format: string; date: string }>(null);

  // Pets
  const { data: pets = [] } = useQuery({
    queryKey: ["my-pets-for-chip", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id, name, pet_type, species, avatar_emoji").eq("owner_id", user!.id).order("is_primary", { ascending: false });
      return data || [];
    },
  });

  // Fetch existing chips so we can disable pets that already have one
  const { data: existingChips = [] } = useQuery({
    queryKey: ["my-chips-for-register", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_microchips")
        .select("id, pet_id, chip_number, owner_id")
        .eq("owner_id", user!.id)
        .eq("is_active", true);
      return data || [];
    },
  });

  // Profile prefill for city/state
  useQuery({
    queryKey: ["chip-profile-prefill", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("city, state").eq("id", user!.id).maybeSingle();
      if (data) {
        if (!city && data.city) setCity(data.city);
        if (!stateName && data.state) setStateName(data.state);
      }
      return data;
    },
  });

  // Auto-select first pet without chip
  useEffect(() => {
    if (selectedPetId !== null) return;
    const taken = new Set(existingChips.map((c: any) => c.pet_id).filter(Boolean));
    const candidate = pets.find((p: any) => !taken.has(p.id));
    if (candidate) setSelectedPetId(candidate.id);
  }, [pets, existingChips, selectedPetId]);

  // Debounced validation + conflict check
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    if (!chipInput) {
      setValidation(null);
      setChipConflict("none");
      return;
    }
    debounceRef.current = window.setTimeout(async () => {
      const v = validateMicrochip(chipInput);
      setValidation(v);
      if (!v.isValid || !user) {
        setChipConflict("none");
        return;
      }
      setCheckingConflict(true);
      try {
        const { data } = await supabase
          .from("pet_microchips")
          .select("id, owner_id")
          .eq("chip_number", v.cleaned)
          .eq("is_active", true)
          .maybeSingle();
        if (!data) setChipConflict("none");
        else if (data.owner_id === user.id) setChipConflict("self");
        else setChipConflict("other");
      } finally {
        setCheckingConflict(false);
      }
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [chipInput, user]);

  const canStep1Continue = !!validation?.isValid && chipConflict === "none" && !checkingConflict;
  const canStep2Continue = selectedPetId !== null;

  const handleBack = () => {
    if (step === 1) navigate("/hub/microchip");
    else setStep((s) => s - 1);
  };

  const formattedChip = useMemo(() => {
    if (!validation?.isValid) return "";
    return formatChipNumber(validation.cleaned, validation.format);
  }, [validation]);

  const selectedPet = pets.find((p: any) => p.id === selectedPetId);

  const performRegister = async () => {
    if (!user || !validation?.isValid) return;
    setSubmitting(true);
    try {
      let documentPath: string | null = null;
      let documentName: string | null = null;
      let documentType: string | null = null;
      let documentSizeKb: number | null = null;
      let documentUploadedAt: string | null = null;

      if (picked) {
        const path = `${user.id}/${validation.cleaned}/${Date.now()}_${picked.file.name}`;
        const { error: upErr } = await supabase.storage
          .from("chip-documents")
          .upload(path, picked.file, { upsert: false, contentType: picked.file.type });
        if (upErr) throw upErr;
        documentPath = path;
        documentName = picked.file.name;
        documentType = docType;
        documentSizeKb = Math.round(picked.file.size / 1024);
        documentUploadedAt = new Date().toISOString();
      }

      const verification_status = picked ? "document_verified" : "self_declared";

      const { error: insErr } = await supabase.from("pet_microchips").insert({
        owner_id: user.id,
        chip_number: validation.cleaned,
        chip_format: validation.format,
        pet_id: selectedPetId && selectedPetId !== "none" ? selectedPetId : null,
        verification_status,
        document_url: documentPath,
        document_name: documentName,
        document_type: documentType,
        document_size_kb: documentSizeKb,
        document_uploaded_at: documentUploadedAt,
        implant_date: implantDate || null,
        vet_clinic: vetClinic || null,
        city: city || null,
        state: stateName || null,
        notes: notes || null,
        is_active: true,
      });
      if (insErr) throw insErr;

      setSuccess({
        status: verification_status,
        chipNumber: formattedChip,
        petName: selectedPet ? `${selectedPet.name}${selectedPet.species ? " · " + selectedPet.species : ""}` : null,
        format: validation.formatName,
        date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      });
    } catch (e: any) {
      toast.error(e.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ───── Success view ─────
  if (success) {
    return (
      <HubSubLayout title="Microchip Registered" emoji="💉">
        <div className="space-y-5 pb-8">
          <div className="flex flex-col items-center text-center pt-4">
            <div className="w-20 h-20 rounded-full bg-[#E6F7EE] flex items-center justify-center animate-fade-up">
              <VerifiedIcon className="w-12 h-12 text-[#1F8A4D]" strokeWidth={2.2} />
            </div>
            <h2 className="font-heading font-bold text-xl mt-4">
              {success.status === "document_verified" ? "Chip Registered & Verified!" : "Chip Registered"}
            </h2>
            <ChipStatusBadge status={success.status} className="mt-2" />
            <p className="text-sm text-muted-foreground font-body mt-3 max-w-[300px]">
              {success.status === "document_verified"
                ? "Your chip is registered with supporting documentation."
                : "Upload a document anytime from My Chips to upgrade to Document Verified status."}
            </p>
          </div>

          <div className="rounded-[18px] bg-card border border-border shadow-petosauras p-4 space-y-2.5">
            <p className="font-heading font-bold text-sm">🐾 Petosauras Chip Registry</p>
            <div className="border-t border-border pt-2.5 space-y-2 text-sm font-body">
              <Row label="Chip" value={<span className="font-mono">{success.chipNumber}</span>} />
              <Row label="Pet" value={success.petName || "—"} />
              <Row label="Format" value={success.format} />
              <Row label="Registered" value={success.date} />
              <Row label="Status" value={<ChipStatusBadge status={success.status} />} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="rounded-full h-11" onClick={() => navigate("/hub/microchip")}>
              View My Chips
            </Button>
            <Button className="rounded-full h-11" onClick={() => navigate("/mypet")}>
              Go to MyPet
            </Button>
          </div>
        </div>
      </HubSubLayout>
    );
  }

  if (!user) {
    return (
      <HubSubLayout title="Register Microchip" emoji="💉">
        <p className="text-sm text-muted-foreground font-body">Please log in to register a chip.</p>
      </HubSubLayout>
    );
  }

  return (
    <HubSubLayout title="Register Microchip" emoji="💉">
      <div className="space-y-5 pb-28">
        <ChipStepper current={step} total={4} labels={STEP_LABELS} />

        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg">Enter Chip Number</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Type the number exactly as shown on your microchip certificate.
              </p>
            </div>
            <Input
              value={chipInput}
              onChange={(e) => setChipInput(e.target.value)}
              onBlur={() => setChipInput((v) => v.replace(/\s/g, "").toUpperCase())}
              placeholder="e.g. 900215001234567"
              maxLength={20}
              className="font-mono tracking-wider text-[16px]"
              autoFocus
            />

            {/* live feedback */}
            {chipInput.length > 0 && chipInput.length < 9 && (
              <Pill tone="gray">Keep typing…</Pill>
            )}
            {validation && validation.isValid && (
              <>
                <Pill tone="green">✅ {validation.formatName} — Valid format</Pill>
                {validation.isLegacy && (
                  <div className="rounded-[14px] border border-[#F2C46B] bg-[#FFF8E6] p-3 flex gap-2">
                    <WarningIcon className="w-4 h-4 text-[#A36A00] mt-0.5 flex-shrink-0" strokeWidth={2} />
                    <p className="text-xs font-body text-[#7A4F00] leading-relaxed">
                      This is a legacy format chip. It may not be readable by all modern scanners. Ask your vet about re-chipping with an ISO 15-digit chip.
                    </p>
                  </div>
                )}
              </>
            )}
            {validation && !validation.isValid && chipInput.length >= 9 && (
              <Pill tone="red">❌ {validation.errorMessage}</Pill>
            )}
            {validation?.isValid && checkingConflict && (
              <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking Petosauras registry…
              </p>
            )}
            {chipConflict === "self" && (
              <Pill tone="amber">You have already registered this chip. View it in My Chips.</Pill>
            )}
            {chipConflict === "other" && (
              <Pill tone="red">This chip is already registered by another user on Petosauras.</Pill>
            )}
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg">Link to Your Pet</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Which pet does this chip belong to? (optional but recommended)
              </p>
            </div>
            <div className="space-y-2.5">
              {pets.map((pet: any) => {
                const taken = existingChips.some((c: any) => c.pet_id === pet.id);
                const selected = selectedPetId === pet.id;
                return (
                  <button
                    key={pet.id}
                    type="button"
                    disabled={taken}
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`w-full text-left rounded-[16px] border-[1.5px] p-3.5 flex items-center gap-3 transition-all ${
                      taken
                        ? "bg-muted/40 border-border opacity-60 cursor-not-allowed"
                        : selected
                        ? "bg-primary-light border-primary shadow-petosauras"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-primary-light flex items-center justify-center text-2xl flex-shrink-0">
                      {pet.avatar_emoji || "🐾"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-body font-semibold text-sm truncate">{pet.name}</p>
                      <p className="text-xs text-muted-foreground font-body truncate">
                        {pet.pet_type}{pet.species ? ` · ${pet.species}` : ""}
                      </p>
                    </div>
                    {taken && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-1 rounded-full bg-[#FFF8E6] text-[#A36A00]">
                        Already has chip
                      </span>
                    )}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setSelectedPetId("none")}
                className={`w-full text-left rounded-[16px] border-[1.5px] border-dashed p-3.5 flex items-center gap-3 transition-all ${
                  selectedPetId === "none" ? "bg-primary-light border-primary" : "bg-surface-alt border-border hover:border-primary/40"
                }`}
              >
                <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center text-xl">➕</div>
                <p className="font-body text-sm font-medium">Not linked to a specific pet</p>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg">UploadIcon Proof Document</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Adding a document upgrades your chip to <strong>Document Verified</strong>.
              </p>
            </div>

            <AcceptedDocsInfo />

            <ChipDocUploadZone value={picked} onChange={setPicked} />

            {picked && (
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
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
            )}

            {!picked && (
              <button
                type="button"
                onClick={() => setShowSkipConfirm(true)}
                className="text-xs font-body text-primary underline underline-offset-2"
              >
                Skip for now — register as Self-Declared
              </button>
            )}
          </div>
        )}

        {/* STEP 4 */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h2 className="font-heading font-bold text-lg">Almost done!</h2>
              <p className="text-xs text-muted-foreground font-body mt-1">
                A few more details (all optional).
              </p>
            </div>

            <div className="space-y-3">
              <FormField label="Implant date">
                <Input type="date" max={new Date().toISOString().split("T")[0]} value={implantDate} onChange={(e) => setImplantDate(e.target.value)} />
              </FormField>
              <FormField label="Vet / Clinic name">
                <Input value={vetClinic} onChange={(e) => setVetClinic(e.target.value)} placeholder="e.g. Blue Cross Chennai" />
              </FormField>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="City">
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                </FormField>
                <FormField label="State">
                  <select
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full h-12 rounded-[16px] border-[1.5px] border-border bg-surface-alt px-3 text-[15px] font-body"
                  >
                    <option value="">Select…</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </FormField>
              </div>
              <FormField label="Notes (optional)">
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional info about this chip…" />
              </FormField>
            </div>

            {/* Summary */}
            <div className="rounded-[18px] bg-card border border-border shadow-petosauras p-4 space-y-2.5">
              <p className="font-heading font-bold text-sm">🐾 Registration Summary</p>
              <div className="border-t border-border pt-2.5 space-y-2 text-sm font-body">
                <Row label="Chip Number" value={<span className="font-mono">{formattedChip}</span>} />
                <Row label="Format" value={validation?.formatName || "—"} />
                <Row label="Linked Pet" value={selectedPet ? `${selectedPet.name}${selectedPet.species ? " · " + selectedPet.species : ""}` : "Not linked"} />
                <Row
                  label="Document"
                  value={picked ? `${picked.file.name} · ${docTypeLabel(docType)}` : "None — Self-Declared registration"}
                />
                <Row
                  label="Status after registration"
                  value={<ChipStatusBadge status={picked ? "document_verified" : "self_declared"} />}
                />
              </div>
            </div>

            <ChipDisclaimer compact />
          </div>
        )}

        {/* Sticky action bar */}
        <div className="fixed left-0 right-0 bottom-[64px] mx-auto max-w-[430px] px-4 py-3 bg-background/95 backdrop-blur border-t border-border">
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full h-11 w-11 p-0" onClick={handleBack} disabled={submitting} aria-label="Back">
              <BackIcon className="w-4 h-4" />
            </Button>
            {step < 4 && (
              <Button
                className="rounded-full h-11 flex-1"
                onClick={() => setStep((s) => s + 1)}
                disabled={(step === 1 && !canStep1Continue) || (step === 2 && !canStep2Continue)}
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {step === 4 && (
              <Button className="rounded-full h-11 flex-1" onClick={performRegister} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Register Chip
              </Button>
            )}
          </div>
        </div>

        {/* Skip confirmation modal */}
        {showSkipConfirm && (
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowSkipConfirm(false)}>
            <div className="bg-card rounded-[20px] p-5 w-full max-w-sm space-y-3 shadow-petosauras-md" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2">
                <WarningIcon className="w-5 h-5 text-[#A36A00]" />
                <h3 className="font-heading font-bold">Registering without document</h3>
              </div>
              <p className="text-sm text-muted-foreground font-body">
                Your chip will be marked as <strong>Self-Declared</strong> which means no supporting proof has been provided.
              </p>
              <p className="text-sm text-muted-foreground font-body">
                You can upload a document later from <strong>My Chips</strong> to upgrade to <strong>Document Verified</strong> status.
              </p>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="rounded-full flex-1" onClick={() => setShowSkipConfirm(false)}>Cancel</Button>
                <Button className="rounded-full flex-1" onClick={() => { setShowSkipConfirm(false); setStep(4); }}>
                  Continue without document
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </HubSubLayout>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-center gap-3">
    <span className="text-muted-foreground text-xs uppercase tracking-wide">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

const FormField = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground font-body block mb-1.5">
      {label}
    </label>
    {children}
  </div>
);

const Pill = ({ tone, children }: { tone: "green" | "red" | "amber" | "gray"; children: React.ReactNode }) => {
  const tones = {
    green: "bg-[#E6F7EE] text-[#1F8A4D]",
    red: "bg-[#FDECEC] text-[#C0392B]",
    amber: "bg-[#FFF8E6] text-[#A36A00]",
    gray: "bg-muted text-muted-foreground",
  } as const;
  return (
    <div className={`rounded-full px-3 py-2 text-xs font-body font-medium ${tones[tone]}`}>{children}</div>
  );
};

export default RegisterMicrochipScreen;
