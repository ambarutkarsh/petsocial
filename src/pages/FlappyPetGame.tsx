import { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Trophy, Share2, RotateCcw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";

const W = 400;
const H = 600;
const GRAVITY = 0.48;
const FLAP_V = -10.5;
const PIPE_W = 68;
const PIPE_GAP = 168;
const PIPE_SPEED = 3.0;
const PIPE_SPAWN = 125;
const GROUND_H = 72;
const BIRD_X = 88;
const BIRD_HIT_R = 14;

const PETS = [
  { id: "dog",     name: "Puppy",  emoji: "🐶", accent: "#F59E0B" },
  { id: "cat",     name: "Kitty",  emoji: "🐱", accent: "#8B5CF6" },
  { id: "bird",    name: "Birdie", emoji: "🐦", accent: "#06B6D4" },
  { id: "rabbit",  name: "Bunny",  emoji: "🐰", accent: "#EC4899" },
  { id: "hamster", name: "Hammy",  emoji: "🐹", accent: "#F97316" },
  { id: "fish",    name: "Goldie", emoji: "🐠", accent: "#0EA5E9" },
] as const;

type Pet = (typeof PETS)[number];

const LS_KEY = "flappyPetBoard_v2";

interface Entry {
  name: string;
  petId: string;
  petEmoji: string;
  score: number;
  date: string;
}

function readBoard(): Entry[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) ?? "[]"); }
  catch { return []; }
}

function writeEntry(e: Entry) {
  const next = [...readBoard(), e].sort((a, b) => b.score - a.score).slice(0, 20);
  localStorage.setItem(LS_KEY, JSON.stringify(next));
}

function bestFor(petId: string) {
  return readBoard().filter(e => e.petId === petId).reduce((m, e) => Math.max(m, e.score), 0);
}

interface Pipe { x: number; topH: number; passed: boolean; }
interface Cloud { x: number; y: number; r: number; spd: number; }

interface GS {
  y: number; vy: number;
  pipes: Pipe[]; clouds: Cloud[];
  frame: number; score: number;
  alive: boolean; started: boolean;
}

function makeGS(): GS {
  return {
    y: H / 2, vy: 0, pipes: [], frame: 0, score: 0,
    alive: true, started: false,
    clouds: [
      { x: 70,  y: 110, r: 42, spd: 0.35 },
      { x: 230, y: 145, r: 30, spd: 0.25 },
      { x: 350, y: 88,  r: 36, spd: 0.40 },
      { x: 150, y: 58,  r: 25, spd: 0.22 },
    ],
  };
}

function drawCloud(ctx: CanvasRenderingContext2D, c: Cloud) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.arc(c.x + c.r * 0.75, c.y - c.r * 0.28, c.r * 0.72, 0, Math.PI * 2);
  ctx.arc(c.x - c.r * 0.6,  c.y - c.r * 0.18, c.r * 0.60, 0, Math.PI * 2);
  ctx.fill();
}

function drawPipe(ctx: CanvasRenderingContext2D, p: Pipe) {
  const botY = p.topH + PIPE_GAP;
  const botH = H - GROUND_H - botY;
  ctx.fillStyle = "#27AE60";
  ctx.fillRect(p.x, 0, PIPE_W, p.topH);
  ctx.fillRect(p.x, botY, PIPE_W, botH);
  ctx.fillStyle = "#2ECC71";
  ctx.fillRect(p.x - 6, p.topH - 22, PIPE_W + 12, 22);
  ctx.fillRect(p.x - 6, botY, PIPE_W + 12, 22);
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.fillRect(p.x + 8, 0, 12, p.topH - 22);
  ctx.fillRect(p.x + 8, botY + 22, 12, botH - 22);
}

function drawScene(ctx: CanvasRenderingContext2D, gs: GS, pet: Pet) {
  const sky = ctx.createLinearGradient(0, 0, 0, H - GROUND_H);
  sky.addColorStop(0, "#4A90D9");
  sky.addColorStop(1, "#A8D8F0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H - GROUND_H);
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  for (const c of gs.clouds) drawCloud(ctx, c);
  for (const p of gs.pipes) drawPipe(ctx, p);
  ctx.fillStyle = "#4CAF50";
  ctx.fillRect(0, H - GROUND_H, W, 18);
  ctx.fillStyle = "#795548";
  ctx.fillRect(0, H - GROUND_H + 18, W, GROUND_H - 18);
  ctx.fillStyle = "#43A047";
  for (let gx = 0; gx < W; gx += 20) ctx.fillRect(gx + 4, H - GROUND_H, 8, 8);
  ctx.save();
  ctx.translate(BIRD_X, gs.y);
  const tilt = gs.started ? Math.max(-28, Math.min(42, gs.vy * 3.2)) : 0;
  ctx.rotate((tilt * Math.PI) / 180);
  ctx.font = "36px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(pet.emoji, 0, 0);
  ctx.restore();
  if (gs.started && gs.alive) {
    ctx.font = "bold 42px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(0,0,0,0.35)";
    ctx.strokeText(String(gs.score), W / 2, 52);
    ctx.fillStyle = "white";
    ctx.fillText(String(gs.score), W / 2, 52);
  }
}

type Phase = "select" | "game" | "gameover" | "board";

export default function FlappyPetGame() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef     = useRef<GS>(makeGS());
  const petRef    = useRef<Pet>(PETS[0]);
  const rafRef    = useRef<number>(0);
  const loopRef   = useRef<() => void>(() => {});

  const [phase,       setPhase]       = useState<Phase>("select");
  const [selectedPet, setSelectedPet] = useState<Pet>(PETS[0]);
  const [score,       setScore]       = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [board,       setBoard]       = useState<Entry[]>([]);
  const [playerName,  setPlayerName]  = useState("Player");
  const [submitted,   setSubmitted]   = useState(false);

  useEffect(() => {
    if (profile?.full_name) setPlayerName(profile.full_name);
    else if (user?.email)   setPlayerName(user.email.split("@")[0]);
  }, [profile, user]);

  useEffect(() => { petRef.current = selectedPet; }, [selectedPet]);

  useEffect(() => {
    loopRef.current = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const gs  = gsRef.current;
      const pet = petRef.current;
      for (const c of gs.clouds) {
        c.x -= c.spd;
        if (c.x + c.r * 2 < 0) { c.x = W + c.r * 2; c.y = 45 + Math.random() * 200; }
      }
      gs.frame++;
      if (!gs.started) {
        gs.y = H / 2 + Math.sin(gs.frame * 0.06) * 13;
        drawScene(ctx, gs, pet);
        rafRef.current = requestAnimationFrame(loopRef.current);
        return;
      }
      gs.vy += GRAVITY;
      gs.y  += gs.vy;
      if ((gs.frame - 1) % PIPE_SPAWN === 0) {
        const minTop = 80;
        const maxTop = H - GROUND_H - PIPE_GAP - 80;
        gs.pipes.push({ x: W + 10, topH: minTop + Math.random() * (maxTop - minTop), passed: false });
      }
      for (const p of gs.pipes) {
        p.x -= PIPE_SPEED;
        if (!p.passed && p.x + PIPE_W < BIRD_X) {
          p.passed = true;
          gs.score++;
          setScore(gs.score);
        }
      }
      gs.pipes = gs.pipes.filter(p => p.x + PIPE_W > 0);
      let dead = gs.y + BIRD_HIT_R >= H - GROUND_H || gs.y - BIRD_HIT_R <= 0;
      if (!dead) {
        for (const p of gs.pipes) {
          if (BIRD_X + BIRD_HIT_R > p.x && BIRD_X - BIRD_HIT_R < p.x + PIPE_W) {
            if (gs.y - BIRD_HIT_R < p.topH || gs.y + BIRD_HIT_R > p.topH + PIPE_GAP) {
              dead = true; break;
            }
          }
        }
      }
      drawScene(ctx, gs, pet);
      if (dead) {
        gs.alive = false;
        const finalScore = gs.score;
        setTimeout(() => {
          setScore(finalScore);
          setBoard(readBoard());
          setSubmitted(false);
          setPhase("gameover");
        }, 350);
        return;
      }
      rafRef.current = requestAnimationFrame(loopRef.current);
    };
  });

  useEffect(() => {
    if (phase === "game") rafRef.current = requestAnimationFrame(loopRef.current);
    else cancelAnimationFrame(rafRef.current);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  const flap = useCallback(() => {
    const gs = gsRef.current;
    if (!gs.alive) return;
    if (!gs.started) { gs.started = true; setGameStarted(true); }
    gs.vy = FLAP_V;
  }, []);

  useEffect(() => {
    if (phase !== "game") return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp") { e.preventDefault(); flap(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, flap]);

  const startGame = useCallback((pet: Pet) => {
    cancelAnimationFrame(rafRef.current);
    petRef.current  = pet;
    gsRef.current   = makeGS();
    setSelectedPet(pet);
    setScore(0);
    setGameStarted(false);
    setPhase("game");
  }, []);

  const handleSubmit = useCallback(() => {
    const name = playerName.trim() || "Anonymous";
    writeEntry({
      name, score,
      petId:    selectedPet.id,
      petEmoji: selectedPet.emoji,
      date:     new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    });
    setSubmitted(true);
    setBoard(readBoard());
  }, [playerName, score, selectedPet]);

  const handleShare = useCallback(() => {
    const text = `I scored ${score} in Flappy Pet with ${selectedPet.name} ${selectedPet.emoji}! 🐾 Can you beat me? Play on PetSocial!`;
    if (navigator.share) navigator.share({ title: "Flappy Pet Challenge!", text }).catch(() => {});
    else navigator.clipboard?.writeText(text).then(() => alert("Challenge copied! 🐾")).catch(() => {});
  }, [score, selectedPet]);

  const pb = bestFor(selectedPet.id);
  const newBest = score > 0 && score >= pb;

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ background: "linear-gradient(180deg, #0F1729 0%, #1A1F3A 100%)" }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 z-50"
        style={{
          paddingTop: "max(env(safe-area-inset-top, 0px), 12px)",
          minHeight: "calc(56px + env(safe-area-inset-top, 0px))",
          background: "linear-gradient(180deg, #0F1729 0%, #1A1F3A 100%)",
        }}
      >
        <button
          onClick={() => { cancelAnimationFrame(rafRef.current); navigate(-1); }}
          className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-white font-black text-lg flex items-center gap-1">🐾 Flappy Pet</h1>
        <div className="flex items-center gap-2">
          {phase === "game" && gameStarted && (
            <span className="text-white font-bold text-sm">{score}</span>
          )}
          <button
            onClick={() => { cancelAnimationFrame(rafRef.current); setBoard(readBoard()); setPhase("board"); }}
            className="p-2 rounded-full text-yellow-400 hover:bg-yellow-400/10 transition-colors"
            aria-label="Leaderboard"
          >
            <Trophy size={20} />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center justify-start px-4 py-4 gap-4 max-w-md mx-auto w-full">
        {(phase === "game" || phase === "gameover") && (
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            onPointerDown={phase === "game" ? (e) => { e.preventDefault(); flap(); } : undefined}
            className="w-full max-w-[400px] rounded-2xl shadow-2xl touch-none select-none"
            style={{ aspectRatio: `${W}/${H}`, background: "#A8D8F0" }}
          />
        )}

        {phase === "game" && !gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl px-6 py-5 text-center border border-white/15">
              <div className="text-5xl mb-2">{selectedPet.emoji}</div>
              <p className="text-white/70 text-xs mb-1">Playing as</p>
              <p className="text-white font-black text-lg mb-3">{selectedPet.name}</p>
              <p className="text-white font-black text-xl mb-1">TAP TO FLY!</p>
              <p className="text-white/60 text-xs">Space / ↑ on desktop</p>
              {pb > 0 && <p className="text-yellow-400 text-xs mt-2 font-bold">🏆 Best: {pb}</p>}
            </div>
          </div>
        )}

        {phase === "gameover" && (
          <div className="w-full max-w-md bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10">
            <div className="text-center mb-4">
              <div className="text-5xl mb-2">{newBest ? "🎉" : "😢"}</div>
              <h2 className="text-white font-black text-2xl">Game Over!</h2>
              {newBest && <p className="text-yellow-400 text-sm font-bold mt-1">✨ New Personal Best!</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white/8 rounded-xl p-3 text-center">
                <p className="text-white/50 text-xs">Score</p>
                <p className="text-white font-black text-2xl">{score}</p>
              </div>
              <div className="bg-white/8 rounded-xl p-3 text-center">
                <p className="text-white/50 text-xs">Best</p>
                <p className="text-yellow-400 font-black text-2xl">{Math.max(score, pb)}</p>
              </div>
            </div>
            {!submitted ? (
              <div className="mb-3">
                <p className="text-white/70 text-xs mb-2 font-bold">Save to Leaderboard</p>
                <input
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  className="w-full bg-white/8 text-white placeholder-white/30 rounded-xl px-4 py-3 text-sm border border-white/15 focus:outline-none focus:border-purple-400 mb-2 transition-colors"
                />
                <button
                  onClick={handleSubmit}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold transition-colors active:scale-95"
                >
                  Submit Score 🏆
                </button>
              </div>
            ) : (
              <p className="text-green-400 text-sm text-center mb-3 font-bold">✓ Score saved to leaderboard!</p>
            )}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => startGame(selectedPet)}
                className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <RotateCcw size={16} /> Retry
              </button>
              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <Share2 size={16} /> Challenge
              </button>
              <button
                onClick={() => { setBoard(readBoard()); setPhase("board"); }}
                className="flex-1 py-3 rounded-xl bg-yellow-600/70 hover:bg-yellow-600 text-white font-bold flex items-center justify-center gap-1.5 transition-colors active:scale-95"
              >
                <Trophy size={16} /> Board
              </button>
            </div>
            <button
              onClick={() => setPhase("select")}
              className="w-full py-2 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              Change Pet
            </button>
          </div>
        )}

        {phase === "select" && (
          <div className="w-full">
            <h2 className="text-white font-black text-2xl text-center mb-1">Choose Your Pet</h2>
            <p className="text-white/60 text-sm text-center mb-5">Pick a character to play as</p>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {PETS.map(pet => (
                <button
                  key={pet.id}
                  onClick={() => startGame(pet)}
                  className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/8 hover:bg-white/14 active:scale-95 transition-all border border-white/8 hover:border-white/25"
                >
                  <span className="text-4xl">{pet.emoji}</span>
                  <span className="text-white font-bold text-sm">{pet.name}</span>
                  {bestFor(pet.id) > 0 ? (
                    <span className="text-yellow-400 text-[10px] font-bold">🏆 {bestFor(pet.id)}</span>
                  ) : (
                    <span className="text-white/40 text-[10px]">No plays</span>
                  )}
                </button>
              ))}
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-4">
              <p className="text-white font-bold text-sm mb-2">How to play</p>
              <ul className="space-y-1.5 text-white/70 text-xs">
                <li>📱 Tap the screen to make your pet fly</li>
                <li>⌨️ Space or ↑ key on desktop</li>
                <li>🚧 Avoid the green pipes</li>
                <li>🏆 Beat the community leaderboard!</li>
              </ul>
            </div>
            <button
              onClick={() => { setBoard(readBoard()); setPhase("board"); }}
              className="w-full py-3 rounded-2xl bg-yellow-500/15 border border-yellow-500/30 text-yellow-300 font-bold flex items-center justify-center gap-2 hover:bg-yellow-500/25 transition-colors"
            >
              <Trophy size={18} /> Community Leaderboard
            </button>
          </div>
        )}

        {phase === "board" && (
          <div className="w-full">
            <h2 className="text-white font-black text-2xl text-center mb-1">🏆 Leaderboard</h2>
            <p className="text-white/60 text-sm text-center mb-4">Top 20 scores from this device</p>
            {board.length === 0 ? (
              <div className="bg-white/5 rounded-2xl p-8 text-center border border-white/10">
                <div className="text-5xl mb-3">🎮</div>
                <p className="text-white/60 text-sm">No scores yet. Be the first to play!</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {board.map((e, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5 border border-white/10"
                  >
                    <span className="text-lg font-black w-7 text-center">
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                    </span>
                    <span className="text-2xl">{e.petEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold text-sm truncate">{e.name}</p>
                      <p className="text-white/40 text-[11px]">{e.date}</p>
                    </div>
                    <span className="text-yellow-400 font-black text-base">{e.score}</span>
                  </div>
                ))}
              </div>
            )}
            {board.length > 0 && (
              <button
                onClick={() => {
                  const top = board[0];
                  const text = `🐾 Flappy Pet Leaderboard!\nTop: ${top.name} ${top.petEmoji} – ${top.score} pts\nCan you beat it? Play on PetSocial!`;
                  if (navigator.share) navigator.share({ title: "Flappy Pet Challenge", text }).catch(() => {});
                  else navigator.clipboard?.writeText(text).then(() => alert("Copied!")).catch(() => {});
                }}
                className="w-full py-3 rounded-2xl bg-green-600/80 text-white font-bold flex items-center justify-center gap-2 mb-3 hover:bg-green-600 transition-colors active:scale-95"
              >
                <Share2 size={18} /> Share Challenge
              </button>
            )}
            <button
              onClick={() => setPhase("select")}
              className="w-full py-3 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-500 transition-colors active:scale-95"
            >
              Play Now
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
