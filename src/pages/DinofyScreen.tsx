import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, RotateCcw, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SPECIES, BREEDS, lookupDino, buildPrompt, type Species, type Dino } from "@/lib/dinofyData";

// Brand tokens (per spec — page-scoped, not in global theme)
const C = {
  bg: "#F2EEE9",
  primary: "#7B55C8",
  primaryHover: "#6A44B8",
  lavLight: "#EAE3F8",
  lavDeep: "#DDD4F5",
  textDark: "#1A1930",
  textMid: "#4A4860",
  textMuted: "#9B9BAE",
  white: "#FFFFFF",
  border: "#E8E2F2",
};

const LOADING_MESSAGES = [
  "🔬 Sequencing prehistoric DNA...",
  "🧬 Cross-referencing Jurassic genome...",
  "🦕 Consulting the fossil record...",
  "⏳ Time-travelling 65 million years back...",
  "🌋 Awakening your dino twin...",
  "🪨 Chiselling through ancient amber...",
];

type Step = 1 | 2 | 3 | 4;

async function compressImage(file: File, maxSize = 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height && width > maxSize) { height = (height * maxSize) / width; width = maxSize; }
        else if (height > maxSize) { width = (width * maxSize) / height; height = maxSize; }
        const canvas = document.createElement("canvas");
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const DinofyScreen = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [species, setSpecies] = useState<Species | "">("");
  const [breed, setBreed] = useState<string>("");
  const [dinoUrl, setDinoUrl] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (step !== 3) return;
    const t = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, [step]);

  const dino = useMemo<Dino | null>(() => (species && breed ? lookupDino(species, breed) : null), [species, breed]);
  const breedOptions = species ? BREEDS[species].map((b) => b.breed) : [];

  const handleFile = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    setError(null);
    const compressed = await compressImage(file, 1024);
    setPetPhoto(compressed);
    setStep(2);
  };

  const generate = async () => {
    if (!dino || !breed) return;
    setError(null);
    setStep(3);
    setLoadingMsgIdx(0);
    setDinoUrl(null);
    try {
      const prompt = buildPrompt(dino, breed);
      const { data, error: fnErr } = await supabase.functions.invoke("generate-dino", { body: { prompt } });
      if (fnErr) throw fnErr;
      if (!data?.imageUrl) throw new Error("No image returned");
      setDinoUrl(data.imageUrl);
      setStep(4);
    } catch (e: any) {
      setError(e?.message || "Failed to generate. Please try again.");
      setStep(2);
    }
  };

  const downloadDino = async () => {
    if (!dinoUrl) return;
    try {
      const r = await fetch(dinoUrl);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dinofy-${dino?.name || "dino"}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(dinoUrl, "_blank");
    }
  };

  const reset = (full: boolean) => {
    setError(null);
    setDinoUrl(null);
    if (full) { setPetPhoto(null); setSpecies(""); setBreed(""); setStep(1); }
    else { setStep(2); }
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: C.textDark }}>
      <style>{`
        @keyframes dfFadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes dfBounce { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-8px);} }
        @keyframes dfSpin { to { transform: rotate(360deg);} }
        @keyframes dfPop { from { opacity:0; transform: scale(0.6);} to { opacity:1; transform: scale(1);} }
        @keyframes dfRevealLeft { from { clip-path: inset(0 100% 0 0);} to { clip-path: inset(0 0 0 0);} }
        @keyframes dfRevealRight { from { clip-path: inset(0 0 0 100%);} to { clip-path: inset(0 0 0 0);} }
        @keyframes dfFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-6px);} }
        @keyframes dfScaleBounce { 0% { opacity:0; transform: scale(0.7);} 60% { opacity:1; transform: scale(1.05);} 100% { transform: scale(1);} }
        @keyframes dfSparkle { 0% { opacity:0; transform: scale(0) rotate(0deg);} 50% { opacity:1; transform: scale(1) rotate(180deg);} 100% { opacity:0; transform: scale(0) rotate(360deg);} }
        .df-fade-up { animation: dfFadeUp 0.4s ease both; }
        .df-bounce { animation: dfBounce 2s ease infinite; }
        .df-spin { animation: dfSpin 1.2s linear infinite; }
        .df-pop { animation: dfPop 0.4s cubic-bezier(.5,1.6,.4,1) both; }
        .df-reveal-l { animation: dfRevealLeft 0.7s cubic-bezier(.6,0,.2,1) both; }
        .df-reveal-r { animation: dfRevealRight 0.7s cubic-bezier(.6,0,.2,1) both; }
        .df-float { animation: dfFloat 3.5s ease-in-out infinite; }
        .df-scale-bounce { animation: dfScaleBounce 0.6s cubic-bezier(.5,1.6,.4,1) both; }
        .df-sparkle { animation: dfSparkle 1.6s ease-out both; }
      `}</style>

      {/* App bar */}
      <header className="df-fade-up" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 999, background: C.lavLight, display: "grid", placeItems: "center" }} aria-label="Back">
          <ArrowLeft size={18} color={C.primary} />
        </button>
        <div style={{
          width: 36, height: 36, borderRadius: 999,
          background: "linear-gradient(135deg, #7B55C8 0%, #E255A8 100%)",
          display: "grid", placeItems: "center", color: "#fff", fontSize: 16,
        }}>🐾</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}>DinoFy <span aria-hidden>🦖</span></div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Step {step} of 4</div>
        </div>
      </header>

      <main style={{ maxWidth: 480, margin: "0 auto", padding: "20px 16px 40px" }}>
        {error && (
          <div className="df-fade-up" style={{ background: "#FCE7E7", color: "#8A1F1F", border: "1px solid #F5C2C2", padding: "10px 12px", borderRadius: 12, marginBottom: 14, fontSize: 13 }}>{error}</div>
        )}

        {/* STEP 1 — UPLOAD */}
        {step === 1 && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.2, color: C.textDark }}>Turn your pet into a dinosaur</h1>
              <p style={{ color: C.textMid, fontSize: 14, marginTop: 6 }}>Upload your pet's photo. We'll match their breed personality to a prehistoric twin.</p>
            </div>

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

            <button
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f); }}
              style={{
                background: dragOver ? C.lavDeep : C.lavLight,
                border: `2px dashed ${C.primary}`,
                borderRadius: 20,
                padding: "40px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                cursor: "pointer", transition: "background .2s",
              }}
            >
              <div className="df-bounce" style={{ width: 64, height: 64, borderRadius: 999, background: C.white, display: "grid", placeItems: "center", boxShadow: "0 4px 12px rgba(123,85,200,0.15)" }}>
                <Upload size={28} color={C.primary} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.textDark }}>Drop your pet's photo</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>or tap to browse · JPG, PNG, WEBP</div>
              </div>
            </button>

            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>Works with any species</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SPECIES.map((s) => (
                  <span key={s} style={{ background: C.white, border: `1px solid ${C.border}`, color: C.textMid, fontSize: 12, fontWeight: 600, padding: "6px 12px", borderRadius: 999 }}>{s}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* STEP 2 — CONFIGURE */}
        {step === 2 && petPhoto && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <img src={petPhoto} alt="Your pet" style={{ width: 88, height: 88, borderRadius: 16, objectFit: "cover", border: `2px solid ${C.lavDeep}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.textMuted, fontWeight: 600 }}>Your pet</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: C.textDark, marginTop: 2 }}>Tell us about them</div>
                <button onClick={() => fileRef.current?.click()} style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginTop: 4 }}>Change photo</button>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, display: "block", marginBottom: 6 }}>Species</label>
              <select value={species} onChange={(e) => { setSpecies(e.target.value as Species); setBreed(""); }} style={{ width: "100%", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontWeight: 600, color: C.textDark }}>
                <option value="">Select species…</option>
                {SPECIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: C.textMid, display: "block", marginBottom: 6 }}>Breed</label>
              <select value={breed} onChange={(e) => setBreed(e.target.value)} disabled={!species} style={{ width: "100%", background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", fontSize: 14, fontWeight: 600, color: species ? C.textDark : C.textMuted, opacity: species ? 1 : 0.6 }}>
                <option value="">{species ? "Select breed…" : "Pick species first"}</option>
                {breedOptions.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>

            {dino && (
              <div className="df-fade-up" style={{ background: C.lavLight, border: `1px solid ${C.lavDeep}`, borderRadius: 16, padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 38, lineHeight: 1 }}>{dino.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>Your Dino Twin</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.textDark }}>{dino.name}</div>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.textMid, marginTop: 10, lineHeight: 1.4 }}>{dino.description}</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
                  {dino.traits.map((t, i) => (
                    <span key={t} className="df-pop" style={{ animationDelay: `${0.1 + i * 0.08}s`, background: C.white, color: C.primary, fontSize: 11, fontWeight: 700, padding: "5px 10px", borderRadius: 999, border: `1px solid ${C.lavDeep}` }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={generate}
              disabled={!dino}
              style={{
                width: "100%",
                background: dino ? C.primary : C.lavDeep,
                color: dino ? "#fff" : C.textMuted,
                fontWeight: 800, fontSize: 16,
                padding: "16px",
                borderRadius: 14,
                cursor: dino ? "pointer" : "not-allowed",
                boxShadow: dino ? "0 6px 18px rgba(123,85,200,0.35)" : "none",
                transition: "all .2s",
              }}
              onMouseEnter={(e) => { if (dino) (e.currentTarget.style.background = C.primaryHover); }}
              onMouseLeave={(e) => { if (dino) (e.currentTarget.style.background = C.primary); }}
            >
              🦖 Dinofy My Pet!
            </button>
          </section>
        )}

        {/* STEP 3 — GENERATING */}
        {step === 3 && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 0" }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <div className="df-spin" style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: `6px solid ${C.lavLight}`, borderTopColor: C.primary,
              }} />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontSize: 50 }}>{dino?.emoji || "🦖"}</div>
            </div>

            <div style={{ textAlign: "center", minHeight: 50 }}>
              <div key={loadingMsgIdx} className="df-fade-up" style={{ fontSize: 15, fontWeight: 700, color: C.textDark }}>
                {LOADING_MESSAGES[loadingMsgIdx]}
              </div>
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 12 }}>
                {LOADING_MESSAGES.map((_, i) => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: i === loadingMsgIdx ? C.primary : C.lavDeep }} />
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, width: "100%", marginTop: 12 }}>
              {petPhoto && <img src={petPhoto} alt="" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 16, filter: "grayscale(0.85)" }} />}
              <div style={{ aspectRatio: "1/1", borderRadius: 16, background: C.lavLight, display: "grid", placeItems: "center", fontSize: 56 }}>
                <span className="df-spin" style={{ display: "inline-block" }}>{dino?.emoji || "🦖"}</span>
              </div>
            </div>
          </section>
        )}

        {/* STEP 4 — RESULT */}
        {step === 4 && dino && dinoUrl && petPhoto && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <img src={petPhoto} alt="Your pet" className="df-reveal-l" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 16, border: `3px solid ${C.border}` }} />
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: C.textMid, marginTop: 6 }}>Your Pet</div>
              </div>
              <div>
                <img src={dinoUrl} alt={dino.name} className="df-reveal-r" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 16, border: `3px solid ${C.primary}` }} />
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: C.primary, marginTop: 6 }}>Dino Twin</div>
              </div>
            </div>

            <div style={{ background: C.white, borderRadius: 18, padding: 18, border: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ fontSize: 40 }}>{dino.emoji}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>Prehistoric Personality</div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>{dino.name}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.textMid, marginTop: 12, lineHeight: 1.5 }}>{dino.description}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {dino.traits.map((t, i) => (
                  <span key={t} className="df-pop" style={{ animationDelay: `${0.6 + i * 0.15}s`, background: C.lavLight, color: C.primary, fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 999 }}>{t}</span>
                ))}
              </div>
            </div>

            <div style={{ background: C.lavLight, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: C.textMid, textAlign: "center" }}>
              Generated as: <strong style={{ color: C.primary }}>{dino.name}</strong> · {breed}
            </div>

            <button
              onClick={downloadDino}
              style={{ background: C.primary, color: "#fff", fontWeight: 800, fontSize: 15, padding: "14px", borderRadius: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, boxShadow: "0 6px 18px rgba(123,85,200,0.35)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.primary)}
            >
              <Download size={18} /> Download Dino Portrait
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={generate} style={{ background: C.white, border: `1px solid ${C.lavDeep}`, color: C.primary, fontWeight: 700, padding: "12px", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <RotateCcw size={15} /> Try again
              </button>
              <button onClick={() => reset(true)} style={{ background: C.white, border: `1px solid ${C.lavDeep}`, color: C.primary, fontWeight: 700, padding: "12px", borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <Camera size={15} /> New pet
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default DinofyScreen;
