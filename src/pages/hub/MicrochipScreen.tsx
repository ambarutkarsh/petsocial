import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus, ChevronDown, Trash2, MoreVertical, FileText, Download, ExternalLink, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import HubSubLayout from "@/components/HubSubLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { validateMicrochip, formatChipNumber } from "@/lib/microchipValidator";
import ChipStatusBadge, { ChipVerificationStatus } from "@/components/microchip/ChipStatusBadge";
import ChipDisclaimer from "@/components/microchip/ChipDisclaimer";
import ChipUpgradeSheet from "@/components/microchip/ChipUpgradeSheet";
import { docTypeLabel } from "@/components/microchip/docTypes";

const MicrochipScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const qc = useQueryClient();

  const [expanded, setExpanded] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; chipNumber: string } | null>(null);
  const [upgradeChip, setUpgradeChip] = useState<{ id: string; chipNumber: string } | null>(null);

  const { data: myChips = [], isLoading: chipsLoading } = useQuery({
    queryKey: ["my-chips", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("pet_microchips")
        .select(`*, pets:pet_id (name, pet_type, species, avatar_emoji)`)
        .eq("owner_id", user!.id)
        .eq("is_active", true)
        .order("registered_at", { ascending: false });
      return data || [];
    },
  });

  const refetchChips = () => qc.invalidateQueries({ queryKey: ["my-chips"] });

  const handleDelete = async () => {
    if (!confirmDelete || !user) return;
    const { error } = await supabase
      .from("pet_microchips")
      .update({ is_active: false })
      .eq("id", confirmDelete.id)
      .eq("owner_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Chip removed from Petosauras");
    setConfirmDelete(null);
    refetchChips();
  };

  const openDoc = async (path: string) => {
    const { data, error } = await supabase.storage.from("chip-documents").createSignedUrl(path, 60 * 5);
    if (error) {
      toast.error("Could not open document");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <HubSubLayout title="Microchip Registry" emoji="💉">
      <div className="space-y-6 pb-8">
        {/* SECTION A — My Chips */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-bold text-base">My Registered Chips</h2>
              <p className="text-xs text-muted-foreground font-body">
                {user ? "Chips you have registered on Petosauras" : "Login to view your registered chips"}
              </p>
            </div>
          </div>

          {!user && (
            <button
              onClick={triggerGuestPopup}
              className="w-full rounded-[16px] border border-dashed border-border bg-surface-alt p-5 text-left"
            >
              <p className="font-body text-sm font-semibold">🔒 Login required</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Tap to sign in and view or register your microchips.
              </p>
            </button>
          )}

          {user && chipsLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground font-body">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading your chips…
            </div>
          )}

          {user && !chipsLoading && myChips.length === 0 && (
            <div className="rounded-[16px] border border-dashed border-border bg-surface-alt p-5 text-center">
              <p className="font-body text-sm">No chips registered yet.</p>
              <p className="text-xs text-muted-foreground font-body mt-1">
                Register your first chip to keep your pet safe.
              </p>
            </div>
          )}

          {user && myChips.map((chip: any) => {
            const isOpen = expanded === chip.id;
            const status = (chip.verification_status as ChipVerificationStatus) || "self_declared";
            const formatted = formatChipNumber(chip.chip_number, chip.chip_format);
            return (
              <div key={chip.id} className="rounded-[18px] bg-card border border-border shadow-petosauras overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono font-bold text-[15px] tracking-wide break-all">{formatted}</p>
                      <p className="text-[11px] text-muted-foreground font-body mt-0.5">{chip.chip_format}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ChipStatusBadge status={status} />
                      <div className="relative">
                        <button
                          onClick={() => setMenuOpen(menuOpen === chip.id ? null : chip.id)}
                          aria-label="More"
                          className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen === chip.id && (
                          <div
                            className="absolute right-0 top-9 z-10 bg-card border border-border rounded-[12px] shadow-petosauras-md min-w-[160px] overflow-hidden"
                            onMouseLeave={() => setMenuOpen(null)}
                          >
                            <button
                              onClick={() => { setMenuOpen(null); setConfirmDelete({ id: chip.id, chipNumber: formatted }); }}
                              className="w-full text-left px-3 py-2 text-sm font-body text-destructive hover:bg-destructive/5 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Remove this chip
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 space-y-1 text-xs text-muted-foreground font-body">
                    <p>🐾 {chip.pets?.name ? `${chip.pets.name}${chip.pets.species ? " · " + chip.pets.species : ""}` : "Not linked to a pet"}</p>
                    <p>Registered {new Date(chip.registered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>

                  {status === "self_declared" && (
                    <div className="mt-3 rounded-[14px] border border-[#BFD8F2] bg-[#EAF3FB] p-3">
                      <p className="font-body text-sm font-semibold text-[#2D6FB8]">📄 Upgrade to Document Verified</p>
                      <p className="text-xs text-[#2D6FB8]/80 font-body mt-0.5">
                        Upload your microchip certificate to verify this registration.
                      </p>
                      <Button
                        size="sm"
                        className="rounded-full mt-2.5 h-8 px-3"
                        onClick={() => setUpgradeChip({ id: chip.id, chipNumber: chip.chip_number })}
                      >
                        Upload Document →
                      </Button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : chip.id)}
                    className="mt-3 flex items-center gap-1 text-xs font-body text-primary"
                  >
                    {isOpen ? "Hide details" : "Show details"}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-surface-alt/40 p-4 space-y-1.5 text-xs font-body">
                    <DetailRow label="Vet / Clinic" value={chip.vet_clinic || "—"} />
                    <DetailRow label="Implant date" value={chip.implant_date ? new Date(chip.implant_date).toLocaleDateString("en-IN") : "—"} />
                    <DetailRow label="City / State" value={[chip.city, chip.state].filter(Boolean).join(", ") || "—"} />
                    <DetailRow label="Notes" value={chip.notes || "—"} />
                    {chip.document_url && (
                      <div className="pt-2 mt-1 border-t border-border">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Document</p>
                        <div className="flex items-center justify-between gap-2 rounded-[12px] bg-card border border-border px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm truncate">{chip.document_name}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {docTypeLabel(chip.document_type)}{chip.document_size_kb ? ` · ${chip.document_size_kb} KB` : ""}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => openDoc(chip.document_url)}
                            className="text-[11px] text-primary font-semibold flex items-center gap-1"
                          >
                            <Download className="w-3.5 h-3.5" /> View
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            className="w-full rounded-full h-12"
            onClick={() => {
              if (!user) { triggerGuestPopup(); return; }
              navigate("/hub/microchip/register");
            }}
          >
            <Plus className="w-4 h-4 mr-1" /> Register New Chip
          </Button>
        </section>

        {/* SECTION B — Validate */}
        <ValidateChipSection />

        <ChipDisclaimer />
      </div>

      {confirmDelete && (
        <AlertDialog open={true} onOpenChange={(o) => !o && setConfirmDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove this chip?</AlertDialogTitle>
              <AlertDialogDescription>
                Remove chip <span className="font-mono font-semibold">{confirmDelete.chipNumber}</span> from Petosauras? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {upgradeChip && (
        <ChipUpgradeSheet
          open={true}
          onClose={() => setUpgradeChip(null)}
          chipId={upgradeChip.id}
          chipNumber={upgradeChip.chipNumber}
          onUpgraded={refetchChips}
        />
      )}
    </HubSubLayout>
  );
};

const DetailRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between items-start gap-3">
    <span className="text-muted-foreground text-[11px] uppercase tracking-wide">{label}</span>
    <span className="text-right">{value}</span>
  </div>
);

// ───────────────── Validate any chip section ─────────────────
const ValidateChipSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<null | {
    cleaned: string;
    formatted: string;
    formatName: string;
    isValid: boolean;
    isLegacy: boolean;
    errorMessage?: string;
    found?: { status: ChipVerificationStatus; city?: string | null; state?: string | null; registered_at: string; owner_id: string };
  }>(null);
  const [searching, setSearching] = useState(false);
  const [showRegistries, setShowRegistries] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [sendingAlert, setSendingAlert] = useState(false);

  const runValidate = async () => {
    const v = validateMicrochip(input);
    setResult({
      cleaned: v.cleaned,
      formatted: formatChipNumber(v.cleaned, v.format),
      formatName: v.formatName,
      isValid: v.isValid,
      isLegacy: v.isLegacy,
      errorMessage: v.errorMessage,
    });
    if (!v.isValid) return;
    setSearching(true);
    try {
      const { data } = await supabase
        .from("pet_microchips")
        .select("verification_status, city, state, registered_at, owner_id")
        .eq("chip_number", v.cleaned)
        .eq("is_active", true)
        .maybeSingle();
      setResult((prev) => prev ? { ...prev, found: data ? { status: (data.verification_status as ChipVerificationStatus), city: data.city, state: data.state, registered_at: data.registered_at, owner_id: data.owner_id } : undefined } : prev);
    } finally {
      setSearching(false);
    }
  };

  const sendOwnerAlert = async () => {
    if (!result?.found || !user) return;
    if (!alertMessage.trim()) {
      toast.error("Please add a short message for the owner");
      return;
    }
    setSendingAlert(true);
    try {
      const { error } = await supabase.from("chip_contact_requests").insert({
        chip_number: result.cleaned,
        requester_id: user.id,
        message: alertMessage.trim(),
        status: "pending",
      });
      if (error) throw error;
      toast.success("Alert sent. The owner will be contacted by Petosauras.");
      setAlertMessage("");
    } catch (e: any) {
      toast.error(e.message || "Could not send alert");
    } finally {
      setSendingAlert(false);
    }
  };

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-heading font-bold text-base">Validate a Chip Number</h2>
        <p className="text-xs text-muted-foreground font-body">
          Check the format or search if it's on Petosauras.
        </p>
      </div>

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter chip number"
          className="font-mono"
        />
        <Button onClick={runValidate} className="rounded-full h-12 px-5" disabled={!input}>
          Validate
        </Button>
      </div>

      {result && (
        <div className="space-y-3">
          {result.isValid ? (
            <div className="rounded-[14px] bg-[#E6F7EE] text-[#1F8A4D] p-3 font-body text-sm">
              ✅ {result.formatName} — Valid format
              {result.isLegacy && <p className="text-xs mt-1 text-[#A36A00]">⚠️ Legacy format</p>}
            </div>
          ) : (
            <div className="rounded-[14px] bg-[#FDECEC] text-[#C0392B] p-3 font-body text-sm">
              ❌ {result.errorMessage}
            </div>
          )}

          {result.isValid && (searching ? (
            <p className="text-xs text-muted-foreground font-body flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching Petosauras registry…
            </p>
          ) : result.found ? (
            <div className="rounded-[16px] bg-card border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-body text-sm font-semibold">
                  {result.found.status === "document_verified"
                    ? "Registered on Petosauras with supporting document"
                    : "Registered on Petosauras (self-declared)"}
                </p>
                <ChipStatusBadge status={result.found.status} />
              </div>
              {result.found.status === "self_declared" && (
                <p className="text-xs text-muted-foreground font-body">
                  Owner has not uploaded supporting documentation.
                </p>
              )}
              <p className="text-xs text-muted-foreground font-body">
                {[result.found.city, result.found.state].filter(Boolean).join(", ") || "Location not shared"}
                {" · Registered " + new Date(result.found.registered_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>

              {/* Found this pet section */}
              {user && user.id !== result.found.owner_id && (
                <div className="mt-2 pt-3 border-t border-border space-y-2">
                  <p className="font-body text-sm font-semibold">Found this pet?</p>
                  <p className="text-xs text-muted-foreground font-body">
                    Send an anonymous alert to the owner. Your contact details are not shared.
                  </p>
                  <Textarea
                    rows={3}
                    placeholder="e.g. I found this pet near Anna Nagar, Chennai. Looks healthy."
                    value={alertMessage}
                    onChange={(e) => setAlertMessage(e.target.value)}
                  />
                  <Button onClick={sendOwnerAlert} disabled={sendingAlert} className="rounded-full">
                    {sendingAlert ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Send Alert
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-[16px] bg-card border border-border p-4 space-y-2">
              <p className="font-body text-sm font-semibold">Not registered on Petosauras</p>
              {user ? (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => navigate("/hub/microchip/register")}>
                  Register it
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground font-body">Login to register a chip.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={() => setShowRegistries((v) => !v)}
        className="text-xs font-body text-primary underline underline-offset-2"
      >
        Check other registries {showRegistries ? "▲" : "→"}
      </button>
      {showRegistries && (
        <div className="rounded-[14px] border border-border bg-surface-alt p-3 space-y-1.5 text-xs font-body">
          <ExternalLinkRow label="GCC Chennai" url="https://petservice.gccservices.in" />
          <ExternalLinkRow label="PetChip India" url="https://petchipindia.org" />
          <ExternalLinkRow label="WorldPetNet" url="https://worldpetnet.com" />
        </div>
      )}
    </section>
  );
};

const ExternalLinkRow = ({ label, url }: { label: string; url: string }) => (
  <a href={url} target="_blank" rel="noreferrer noopener" className="flex items-center justify-between text-foreground hover:text-primary">
    <span>{label}</span>
    <span className="flex items-center gap-1 text-primary text-[11px]">{new URL(url).host} <ExternalLink className="w-3 h-3" /></span>
  </a>
);

export default MicrochipScreen;
