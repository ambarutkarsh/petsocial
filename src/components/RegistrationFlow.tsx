import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2 } from "lucide-react";
import { BackIcon, CheckIcon, CloseIcon, UploadIcon } from "@/components/icons/PetosauraIcons";
import { breedsByType, getPasswordStrength, indianStates, petTypeEmoji, petTypes, validateStep1, validateStep2 } from "@/lib/registrationData";

import MobileLayout from "./MobileLayout";


interface Props {
  onComplete: () => void;
  onBackToLogin?: () => void;
  initialStep?: number;
}

const RegistrationFlow = ({ onComplete, onBackToLogin, initialStep = 0 }: Props) => {
  const [step, setStep] = useState(initialStep);

  // Step 1
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [password, setPassword] = useState("");
  const [touched1, setTouched1] = useState<Record<string, boolean>>({});

  // Email duplicate check
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [emailChecked, setEmailChecked] = useState(false);

  // Step 2
  const [selectedPetType, setSelectedPetType] = useState("");
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [customBreed, setCustomBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [touched2, setTouched2] = useState<Record<string, boolean>>({});
  const [petTypeShake, setPetTypeShake] = useState(false);

  // "Other" species AI validation
  const [speciesValidating, setSpeciesValidating] = useState(false);
  const [speciesValid, setSpeciesValid] = useState<boolean | null>(null);
  const [speciesError, setSpeciesError] = useState("");

  // Step 3
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(null);
  const [petPhotoValidating, setPetPhotoValidating] = useState(false);
  const [petPhotoValid, setPetPhotoValid] = useState(false);
  const [petPhotoError, setPetPhotoError] = useState("");
  const [vaccFile, setVaccFile] = useState<File | null>(null);
  const [vetFile, setVetFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const breeds = breedsByType[selectedPetType] || [];
  const isOtherType = selectedPetType === "Other";
  const isOtherBreed = breed === "Other (specify)";
  const effectiveBreed = isOtherType ? customBreed : isOtherBreed ? customBreed : breed;

  // Validations
  const step1Fields = { fullName, email, mobile, password };
  const step1Errors = validateStep1(step1Fields);
  const pinCodeError = pinCode && !/^\d{6}$/.test(pinCode) ? "PIN code must be exactly 6 digits" : "";
  const step1Valid = Object.keys(step1Errors).length === 0 && !emailExists && !pinCodeError;

  const step2Fields = { selectedPetType, petName, breed: effectiveBreed, age, gender };
  const step2Errors = validateStep2(step2Fields);
  const step2NeedsSpecies = (isOtherType || isOtherBreed) && speciesValid === false;
  const step2Valid = Object.keys(step2Errors).length === 0 && !step2NeedsSpecies && (!(isOtherType || isOtherBreed) || speciesValid === true || speciesValid === null);

  const pwStrength = getPasswordStrength(password);

  const touch1 = (field: string) => setTouched1((p) => ({ ...p, [field]: true }));
  const touch2 = (field: string) => setTouched2((p) => ({ ...p, [field]: true }));

  // Email format check only — duplicate detection happens at signUp time
  const checkEmailExists = async (emailVal: string) => {
    if (!emailVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) return;
    setEmailChecking(false);
    setEmailExists(false);
    setEmailChecked(true);
  };

  const handleContinueStep2 = () => {
    if (!selectedPetType) {
      setPetTypeShake(true);
      setTimeout(() => setPetTypeShake(false), 600);
      setTouched2((p) => ({ ...p, selectedPetType: true }));
      return;
    }
    setTouched2({ selectedPetType: true, petName: true, breed: true, age: true, gender: true });
    if (step2Valid) setStep(2);
  };

  // AI species validation
  const validateSpecies = useCallback(async (value: string) => {
    if (!value.trim()) return;
    setSpeciesValidating(true);
    setSpeciesValid(null);
    setSpeciesError("");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-pet`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ type: "species", species: value }),
        }
      );
      if (!res.ok) { setSpeciesValid(true); return; }
      const data = await res.json();
      if (data.result === "YES") {
        setSpeciesValid(true);
      } else {
        setSpeciesValid(false);
        setSpeciesError(`'${value}' doesn't appear to be a valid pet species or breed. Please check your spelling or choose a different type.`);
      }
    } catch {
      setSpeciesValid(true);
    } finally {
      setSpeciesValidating(false);
    }
  }, []);

  // AI pet photo validation
  const handlePetPhotoSelect = async (file: File | null) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File must be under 5MB");
      return;
    }
    setPetPhoto(file);
    setPetPhotoError("");
    setPetPhotoValid(false);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setPetPhotoPreview(dataUrl);
      setPetPhotoValidating(true);
      try {
        const base64 = dataUrl.split(",")[1];
        const mimeType = file.type;
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-pet`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({ type: "photo", imageBase64: base64, mimeType }),
          }
        );
        if (!res.ok) { setPetPhotoValid(true); setPetPhotoValidating(false); return; }
        const data = await res.json();
        if (data.result === "YES") {
          setPetPhotoValid(true);
        } else {
          setPetPhotoValid(false);
          setPetPhotoError("Pet not found in the image. Please try again.");
          // FIX 2: Keep preview visible, do NOT clear photo/preview
        }
      } catch {
        setPetPhotoValid(true);
      } finally {
        setPetPhotoValidating(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetryPhoto = () => {
    setPetPhoto(null);
    setPetPhotoPreview(null);
    setPetPhotoError("");
    setPetPhotoValid(false);
    // Trigger file picker via a hidden input
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".jpg,.jpeg,.png";
    input.onchange = (e) => {
      const f = (e.target as HTMLInputElement).files?.[0];
      if (f) handlePetPhotoSelect(f);
    };
    input.click();
  };

  const handleSignUp = async () => {
    setSubmitting(true);
    try {
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      let userId = existingUser?.id;

      if (!userId) {
        if (!fullName || !email || !password) {
          toast.error("Please fill in name, email and password");
          setSubmitting(false);
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) { toast.error(error.message); setSubmitting(false); return; }
        userId = data.user?.id;
        if (userId) {
          await supabase.from("profiles").update({
            phone: mobile || null,
            city: city || null,
            state: state || null,
            pin_code: pinCode || null,
            email: email || null,
          }).eq("id", userId);
        }
      }

      if (!userId) { toast.error("Signup failed"); setSubmitting(false); return; }

      // Upload pet photo to avatars bucket
      let petAvatarUrl: string | null = null;
      if (petPhoto) {
        const ext = petPhoto.name.split(".").pop();
        const path = `${userId}/pet-avatar.${ext}`;
        const { data: upload } = await supabase.storage.from("avatars").upload(path, petPhoto, { upsert: true });
        if (upload) {
          const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
          petAvatarUrl = urlData.publicUrl;
        }
      }

      // Create pet
      if (petName && selectedPetType) {
        await supabase.from("pets").insert({
          owner_id: userId,
          name: petName,
          pet_type: selectedPetType,
          species: effectiveBreed || null,
          age_years: age ? parseFloat(age) : null,
          gender,
          avatar_emoji: petTypeEmoji[selectedPetType] || "🐾",
          is_primary: true,
          avatar_url: petAvatarUrl,
        } as any);
      }

      // Upload records
      const { data: pets } = await supabase.from("pets").select("id").eq("owner_id", userId).limit(1);
      const petId = pets?.[0]?.id;

      if (vaccFile && petId) {
        const path = `${userId}/${crypto.randomUUID()}.${vaccFile.name.split(".").pop()}`;
        const { data: upload } = await supabase.storage.from("pet-records").upload(path, vaccFile);
        if (upload) {
          await supabase.from("pet_records").insert({
            pet_id: petId, owner_id: userId, record_type: "vaccination_card",
            file_url: path, file_name: vaccFile.name,
          });
        }
      }
      if (vetFile && petId) {
        const path = `${userId}/${crypto.randomUUID()}.${vetFile.name.split(".").pop()}`;
        const { data: upload } = await supabase.storage.from("pet-records").upload(path, vetFile);
        if (upload) {
          await supabase.from("pet_records").insert({
            pet_id: petId, owner_id: userId, record_type: "vet_records",
            file_url: path, file_name: vetFile.name,
          });
        }
      }

      toast.success("Welcome to Petosauras! 🦕");
      sendWelcomeEmail(userId);
      onComplete();
    } catch (err: any) {
      toast.error(err?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const backButton = (onBack: () => void, label?: string) => (
    <button
      onClick={onBack}
      className="flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 mb-4"
    >
      <BackIcon className="w-4 h-4" /> {label || "Back"}
    </button>
  );

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col px-6 pt-6 pb-8">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted"}`} />
          ))}
        </div>

        {/* STEP 0 — Your Details */}
        {step === 0 && (
          <div className="flex-1 animate-fade-in space-y-4">
            {backButton(() => onBackToLogin?.(), "Sign in")}
            <h2 className="text-2xl font-heading font-bold">Your Details</h2>

            <div>
              <Input placeholder="Full name" value={fullName} onBlur={() => touch1("fullName")}
                onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              {touched1.fullName && step1Errors.fullName && <p className="text-xs text-destructive mt-1">{step1Errors.fullName}</p>}
            </div>
            <div className="relative">
              <Input type="email" placeholder="Email" value={email}
                onBlur={() => { touch1("email"); checkEmailExists(email); }}
                onChange={(e) => { setEmail(e.target.value); setEmailExists(false); setEmailChecked(false); }}
                className="h-12 rounded-xl bg-muted/50 border-0 pr-10" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailChecking && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {emailChecked && !emailExists && <CheckIcon className="w-4 h-4 text-green-500" />}
                {emailExists && <CloseIcon className="w-4 h-4 text-destructive" />}
              </div>
              {touched1.email && step1Errors.email && <p className="text-xs text-destructive mt-1">{step1Errors.email}</p>}
              {emailExists && (
                <div className="mt-1">
                  <p className="text-xs text-destructive">You're already registered with this email. Please login instead.</p>
                  <button onClick={() => onBackToLogin?.()} className="text-xs text-primary font-semibold hover:underline mt-0.5">Go to Login</button>
                </div>
              )}
            </div>
            <div>
              <Input type="tel" placeholder="Mobile number (10 digits)" value={mobile} onBlur={() => touch1("mobile")}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} className="h-12 rounded-xl bg-muted/50 border-0" />
              {touched1.mobile && step1Errors.mobile && <p className="text-xs text-destructive mt-1">{step1Errors.mobile}</p>}
            </div>

            {/* City, State, PIN */}
            <Input placeholder="City (optional)" value={city}
              onChange={(e) => setCity(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            <select value={state} onChange={(e) => setState(e.target.value)}
              className="w-full h-12 rounded-xl bg-muted/50 border-0 px-4 font-body text-sm text-foreground">
              <option value="">State (optional)</option>
              {indianStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <div>
              <Input placeholder="PIN Code (optional)" value={pinCode}
                onChange={(e) => setPinCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="h-12 rounded-xl bg-muted/50 border-0" />
              {pinCodeError && <p className="text-xs text-destructive mt-1">{pinCodeError}</p>}
            </div>

            <div>
              <Input type="password" placeholder="Password" value={password} onBlur={() => touch1("password")}
                onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              {touched1.password && step1Errors.password && <p className="text-xs text-destructive mt-1">{step1Errors.password}</p>}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex gap-1 flex-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${
                        pwStrength === "Weak" ? (i === 0 ? "bg-destructive" : "bg-muted") :
                        pwStrength === "Medium" ? (i <= 1 ? "bg-amber-500" : "bg-muted") :
                        "bg-green-500"
                      }`} />
                    ))}
                  </div>
                  <span className={`text-xs font-medium ${
                    pwStrength === "Weak" ? "text-destructive" : pwStrength === "Medium" ? "text-amber-500" : "text-green-500"
                  }`}>{pwStrength}</span>
                </div>
              )}
            </div>

            <Button onClick={() => { setTouched1({ fullName: true, email: true, mobile: true, password: true }); if (step1Valid) setStep(1); }}
              className="w-full" size="lg" disabled={!step1Valid || emailChecking}>
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 1 — Your Pet */}
        {step === 1 && (
          <div className="flex-1 animate-fade-in space-y-4">
            {backButton(() => setStep(0))}
            <h2 className="text-2xl font-heading font-bold">Your Pet</h2>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">What type of pet do you have?</p>

            <div className={`grid grid-cols-3 gap-3 ${petTypeShake ? "animate-shake" : ""}`}>
              {petTypes.map((pt) => (
                <button key={pt.label}
                  onClick={() => { setSelectedPetType(pt.label); setBreed(""); setCustomBreed(""); setSpeciesValid(null); setSpeciesError(""); touch2("selectedPetType"); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${
                    selectedPetType === pt.label ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"
                  }`}
                >
                  <span className="text-3xl">{pt.emoji}</span>
                  <span className="text-xs font-medium">{pt.label}</span>
                </button>
              ))}
            </div>
            {touched2.selectedPetType && step2Errors.selectedPetType && <p className="text-xs text-destructive">{step2Errors.selectedPetType}</p>}

            <div>
              <Input placeholder="Pet name" value={petName} onBlur={() => touch2("petName")}
                onChange={(e) => setPetName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
              {touched2.petName && step2Errors.petName && <p className="text-xs text-destructive mt-1">{step2Errors.petName}</p>}
            </div>

            {/* Breed selection */}
            {isOtherType ? (
              <div className="relative">
                <Input placeholder="Enter animal type (e.g. Axolotl, Capybara, Fox)" value={customBreed}
                  onBlur={() => { touch2("breed"); if (customBreed.trim()) validateSpecies(customBreed); }}
                  onChange={(e) => { setCustomBreed(e.target.value); setSpeciesValid(null); setSpeciesError(""); }}
                  className="h-12 rounded-xl bg-muted/50 border-0 pr-10" />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {speciesValidating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  {speciesValid === true && <CheckIcon className="w-4 h-4 text-green-500" />}
                  {speciesValid === false && <CloseIcon className="w-4 h-4 text-destructive" />}
                </div>
                {speciesError && <p className="text-xs text-destructive mt-1">{speciesError}</p>}
                {touched2.breed && !customBreed.trim() && <p className="text-xs text-destructive mt-1">Species/breed is required</p>}
              </div>
            ) : breeds.length > 0 ? (
              <>
                <select value={breed} onChange={(e) => { setBreed(e.target.value); setCustomBreed(""); setSpeciesValid(null); setSpeciesError(""); }}
                  onBlur={() => touch2("breed")}
                  className="w-full h-12 rounded-xl bg-muted/50 border-0 px-4 font-body text-sm text-foreground">
                  <option value="">Select breed</option>
                  {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
                {isOtherBreed && (
                  <div className="relative">
                    <Input placeholder="Specify breed" value={customBreed}
                      onBlur={() => { touch2("breed"); if (customBreed.trim()) validateSpecies(customBreed); }}
                      onChange={(e) => { setCustomBreed(e.target.value); setSpeciesValid(null); setSpeciesError(""); }}
                      className="h-12 rounded-xl bg-muted/50 border-0 pr-10" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {speciesValidating && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                      {speciesValid === true && <CheckIcon className="w-4 h-4 text-green-500" />}
                      {speciesValid === false && <CloseIcon className="w-4 h-4 text-destructive" />}
                    </div>
                    {speciesError && <p className="text-xs text-destructive mt-1">{speciesError}</p>}
                  </div>
                )}
                {touched2.breed && step2Errors.breed && !isOtherBreed && <p className="text-xs text-destructive mt-1">{step2Errors.breed}</p>}
              </>
            ) : selectedPetType ? (
              <div>
                <Input placeholder="Species / Breed" value={breed} onChange={(e) => setBreed(e.target.value)}
                  onBlur={() => touch2("breed")} className="h-12 rounded-xl bg-muted/50 border-0" />
                {touched2.breed && step2Errors.breed && <p className="text-xs text-destructive mt-1">{step2Errors.breed}</p>}
              </div>
            ) : null}

            <div className="flex gap-3">
              <div className="flex-1">
                <Input type="number" placeholder="Age (years)" value={age}
                  onChange={(e) => setAge(e.target.value)} onBlur={() => touch2("age")}
                  className="h-12 rounded-xl bg-muted/50 border-0" />
                {touched2.age && step2Errors.age && <p className="text-xs text-destructive mt-1">{step2Errors.age}</p>}
              </div>
              <div className="flex rounded-xl overflow-hidden border border-muted">
                {(["Male", "Female"] as const).map((g) => (
                  <button key={g} onClick={() => setGender(g)}
                    className={`px-4 h-12 text-sm font-medium transition-colors ${
                      gender === g ? "bg-primary text-primary-foreground" : "bg-muted/50 text-text-mid"
                    }`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleContinueStep2} className="w-full" size="lg"
              disabled={!step2Valid || speciesValidating}>
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {/* STEP 2 — Pet Records & Photo */}
        {step === 2 && (
          <div className="flex-1 animate-fade-in space-y-4">
            {backButton(() => setStep(1))}
            <h2 className="text-2xl font-heading font-bold">Pet Photo & Records</h2>

            {/* Pet photo — REQUIRED */}
            <div>
              <p className="text-sm font-medium mb-2">Photo of your pet <span className="text-destructive">*</span></p>
              {!petPhotoPreview ? (
                <label className="border-2 border-dashed border-primary/50 rounded-2xl p-6 flex flex-col items-center gap-2 bg-primary/5 cursor-pointer">
                  <span className="text-3xl">📷</span>
                  <span className="text-sm font-medium text-primary">Upload a photo of your pet</span>
                  <span className="text-xs text-text-muted">JPG or PNG · Max 5MB · Required</span>
                  <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                    onChange={(e) => handlePetPhotoSelect(e.target.files?.[0] || null)} />
                </label>
              ) : (
                <div>
                  <div className="flex items-start gap-4">
                    <div className={`relative w-[100px] h-[100px] rounded-xl overflow-hidden border-2 ${
                      petPhotoValid ? "border-green-500" : petPhotoError ? "border-[#DC2626]" : "border-muted"
                    }`}>
                      <img src={petPhotoPreview} alt="Pet" className="w-full h-full object-cover" />
                      {petPhotoValidating && (
                        <div className="absolute inset-0 bg-background/70 flex flex-col items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-primary" />
                          <span className="text-[10px] font-medium text-primary mt-1">Verifying...</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      {petPhotoValid && <p className="text-sm text-green-600 font-medium">✓ Pet detected</p>}
                      {petPhotoValid && !petPhotoValidating && (
                        <label className="text-sm text-primary font-medium cursor-pointer hover:underline block mt-1">
                          Change photo
                          <input type="file" accept=".jpg,.jpeg,.png" className="hidden"
                            onChange={(e) => handlePetPhotoSelect(e.target.files?.[0] || null)} />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* FIX 2: Error banner below thumbnail */}
                  {petPhotoError && !petPhotoValidating && (
                    <div className="mt-3">
                      <div className="flex items-center gap-2 bg-[#FEE2E2] text-[#DC2626] rounded-lg px-3.5 py-2.5 text-[13px]">
                        <span>❌</span>
                        <span>{petPhotoError}</span>
                      </div>
                      <button onClick={handleRetryPhoto}
                        className="text-sm text-primary font-medium underline mt-2">
                        Choose different photo
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Optional uploads */}
            <p className="text-sm text-text-mid">Upload vaccination cards or vet records (optional)</p>
            <label className="border-2 border-dashed border-primary/30 rounded-2xl p-6 flex flex-col items-center gap-2 bg-primary/5 cursor-pointer">
              <UploadIcon className="w-6 h-6 text-primary" />
              <span className="text-sm font-medium text-primary">
                {vaccFile ? `📋 ${vaccFile.name}` : "📋 Upload Vaccination Card"}
              </span>
              <span className="text-xs text-text-muted">PDF, JPG, PNG — max 10MB</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => setVaccFile(e.target.files?.[0] || null)} />
            </label>
            <label className="border-2 border-dashed border-muted rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer">
              <UploadIcon className="w-6 h-6 text-text-muted" />
              <span className="text-sm font-medium text-text-mid">
                {vetFile ? `🩺 ${vetFile.name}` : "🩺 Upload Vet Records"}
              </span>
              <span className="text-xs text-text-muted">Optional — add later</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                onChange={(e) => setVetFile(e.target.files?.[0] || null)} />
            </label>

            <Button onClick={handleSignUp} size="lg" className="w-full" disabled={submitting || !petPhotoValid}>
              {submitting ? "Creating…" : "Start Exploring 🐾"}
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default RegistrationFlow;
