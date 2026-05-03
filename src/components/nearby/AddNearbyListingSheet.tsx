import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useGuestPopup } from "@/contexts/GuestPopupContext";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { trackNearby, NearbyCategory } from "@/lib/nearbyHelpers";

const CATEGORY_OPTIONS: { key: NearbyCategory; emoji: string; label: string }[] = [
  { key: "pet_restaurant", emoji: "🍽️", label: "Pet Restaurants" },
  { key: "spa_grooming", emoji: "💆", label: "Spa & Grooming" },
  { key: "pet_park", emoji: "🌳", label: "Pet Parks" },
  { key: "pet_show", emoji: "🎪", label: "Pet Shows" },
  { key: "boarding", emoji: "🏠", label: "Boarding" },
  { key: "help_stray", emoji: "🐾", label: "Help Stray" },
  { key: "lost_found", emoji: "🚨", label: "Lost & Found" },
];

interface Props {
  open: boolean;
  initialCategory?: NearbyCategory;
  onClose: () => void;
  onCreated?: (cat: NearbyCategory) => void;
}

const AddNearbyListingSheet = ({ open, initialCategory, onClose, onCreated }: Props) => {
  const { user } = useAuth();
  const { triggerGuestPopup } = useGuestPopup();
  const [category, setCategory] = useState<NearbyCategory | null>(initialCategory ?? null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [extra, setExtra] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const setEx = (k: string, v: any) => setExtra((p) => ({ ...p, [k]: v }));

  const reset = () => { setCategory(initialCategory ?? null); setForm({}); setExtra({}); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!user) { triggerGuestPopup(); return; }
    if (!category) return;
    const title = (form.title || "").trim();
    const description = (form.description || "").trim();
    const city = (form.city || "").trim();
    const state = (form.state || "").trim();
    if (title.length < 3) { toast.error("Title must be at least 3 characters"); return; }
    if (description.length < 20) { toast.error("Description must be at least 20 characters"); return; }
    if (!city) { toast.error("City is required"); return; }
    if (!state) { toast.error("State is required"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("nearby_listings").insert({
        user_id: user.id,
        category,
        title,
        description,
        city,
        state,
        locality: form.locality || null,
        address: form.address || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        website: form.website || null,
        image_url: form.image_url || null,
        source: "user_generated",
        metadata: extra,
      } as any);
      if (error) throw error;
      trackNearby("nearby_add_flow_completed", { category });
      toast.success("Added successfully to NearBy!");
      onCreated?.(category);
      close();
    } catch (e: any) {
      toast.error(e?.message || "Could not save listing");
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ k, label, type = "text", placeholder }: { k: string; label: string; type?: string; placeholder?: string }) => (
    <label className="block text-xs font-body font-bold text-muted-foreground">
      {label}
      <input
        type={type}
        value={form[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full h-11 px-4 rounded-2xl border border-border bg-muted/30 text-sm font-body text-foreground focus:outline-none focus:border-primary"
      />
    </label>
  );
  const TextArea = ({ k, label, placeholder }: { k: string; label: string; placeholder?: string }) => (
    <label className="block text-xs font-body font-bold text-muted-foreground">
      {label}
      <textarea
        value={form[k] || ""}
        onChange={(e) => set(k, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="mt-1 w-full rounded-2xl border border-border bg-muted/30 text-sm font-body text-foreground p-3 focus:outline-none focus:border-primary"
      />
    </label>
  );

  const renderCommon = () => (
    <>
      <Field k="title" label="Title / Name *" placeholder="e.g. Paws & Pamper Spa" />
      <TextArea k="description" label="Description *" placeholder="Tell others what makes this place great…" />
      <div className="grid grid-cols-2 gap-3">
        <Field k="city" label="City *" />
        <Field k="state" label="State *" />
      </div>
      <Field k="locality" label="Locality" />
      <Field k="address" label="Address" />
      <div className="grid grid-cols-2 gap-3">
        <Field k="phone" label="Phone" />
        <Field k="whatsapp" label="WhatsApp" />
      </div>
      <Field k="website" label="Website" />
      <Field k="image_url" label="Image URL (optional)" placeholder="https://…" />
    </>
  );

  const renderCategoryExtras = () => {
    if (!category) return null;
    if (category === "spa_grooming") {
      return (
        <>
          <label className="block text-xs font-body font-bold text-muted-foreground">Type
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.type || ""} onChange={(e) => setEx("type", e.target.value)}>
              <option value="">Select…</option><option value="spa">Spa</option><option value="groomer">Groomer</option><option value="both">Both</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Home service available
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.home_service || ""} onChange={(e) => setEx("home_service", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
        </>
      );
    }
    if (category === "help_stray") {
      return (
        <>
          <label className="block text-xs font-body font-bold text-muted-foreground">Animal type
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.animal_type || ""} onChange={(e) => setEx("animal_type", e.target.value)}>
              <option value="">Select…</option><option value="dog">Dog</option><option value="cat">Cat</option><option value="bird">Bird</option><option value="cow">Cow</option><option value="other">Other</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Urgency
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.urgency || "medium"} onChange={(e) => setEx("urgency", e.target.value)}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Help needed
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.help_needed || ""} onChange={(e) => setEx("help_needed", e.target.value)}>
              <option value="">Select…</option><option value="food">Food</option><option value="rescue">Rescue</option><option value="medical">Medical</option><option value="adoption">Adoption</option><option value="foster">Foster</option><option value="transport">Transport</option><option value="other">Other</option>
            </select>
          </label>
        </>
      );
    }
    if (category === "lost_found") {
      return (
        <>
          <label className="block text-xs font-body font-bold text-muted-foreground">Post type
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.post_type || "lost"} onChange={(e) => setEx("post_type", e.target.value)}>
              <option value="lost">Lost Pet</option><option value="found">Found Pet</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Pet type
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.pet_type || ""} onChange={(e) => setEx("pet_type", e.target.value)}>
              <option value="">Select…</option><option value="dog">Dog</option><option value="cat">Cat</option><option value="bird">Bird</option><option value="fish">Fish</option><option value="rabbit">Rabbit</option><option value="other">Other</option>
            </select>
          </label>
          <input placeholder="Colour / markings" value={extra.markings || ""} onChange={(e) => setEx("markings", e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-border bg-muted/30 text-sm" />
        </>
      );
    }
    if (category === "pet_show") {
      return <input type="date" value={extra.event_date || ""} onChange={(e) => setEx("event_date", e.target.value)} className="w-full h-11 px-4 rounded-2xl border border-border bg-muted/30 text-sm" />;
    }
    if (category === "pet_park") {
      const pa = extra.pet_acceptance || [];
      const togglePa = (k: string) => setEx("pet_acceptance", pa.includes(k) ? pa.filter((x: string) => x !== k) : [...pa, k]);
      return (
        <>
          <div>
            <p className="text-xs font-body font-bold text-muted-foreground mb-1">Pet acceptance</p>
            <div className="flex flex-wrap gap-2">
              {["Dogs", "Cats", "Small Pets", "All Pets"].map((k) => (
                <button type="button" key={k} onClick={() => togglePa(k)} className={`text-xs px-3 py-1.5 rounded-full border ${pa.includes(k) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border"}`}>{k}</button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-body font-bold text-muted-foreground">Off-leash allowed
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.off_leash_allowed || ""} onChange={(e) => setEx("off_leash_allowed", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Entry fee
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.entry_fee || ""} onChange={(e) => setEx("entry_fee", e.target.value)}>
              <option value="">Unknown</option><option value="free">Free</option><option value="paid">Paid</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Play area available
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.play_area_available || ""} onChange={(e) => setEx("play_area_available", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <input placeholder="Timings (optional)" value={extra.timings || ""} onChange={(e) => setEx("timings", e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-border bg-muted/30 text-sm" />
        </>
      );
    }
    if (category === "boarding") {
      const pa = extra.pet_acceptance || [];
      const togglePa = (k: string) => setEx("pet_acceptance", pa.includes(k) ? pa.filter((x: string) => x !== k) : [...pa, k]);
      return (
        <>
          <div>
            <p className="text-xs font-body font-bold text-muted-foreground mb-1">Pet types accepted *</p>
            <div className="flex flex-wrap gap-2">
              {["Dogs", "Cats", "Birds", "Small Pets", "Reptiles"].map((k) => (
                <button type="button" key={k} onClick={() => togglePa(k)} className={`text-xs px-3 py-1.5 rounded-full border ${pa.includes(k) ? "bg-primary text-primary-foreground border-primary" : "bg-muted/30 border-border"}`}>{k}</button>
              ))}
            </div>
          </div>
          <label className="block text-xs font-body font-bold text-muted-foreground">Overnight stay
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.overnight_stay_available || ""} onChange={(e) => setEx("overnight_stay_available", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Day care
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.day_care_available || ""} onChange={(e) => setEx("day_care_available", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Vaccination required
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.vaccination_required || ""} onChange={(e) => setEx("vaccination_required", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <label className="block text-xs font-body font-bold text-muted-foreground">Pickup/drop available
            <select className="mt-1 w-full h-11 px-3 rounded-2xl border border-border bg-muted/30 text-sm" value={extra.pickup_drop_available || ""} onChange={(e) => setEx("pickup_drop_available", e.target.value)}>
              <option value="">Unknown</option><option value="yes">Yes</option><option value="no">No</option>
            </select>
          </label>
          <input placeholder="Price range (optional)" value={extra.price_range || ""} onChange={(e) => setEx("price_range", e.target.value)}
            className="w-full h-11 px-4 rounded-2xl border border-border bg-muted/30 text-sm" />
        </>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-end justify-center">
      <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-[480px] bg-card rounded-t-[28px] p-5 max-h-[90vh] flex flex-col">
        <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-bold">{category ? `Add ${CATEGORY_OPTIONS.find(c => c.key === category)?.label}` : "Add NearBy Listing"}</h2>
          <button onClick={close} aria-label="Close"><X size={20} /></button>
        </div>

        {!category ? (
          <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-4">
            {CATEGORY_OPTIONS.map((c) => (
              <button key={c.key} onClick={() => { setCategory(c.key); trackNearby("nearby_add_flow_started", { category: c.key }); }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/40 border border-border hover:border-primary transition-colors">
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-sm font-heading font-bold text-foreground">{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {renderCommon()}
              {renderCategoryExtras()}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => setCategory(null)} className="h-11 px-4 rounded-full bg-muted text-foreground text-sm font-heading font-bold">Back</button>
              <button onClick={submit} disabled={submitting}
                className="flex-1 h-11 rounded-full bg-primary text-primary-foreground font-heading font-bold disabled:opacity-50 flex items-center justify-center">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Listing"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AddNearbyListingSheet;
