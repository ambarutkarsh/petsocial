import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Download, RotateCcw, Camera, Sparkles, Instagram, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { lookupDinoByDetection, type Dino, type Species } from "@/lib/dinofyData";

const ADMIN_EMAIL = "ambarutkarsh@gmail.com";
const GUEST_KEY = "dinofy_guest_generation_count";
const GUEST_LIMIT = 1;
const USER_LIMIT = 5;
const getGuestCount = () => {
  try { return parseInt(localStorage.getItem(GUEST_KEY) || "0", 10) || 0; } catch { return 0; }
};
const incGuestCount = () => {
  try { localStorage.setItem(GUEST_KEY, String(getGuestCount() + 1)); } catch {}
};

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
  warn: "#B8860B",
};

const SUPPORTED = ["Dog","Cat","Bird","Rabbit","Hamster","Guinea Pig","Fish","Reptile","Tortoise","Ferret","Chinchilla","Hedgehog","Sugar Glider"];

const LOADING_MESSAGES = [
  "🔬 Sequencing prehistoric DNA...",
  "🧬 Cross-referencing Jurassic genome...",
  "🦕 Consulting the fossil record...",
  "⏳ Time-travelling 65 million years back...",
  "🌋 Awakening your dino twin...",
  "🪨 Chiselling through ancient amber...",
];

type Step = 1 | 2 | 3 | 4 | 5;
// 1 upload, 2 detecting, 3 detected (confirm + dino twin), 4 generating, 5 result

interface Detection {
  species: string;
  breed: string;
  confidence: number;
  matchedSpecies: Species;
  matchedBreed: string;
  dino: Dino;
}

function loadImg(src: string, crossOrigin = true): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Compose Petosauras branding (logo bottom-right + footer pill) onto a generated dino image.
async function brandDinoImage(srcUrl: string): Promise<string> {
  try {
    const [base, logo] = await Promise.all([
      loadImg(srcUrl, true),
      loadImg("/petosauras-logo.png", false).catch(() => loadImg("/petosauras-icon.png", false)),
    ]);
    const w = base.naturalWidth || base.width;
    const h = base.naturalHeight || base.height;
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(base, 0, 0, w, h);

    // Logo bottom-right, ~10% width, with soft shadow + slight opacity
    const logoW = Math.round(w * 0.10);
    const ratio = logo.naturalHeight / logo.naturalWidth || 1;
    const logoH = Math.round(logoW * ratio);
    const pad = Math.round(w * 0.03); // ~24-32px depending on size
    const lx = w - logoW - pad;
    const ly = h - logoH - pad - Math.round(h * 0.07); // sit above footer pill
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = Math.max(8, Math.round(w * 0.012));
    ctx.shadowOffsetY = 2;
    ctx.drawImage(logo, lx, ly, logoW, logoH);
    ctx.restore();

    // Footer pill: "🦖 Created with Petosauras DinoFy · petosauras.com"
    const text = "🦖 Created with Petosauras DinoFy · petosauras.com";
    const fontSize = Math.max(14, Math.round(w * 0.022));
    ctx.font = `600 ${fontSize}px "Plus Jakarta Sans", system-ui, sans-serif`;
    const textW = ctx.measureText(text).width;
    const pillPadX = Math.round(fontSize * 1.1);
    const pillPadY = Math.round(fontSize * 0.6);
    const pillW = Math.round(textW + pillPadX * 2);
    const pillH = Math.round(fontSize + pillPadY * 2);
    const px = Math.round((w - pillW) / 2);
    const py = h - pillH - pad;
    const r = pillH / 2;

    ctx.save();
    // translucent purple glass
    ctx.fillStyle = "rgba(123,85,200,0.55)";
    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pillW - r, py);
    ctx.quadraticCurveTo(px + pillW, py, px + pillW, py + r);
    ctx.lineTo(px + pillW, py + pillH - r);
    ctx.quadraticCurveTo(px + pillW, py + pillH, px + pillW - r, py + pillH);
    ctx.lineTo(px + r, py + pillH);
    ctx.quadraticCurveTo(px, py + pillH, px, py + pillH - r);
    ctx.lineTo(px, py + r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.closePath();
    ctx.fill();
    // subtle border highlight
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.35)";
    ctx.stroke();
    // text
    ctx.fillStyle = "#FFFFFF";
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText(text, px + pillW / 2, py + pillH / 2 + 1);
    ctx.restore();

    return canvas.toDataURL("image/png");
  } catch (e) {
    console.warn("brandDinoImage failed, returning original", e);
    return srcUrl;
  }
}

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

function buildPromptDynamic(dino: Dino, breedName: string): string {
  const traits = dino.traits.slice(0, 4).join(", ");
  return `A premium Pixar-style 3D animated dinosaur-pet hybrid using the uploaded pet photo as the exact identity reference. Preserve the exact facial identity of the uploaded ${breedName} pet: eyes, nose, muzzle, ears, fur colour, facial markings, breed identity, expression, proportions. Transform ONLY the body into a cute cartoon ${dino.name} dinosaur hybrid. Character personality: ${dino.description} Traits: ${traits}. Style: Pixar animated movie quality, DreamWorks expressive character design, premium 3D rendering, cinematic warm lighting, adorable chunky baby dinosaur anatomy, oversized expressive eyes, collectible figurine quality, transparent background, single subject, square composition. Do not alter pet face identity. Do not create generic cartoon animals. No text. No watermark.`;
}

const DinofyScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [petPhoto, setPetPhoto] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [dinoUrl, setDinoUrl] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showGuestLimit, setShowGuestLimit] = useState(false);
  const [showUserLimit, setShowUserLimit] = useState(false);

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap";
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    if (step !== 4) return;
    const t = setInterval(() => setLoadingMsgIdx((i) => (i + 1) % LOADING_MESSAGES.length), 2800);
    return () => clearInterval(t);
  }, [step]);

  const runDetection = async (photoDataUrl: string) => {
    setStep(2);
    setError(null);
    setDetection(null);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke("detect-pet", { body: { imageUrl: photoDataUrl } });
      if (fnErr) throw fnErr;
      const species = String(data?.species || "Unknown");
      const breed = String(data?.breed || "Generic Pet");
      const confidence = Number(data?.confidence) || 0;
      const matched = lookupDinoByDetection(species, breed);
      if (!matched) {
        setError("We couldn't confidently identify your pet. Try a clearer front-facing image.");
        setStep(1);
        return;
      }
      setDetection({ species, breed, confidence, ...matched });
      setStep(3);
    } catch (e: any) {
      setError(e?.message || "Detection failed. Try another photo.");
      setStep(1);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.match(/image\/(jpeg|png|webp|jpg)/)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    setError(null);
    const compressed = await compressImage(file, 1024);
    setPetPhoto(compressed);
    runDetection(compressed);
  };

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  const generate = async () => {
    if (!detection || !petPhoto) return;

    // Pre-check: guest limit
    if (!user && getGuestCount() >= GUEST_LIMIT) {
      setShowGuestLimit(true);
      return;
    }

    setError(null);
    setStep(4);
    setLoadingMsgIdx(0);
    setDinoUrl(null);
    try {
      const prompt = buildPromptDynamic(detection.dino, detection.matchedBreed);

      // Guests: call replicate via a dedicated path? For MVP, require login server-side.
      // If guest, we still need to generate without auth — but server requires auth.
      // Solution: For guest's single allowed gen, we keep a public path: skip server limit
      // by calling with no auth header — function returns 401. So instead, do guest gen
      // via the same function but bypass auth check using a guest token route is complex.
      // MVP: allow guest generation via direct call; the function rejects unauth.
      // To keep MVP simple, we treat guests as needing login. Per spec: 1 free gen for guests.
      // We invoke; if 401 and guest under limit, we proceed via a fallback flag.

      const { data, error: fnErr } = await supabase.functions.invoke("generate-dino", {
        body: { prompt, imageUrl: petPhoto, guest: !user },
      });

      if (fnErr) {
        // Inspect error for limit / auth signals
        const msg = (fnErr as any)?.context?.body || (fnErr as any)?.message || "";
        const text = typeof msg === "string" ? msg : JSON.stringify(msg);
        if (text.includes("limit_reached")) {
          setShowUserLimit(true);
          setStep(3);
          return;
        }
        if (text.includes("auth_required")) {
          setShowGuestLimit(true);
          setStep(3);
          return;
        }
        throw fnErr;
      }
      if (!data?.imageUrl) throw new Error("No image returned");

      // Increment guest count locally on success
      if (!user) incGuestCount();

      const branded = await brandDinoImage(data.imageUrl);
      setDinoUrl(branded);
      setStep(5);
    } catch (e: any) {
      setError(e?.message || "Failed to generate. Please try again.");
      setStep(3);
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
      a.download = `dinofy-${detection?.dino.name || "dino"}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(dinoUrl, "_blank");
    }
  };

  const IG_CAPTION = "Meet my pet's Dino Twin 🦖🐾 Created with Petosauras DinoFy. Try it on petosauras.com #petosauras";
  const WA_MESSAGE = "Look at my pet's Dino Twin 🦖🐾 I created this with Petosauras DinoFy. Try it on petosauras.com #petosauras";

  const fetchDinoFile = async (): Promise<File | null> => {
    if (!dinoUrl) return null;
    try {
      const r = await fetch(dinoUrl);
      const blob = await r.blob();
      return new File([blob], `dinofy-${detection?.dino.name || "dino"}.png`, { type: blob.type || "image/png" });
    } catch { return null; }
  };

  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  };

  const shareInstagram = async () => {
    const file = await fetchDinoFile();
    const shareData: any = { title: "My Petosauras Dino Twin", text: IG_CAPTION, url: "https://petosauras.com/dinofy" };
    if (file && (navigator as any).canShare?.({ files: [file] })) shareData.files = [file];
    const copied = await copyToClipboard(IG_CAPTION);
    if (navigator.share && (shareData.files || true)) {
      try {
        await navigator.share(shareData);
        if (copied) toast("Caption copied. Paste it on Instagram while posting.");
        return;
      } catch (e: any) {
        if (e?.name === "AbortError") return;
      }
    }
    // Fallback: open Instagram
    if (copied) toast("Caption copied. Paste it on Instagram while posting.");
    window.open("https://www.instagram.com/", "_blank");
  };

  const shareWhatsApp = async () => {
    const file = await fetchDinoFile();
    const shareData: any = { title: "My Petosauras Dino Twin", text: WA_MESSAGE, url: "https://petosauras.com/dinofy" };
    if (file && (navigator as any).canShare?.({ files: [file] })) shareData.files = [file];
    if (navigator.share) {
      try { await navigator.share(shareData); return; }
      catch (e: any) { if (e?.name === "AbortError") return; }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(WA_MESSAGE)}`, "_blank");
  };

  const reset = () => {
    setError(null); setDinoUrl(null); setDetection(null); setPetPhoto(null); setStep(1);
  };

  const dino = detection?.dino;

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", color: C.textDark }}>
      <style>{`
        @keyframes dfFadeUp { from { opacity:0; transform:translateY(16px);} to { opacity:1; transform:translateY(0);} }
        @keyframes dfBounce { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-8px);} }
        @keyframes dfSpin { to { transform: rotate(360deg);} }
        @keyframes dfPop { from { opacity:0; transform: scale(0.6);} to { opacity:1; transform: scale(1);} }
        @keyframes dfRevealLeft { from { clip-path: inset(0 100% 0 0);} to { clip-path: inset(0 0 0 0);} }
        @keyframes dfFloat { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-6px);} }
        @keyframes dfScaleBounce { 0% { opacity:0; transform: scale(0.7);} 60% { opacity:1; transform: scale(1.05);} 100% { transform: scale(1);} }
        @keyframes dfSparkle { 0% { opacity:0; transform: scale(0) rotate(0deg);} 50% { opacity:1; transform: scale(1) rotate(180deg);} 100% { opacity:0; transform: scale(0) rotate(360deg);} }
        @keyframes dfShimmer { 0% { background-position: -200% 0;} 100% { background-position: 200% 0;} }
        @keyframes dfScanLine { 0% { transform: translateY(-100%);} 100% { transform: translateY(100%);} }
        @keyframes dfBorderPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(123,85,200,0.5);} 50% { box-shadow: 0 0 0 8px rgba(123,85,200,0);} }
        .df-fade-up { animation: dfFadeUp 0.4s ease both; }
        .df-bounce { animation: dfBounce 2s ease infinite; }
        .df-spin { animation: dfSpin 1.2s linear infinite; }
        .df-pop { animation: dfPop 0.4s cubic-bezier(.5,1.6,.4,1) both; }
        .df-reveal-l { animation: dfRevealLeft 0.7s cubic-bezier(.6,0,.2,1) both; }
        .df-float { animation: dfFloat 3.5s ease-in-out infinite; }
        .df-scale-bounce { animation: dfScaleBounce 0.6s cubic-bezier(.5,1.6,.4,1) both; }
        .df-sparkle { animation: dfSparkle 1.6s ease-out both; }
        .df-shimmer { background: linear-gradient(90deg, transparent, rgba(123,85,200,0.25), transparent); background-size: 200% 100%; animation: dfShimmer 1.6s infinite linear; }
        .df-scan-line { animation: dfScanLine 1.8s ease-in-out infinite; }
        .df-border-pulse { animation: dfBorderPulse 2s infinite; }
      `}</style>

      <header className="df-fade-up" style={{ background: C.white, borderBottom: `1px solid ${C.border}`, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 10 }}>
        <button onClick={() => navigate(-1)} style={{ width: 36, height: 36, borderRadius: 999, background: C.lavLight, display: "grid", placeItems: "center" }} aria-label="Back">
          <ArrowLeft size={18} color={C.primary} />
        </button>
        <div style={{ width: 36, height: 36, borderRadius: 999, background: "linear-gradient(135deg, #7B55C8 0%, #E255A8 100%)", display: "grid", placeItems: "center", color: "#fff", fontSize: 16 }}>🐾</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1 }}>DinoFy <span aria-hidden>🦖</span></div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>AI-powered • Step {step === 5 ? 4 : step > 1 ? Math.min(step,3) : 1} of 4</div>
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
              <p style={{ color: C.textMid, fontSize: 14, marginTop: 6 }}>Upload your pet photo and DinoFy will detect your pet's breed/species automatically 🦖</p>
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
              <div style={{ fontSize: 12, fontWeight: 600, color: C.textMid, marginBottom: 8 }}>Works with</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {SUPPORTED.map((s) => (
                  <span key={s} style={{ background: C.white, border: `1px solid ${C.border}`, color: C.textMid, fontSize: 11, fontWeight: 600, padding: "5px 10px", borderRadius: 999 }}>{s}</span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* STEP 2 — AI DETECTION */}
        {step === 2 && petPhoto && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "center", padding: "12px 0" }}>
            <div className="df-border-pulse" style={{ position: "relative", width: 220, height: 220, borderRadius: 24, overflow: "hidden", border: `3px solid ${C.primary}`, background: C.white }}>
              <img src={petPhoto} alt="Your pet" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div className="df-scan-line" style={{ position: "absolute", left: 0, right: 0, height: 4, background: `linear-gradient(90deg, transparent, ${C.primary}, transparent)`, boxShadow: `0 0 12px ${C.primary}` }} />
              <div className="df-shimmer" style={{ position: "absolute", inset: 0, mixBlendMode: "overlay" }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 800, fontSize: 16, color: C.textDark }}>
                <Sparkles size={18} color={C.primary} className="df-spin" /> Analysing your pet DNA…
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, marginTop: 6 }}>Detecting species, breed and personality</p>
            </div>
          </section>
        )}

        {/* STEP 3 — DETECTED */}
        {step === 3 && detection && petPhoto && dino && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <img src={petPhoto} alt="Your pet" style={{ width: 88, height: 88, borderRadius: 16, objectFit: "cover", border: `2px solid ${C.lavDeep}` }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: 0.5 }}>AI Detected</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: C.textDark, marginTop: 2 }}>
                  {detection.confidence < 0.75 ? `Looks like ${detection.breed}` : detection.breed}
                </div>
                <div style={{ fontSize: 12, color: detection.confidence < 0.75 ? C.warn : C.textMid, fontWeight: 600, marginTop: 2 }}>
                  {detection.species} · {Math.round(detection.confidence * 100)}% confidence
                </div>
              </div>
            </div>

            <button onClick={() => fileRef.current?.click()} style={{ alignSelf: "flex-start", fontSize: 12, fontWeight: 700, color: C.primary }}>
              Wrong? Try another photo
            </button>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />

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

            <button
              onClick={generate}
              style={{
                width: "100%", background: C.primary, color: "#fff",
                fontWeight: 800, fontSize: 16, padding: 16, borderRadius: 14,
                boxShadow: "0 6px 18px rgba(123,85,200,0.35)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = C.primaryHover)}
              onMouseLeave={(e) => (e.currentTarget.style.background = C.primary)}
            >
              🦖 Dinofy My Pet!
            </button>
          </section>
        )}

        {/* STEP 4 — GENERATING */}
        {step === 4 && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "24px 0" }}>
            <div style={{ position: "relative", width: 140, height: 140 }}>
              <div className="df-spin" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `6px solid ${C.lavLight}`, borderTopColor: C.primary }} />
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

        {/* STEP 5 — RESULT */}
        {step === 5 && detection && dino && dinoUrl && petPhoto && (
          <section className="df-fade-up" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, position: "relative" }}>
              <div aria-hidden style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
                {[
                  { top: "8%", left: "48%", size: 16, delay: 0.2 },
                  { top: "20%", left: "92%", size: 12, delay: 0.4 },
                  { top: "55%", left: "55%", size: 20, delay: 0.6 },
                  { top: "78%", left: "88%", size: 14, delay: 0.8 },
                ].map((s, i) => (
                  <span key={i} className="df-sparkle" style={{ position: "absolute", top: s.top, left: s.left, fontSize: s.size, animationDelay: `${s.delay}s`, color: C.primary }}>✦</span>
                ))}
              </div>
              <div>
                <img src={petPhoto} alt="Your pet" className="df-reveal-l" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", borderRadius: 20, border: `3px solid ${C.border}`, background: C.white }} />
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 700, color: C.textMid, marginTop: 6 }}>Your Pet</div>
              </div>
              <div>
                <div className="df-scale-bounce" style={{
                  position: "relative", borderRadius: 24, padding: 3,
                  background: "linear-gradient(135deg, #7B55C8 0%, #E255A8 50%, #DDD4F5 100%)",
                  boxShadow: "0 18px 40px -10px rgba(123,85,200,0.45), 0 6px 14px -4px rgba(26,25,48,0.15)",
                }}>
                  <div style={{ borderRadius: 21, overflow: "hidden", background: C.white }}>
                    <img src={dinoUrl} alt={dino.name} className="df-float" style={{ width: "100%", aspectRatio: "1/1", objectFit: "cover", display: "block" }} />
                  </div>
                </div>
                <div style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: C.primary, marginTop: 8, letterSpacing: 0.3 }}>✨ Dino Twin</div>
              </div>
            </div>

            <div className="df-scale-bounce" style={{
              background: `linear-gradient(180deg, ${C.white} 0%, ${C.lavLight} 100%)`,
              borderRadius: 24, padding: 20, border: `1px solid ${C.lavDeep}`,
              boxShadow: "0 10px 30px -12px rgba(123,85,200,0.25)", animationDelay: "0.2s",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div className="df-float" style={{ fontSize: 46, lineHeight: 1, filter: "drop-shadow(0 4px 8px rgba(123,85,200,0.3))" }}>{dino.emoji}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, textTransform: "uppercase", letterSpacing: 0.8 }}>Your Dino Twin</div>
                  <div style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>{dino.name}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: C.textMid, marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>"{dino.description}"</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
                {dino.traits.map((t, i) => (
                  <span key={t} className="df-pop" style={{ animationDelay: `${0.6 + i * 0.15}s`, background: C.white, color: C.primary, fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 999, border: `1px solid ${C.lavDeep}` }}>{t}</span>
                ))}
              </div>
            </div>

            <div style={{ background: C.lavLight, borderRadius: 999, padding: "8px 14px", fontSize: 12, fontWeight: 600, color: C.textMid, textAlign: "center" }}>
              Generated as: <strong style={{ color: C.primary }}>{dino.name}</strong> · {detection.confidence < 0.75 ? "Likely " : ""}{detection.breed} (AI detected)
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={shareInstagram}
                style={{ background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)", color: "#fff", fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, boxShadow: "0 6px 18px rgba(221,42,123,0.35)" }}>
                <Instagram size={18} /> Instagram
              </button>
              <button onClick={shareWhatsApp}
                style={{ background: "#25D366", color: "#fff", fontWeight: 800, fontSize: 14, padding: 14, borderRadius: 14, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, boxShadow: "0 6px 18px rgba(37,211,102,0.35)" }}>
                <MessageCircle size={18} /> WhatsApp
              </button>
            </div>

            <button onClick={downloadDino}
              style={{ background: "transparent", color: C.textMid, fontWeight: 600, fontSize: 13, padding: 10, borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, border: `1px solid ${C.border}` }}>
              <Download size={15} /> Save to Gallery
            </button>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button onClick={generate} style={{ background: C.white, border: `1px solid ${C.lavDeep}`, color: C.primary, fontWeight: 700, padding: 12, borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <RotateCcw size={15} /> Try again
              </button>
              <button onClick={reset} style={{ background: C.white, border: `1px solid ${C.lavDeep}`, color: C.primary, fontWeight: 700, padding: 12, borderRadius: 12, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <Camera size={15} /> New pet
              </button>
            </div>
          </section>
        )}
      </main>

      {/* Guest limit popup */}
      {showGuestLimit && (
        <div onClick={() => setShowGuestLimit(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 3000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="df-fade-up"
            style={{ background: C.white, borderRadius: 24, padding: 24, maxWidth: 360, width: "100%", textAlign: "center", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🦖</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark }}>Login to DinoFy more pets 🦖</h2>
            <p style={{ fontSize: 14, color: C.textMid, marginTop: 8, lineHeight: 1.5 }}>
              You've used your free DinoFy generation. Login to generate up to 5 Dino portraits.
            </p>
            <button onClick={() => navigate("/auth")}
              style={{ width: "100%", background: C.primary, color: "#fff", fontWeight: 800, padding: 13, borderRadius: 999, marginTop: 18, fontSize: 15, boxShadow: "0 6px 18px rgba(123,85,200,0.35)" }}>
              Login / Sign up
            </button>
            <button onClick={() => setShowGuestLimit(false)}
              style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: C.textMuted }}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* Logged-in user limit popup */}
      {showUserLimit && (
        <div onClick={() => setShowUserLimit(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "grid", placeItems: "center", zIndex: 3000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="df-fade-up"
            style={{ background: C.white, borderRadius: 24, padding: 24, maxWidth: 360, width: "100%", textAlign: "center", fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
            <div style={{ fontSize: 44, marginBottom: 8 }}>🦖</div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: C.textDark }}>DinoFy limit reached</h2>
            <p style={{ fontSize: 14, color: C.textMid, marginTop: 8, lineHeight: 1.5 }}>
              You've used your 5 free DinoFy generations. More DinoFy credits are coming soon.
            </p>
            <button onClick={() => setShowUserLimit(false)}
              style={{ width: "100%", background: C.primary, color: "#fff", fontWeight: 800, padding: 13, borderRadius: 999, marginTop: 18, fontSize: 15, boxShadow: "0 6px 18px rgba(123,85,200,0.35)" }}>
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DinofyScreen;
