import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { petTypes, breedsByType, indianStates } from "@/lib/registrationData";
import { trackEvent } from "@/lib/analytics";

const CompleteRegistrationScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0); // 0=details, 1=pet, 2=photo

  // Step A fields
  const [fullName, setFullName] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");

  // Step B fields
  const [selectedPetType, setSelectedPetType] = useState("");
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");

  // Step C
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      const meta = user.user_metadata;
      setFullName(meta?.full_name || meta?.name || "");
    }
  }, [user]);

  const breeds = breedsByType[selectedPetType] || [];

  const handleComplete = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Update profile
      await supabase.from("profiles").update({
        full_name: fullName.trim(),
        phone: mobile.trim(),
        city: city.trim() || null,
        state: state || null,
        pin_code: pinCode.trim() || null,
      }).eq("id", user.id);

      // Get pet emoji
      const petEmoji = petTypes.find(p => p.label === selectedPetType)?.emoji || "🐾";

      // Insert pet
      const petInsert: any = {
        owner_id: user.id,
        name: petName.trim(),
        pet_type: selectedPetType,
        species: breed || null,
        gender: gender || "Unknown",
        age_years: age ? parseFloat(age) : null,
        is_primary: true,
        avatar_emoji: petEmoji,
      };

      // Upload pet photo if selected
      if (petPhoto) {
        const ext = petPhoto.name.split(".").pop();
        const path = `${user.id}/pet_${Date.now()}.${ext}`;
        await supabase.storage.from("avatars").upload(path, petPhoto);
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        petInsert.avatar_url = urlData.publicUrl;
      }

      await supabase.from("pets").insert(petInsert);

      trackEvent("signup_completed", { method: "google" });
      toast.success("Welcome to Petosauras! 🦕");
      navigate("/feed", { replace: true });
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    }
    setSubmitting(false);
  };

  const canContinueA = fullName.trim().length >= 2 && /^\d{10}$/.test(mobile.trim());
  const canContinueB = selectedPetType && petName.trim().length >= 2;

  return (
    <MobileLayout>
      <div className="min-h-screen px-6 py-8" style={{ background: "radial-gradient(ellipse at top, #EDE5FF 0%, #FBF8F4 50%, #FFF0EB 100%)" }}>
        <div className="text-center mb-8">
          <img src="/petosauras-logo.png" alt="Petosauras" style={{ height: 60, objectFit: "contain" }} className="mx-auto mb-3" />
          <h1 className="text-2xl font-heading font-extrabold text-primary">Welcome to Petosauras! 🦕</h1>
          <p className="text-sm text-muted-foreground mt-1 font-body">Just a few details to get started</p>
          {user?.user_metadata?.avatar_url && (
            <img src={user.user_metadata.avatar_url} alt="" className="w-14 h-14 rounded-full mx-auto mt-3 border-2 border-primary" />
          )}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map(i => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {/* Step A: Your Details */}
        {step === 0 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading font-bold text-lg">Your Details</h2>
            <Input placeholder="Full name *" value={fullName} onChange={e => setFullName(e.target.value)} />
            <Input placeholder="Mobile number (10 digits) *" value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} />
            <Input placeholder="City (optional)" value={city} onChange={e => setCity(e.target.value)} />
            <select value={state} onChange={e => setState(e.target.value)}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="">State (optional)</option>
              {indianStates.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <Input placeholder="PIN code (optional)" value={pinCode} onChange={e => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => navigate("/feed")}>Skip for now</Button>
              <Button className="flex-1" disabled={!canContinueA} onClick={() => setStep(1)}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step B: Your Pet */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading font-bold text-lg">Your Pet</h2>
            <div className="grid grid-cols-3 gap-2">
              {petTypes.map(pt => (
                <button key={pt.label} onClick={() => { setSelectedPetType(pt.label); setBreed(""); }}
                  className={`p-3 rounded-xl text-center text-xs font-bold transition-all ${selectedPetType === pt.label ? "bg-primary text-primary-foreground scale-105" : "bg-muted text-muted-foreground"}`}>
                  <span className="text-2xl block">{pt.emoji}</span>{pt.label}
                </button>
              ))}
            </div>
            <Input placeholder="Pet name *" value={petName} onChange={e => setPetName(e.target.value)} />
            {breeds.length > 0 && (
              <select value={breed} onChange={e => setBreed(e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Select breed</option>
                {breeds.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            )}
            <div className="flex gap-2">
              <Input placeholder="Age (years)" type="number" value={age} onChange={e => setAge(e.target.value)} className="flex-1" />
              <select value={gender} onChange={e => setGender(e.target.value)}
                className="flex-1 h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(0)}>← Back</Button>
              <Button className="flex-1" disabled={!canContinueB} onClick={() => setStep(2)}>Continue →</Button>
            </div>
          </div>
        )}

        {/* Step C: Pet Photo */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <h2 className="font-heading font-bold text-lg">Pet Photo</h2>
            {petPhotoPreview ? (
              <img src={petPhotoPreview} alt="" className="w-32 h-32 rounded-2xl object-cover mx-auto" />
            ) : (
              <label className="block w-full border-2 border-dashed border-border rounded-2xl p-8 text-center cursor-pointer hover:border-primary/50">
                <span className="text-4xl block mb-2">📸</span>
                <p className="text-sm text-muted-foreground">Upload a photo of your pet</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) { setPetPhoto(f); setPetPhotoPreview(URL.createObjectURL(f)); }
                }} />
              </label>
            )}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
              <Button className="flex-1" onClick={handleComplete} disabled={submitting}>
                {submitting ? "Setting up..." : "Start Exploring 🦕"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default CompleteRegistrationScreen;
