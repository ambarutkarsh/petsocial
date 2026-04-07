import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "./MobileLayout";
import { Upload, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const petTypes = [
  { emoji: "🐕", label: "Canine" },
  { emoji: "🐈", label: "Feline" },
  { emoji: "🐠", label: "Aquatic" },
  { emoji: "🦜", label: "Avian" },
  { emoji: "🐇", label: "Small Pet" },
  { emoji: "🦎", label: "Reptile" },
  { emoji: "🐝", label: "Insect" },
  { emoji: "🐎", label: "Equine" },
  { emoji: "🐾", label: "Other" },
];

const breedsByType: Record<string, string[]> = {
  Canine: ["Labrador Retriever", "Golden Retriever", "Indie/Mixed Breed", "German Shepherd", "Beagle", "Shih Tzu", "Pomeranian", "Doberman", "Rottweiler"],
  Feline: ["Persian", "Siamese", "Maine Coon", "Indie/Mixed Breed", "British Shorthair", "Bengal"],
  Avian: ["African Grey", "Budgerigar", "Cockatiel", "Lovebird", "Macaw", "Alexandrine Parakeet"],
  Aquatic: ["Discus", "Guppy", "Betta", "Goldfish", "Arowana", "Koi"],
  Reptile: ["Leopard Gecko", "Bearded Dragon", "Ball Python", "Russian Tortoise"],
  "Small Pet": ["Holland Lop", "Rex Rabbit", "Syrian Hamster", "Guinea Pig", "Chinchilla"],
};

const petTypeEmoji: Record<string, string> = {};
petTypes.forEach((pt) => { petTypeEmoji[pt.label] = pt.emoji; });

interface Props {
  onComplete: () => void;
}

const RegistrationFlow = ({ onComplete }: Props) => {
  const [step, setStep] = useState(0);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPetType, setSelectedPetType] = useState("");
  const [petName, setPetName] = useState("");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"Male" | "Female">("Male");
  const [submitting, setSubmitting] = useState(false);
  const [vaccFile, setVaccFile] = useState<File | null>(null);
  const [vetFile, setVetFile] = useState<File | null>(null);

  const breeds = breedsByType[selectedPetType] || [];

  const handleSignUp = async () => {
    if (!fullName || !email || !password) {
      toast.error("Please fill in name, email and password");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    // Update profile with phone
    if (data.user && mobile) {
      await supabase.from("profiles").update({ phone: mobile }).eq("id", data.user.id);
    }

    // Create pet if info provided
    if (data.user && petName && selectedPetType) {
      await supabase.from("pets").insert({
        owner_id: data.user.id,
        name: petName,
        pet_type: selectedPetType,
        species: breed || null,
        age_years: age ? parseFloat(age) : null,
        gender,
        avatar_emoji: petTypeEmoji[selectedPetType] || "🐾",
        is_primary: true,
      });
    }

    // Upload files if present
    if (data.user) {
      const userId = data.user.id;
      // Get pet id for records
      const { data: pets } = await supabase.from("pets").select("id").eq("owner_id", userId).limit(1);
      const petId = pets?.[0]?.id;

      if (vaccFile && petId) {
        const path = `${userId}/${crypto.randomUUID()}.${vaccFile.name.split(".").pop()}`;
        const { data: upload } = await supabase.storage.from("pet-records").upload(path, vaccFile);
        if (upload) {
          await supabase.from("pet_records").insert({
            pet_id: petId,
            owner_id: userId,
            record_type: "vaccination_card",
            file_url: path,
            file_name: vaccFile.name,
          });
        }
      }
      if (vetFile && petId) {
        const path = `${userId}/${crypto.randomUUID()}.${vetFile.name.split(".").pop()}`;
        const { data: upload } = await supabase.storage.from("pet-records").upload(path, vetFile);
        if (upload) {
          await supabase.from("pet_records").insert({
            pet_id: petId,
            owner_id: userId,
            record_type: "vet_records",
            file_url: path,
            file_name: vetFile.name,
          });
        }
      }
    }

    setSubmitting(false);
    toast.success("Account created! Welcome to PawSocial 🐾");
    onComplete();
  };

  return (
    <MobileLayout>
      <div className="min-h-screen flex flex-col px-6 pt-8 pb-8">
        <div className="flex justify-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`w-2.5 h-2.5 rounded-full transition-colors ${i === step ? "bg-primary" : i < step ? "bg-primary/40" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="flex-1 animate-fade-in space-y-5">
            <h2 className="text-2xl font-heading font-bold">Your Details</h2>
            <Input placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            <Input type="tel" placeholder="Mobile number" value={mobile} onChange={(e) => setMobile(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            <Button onClick={() => setStep(1)} className="w-full" size="lg">
              Continue <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 animate-fade-in space-y-5">
            <h2 className="text-2xl font-heading font-bold">Your Pet</h2>
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">What type of pet do you have?</p>
            <div className="grid grid-cols-3 gap-3">
              {petTypes.map((pt) => (
                <button
                  key={pt.label}
                  onClick={() => { setSelectedPetType(pt.label); setBreed(""); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition-all ${selectedPetType === pt.label ? "border-primary bg-primary/5" : "border-transparent bg-muted/50"}`}
                >
                  <span className="text-3xl">{pt.emoji}</span>
                  <span className="text-xs font-medium">{pt.label}</span>
                </button>
              ))}
            </div>
            <Input placeholder="Pet name" value={petName} onChange={(e) => setPetName(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            {breeds.length > 0 ? (
              <select value={breed} onChange={(e) => setBreed(e.target.value)} className="w-full h-12 rounded-xl bg-muted/50 border-0 px-4 font-body text-sm text-foreground">
                <option value="">Select breed</option>
                {breeds.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            ) : selectedPetType ? (
              <Input placeholder="Species / Breed" value={breed} onChange={(e) => setBreed(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0" />
            ) : null}
            <div className="flex gap-3">
              <Input type="number" placeholder="Age (years)" value={age} onChange={(e) => setAge(e.target.value)} className="h-12 rounded-xl bg-muted/50 border-0 flex-1" />
              <div className="flex rounded-xl overflow-hidden border border-muted">
                {(["Male", "Female"] as const).map((g) => (
                  <button key={g} onClick={() => setGender(g)} className={`px-4 h-12 text-sm font-medium transition-colors ${gender === g ? "bg-primary text-primary-foreground" : "bg-muted/50 text-text-mid"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(0)} size="lg" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(2)} size="lg" className="flex-1">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 animate-fade-in space-y-5">
            <h2 className="text-2xl font-heading font-bold">Pet Records</h2>
            <p className="text-sm text-text-mid">Upload vaccination cards or vet records (optional)</p>
            <label className="border-2 border-dashed border-primary/30 rounded-2xl p-8 flex flex-col items-center gap-3 bg-primary/5 cursor-pointer">
              <Upload className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium text-primary">
                {vaccFile ? `📋 ${vaccFile.name}` : "📋 Upload Vaccination Card"}
              </span>
              <span className="text-xs text-text-muted">PDF, JPG, PNG — max 10MB</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setVaccFile(e.target.files?.[0] || null)} />
            </label>
            <label className="border-2 border-dashed border-muted rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer">
              <Upload className="w-8 h-8 text-text-muted" />
              <span className="text-sm font-medium text-text-mid">
                {vetFile ? `🩺 ${vetFile.name}` : "🩺 Upload Vet Records"}
              </span>
              <span className="text-xs text-text-muted">Optional — add later</span>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => setVetFile(e.target.files?.[0] || null)} />
            </label>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} size="lg" className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={handleSignUp} size="lg" className="flex-1" disabled={submitting}>
                {submitting ? "Creating…" : "Start Exploring 🐾"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default RegistrationFlow;
