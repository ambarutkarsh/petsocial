import { useEffect, useRef, useState } from "react";
import { Play, Volume2, VolumeX } from "lucide-react";

interface Props {
  src: string;
  poster?: string;
  /** Max playback duration in seconds (default 30) */
  maxDuration?: number;
  /** Number of auto loops before requiring tap to play (default 3) */
  autoLoops?: number;
}

/**
 * Instagram/Reels-style feed video player:
 *  - 9:16 aspect ratio
 *  - Muted autoplay when in viewport
 *  - Loops automatically `autoLoops` times, then pauses and shows a big center Play button
 *  - Caps playback at `maxDuration` seconds
 *  - Tap toggles play/pause; small mute toggle in corner
 */
const FeedVideoPlayer = ({ src, poster, maxDuration = 30, autoLoops = 3 }: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const loopCountRef = useRef(0);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(true);
  const [showCenterPlay, setShowCenterPlay] = useState(false);
  const [inView, setInView] = useState(false);

  // Observe viewport to autoplay/pause as the user scrolls.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting && entry.intersectionRatio > 0.5),
      { threshold: [0, 0.5, 1] }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (inView && !showCenterPlay) {
      v.play().catch(() => {/* autoplay blocked */});
    } else {
      v.pause();
    }
  }, [inView, showCenterPlay]);

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= maxDuration) {
      // End of allowed playback — counts as a completed loop, then restart.
      loopCountRef.current += 1;
      if (loopCountRef.current >= autoLoops) {
        v.pause();
        v.currentTime = 0;
        setShowCenterPlay(true);
        setPaused(true);
      } else {
        v.currentTime = 0;
        v.play().catch(() => {});
      }
    }
  };

  const handleEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    loopCountRef.current += 1;
    if (loopCountRef.current >= autoLoops) {
      setShowCenterPlay(true);
      setPaused(true);
    } else {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  const handleTap = () => {
    const v = videoRef.current;
    if (!v) return;
    if (showCenterPlay) {
      // User-initiated replay — reset counter and play again with the same 3-loop budget.
      loopCountRef.current = 0;
      setShowCenterPlay(false);
      v.currentTime = 0;
      v.play().catch(() => {});
      setPaused(false);
      return;
    }
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black" onClick={handleTap}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        playsInline
        preload="metadata"
        // Native controls intentionally OFF — we render a custom center play button.
        className="w-full h-full object-cover"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      />

      {/* Mute toggle */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setMuted((m) => !m); }}
        className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white"
        aria-label={muted ? "Unmute" : "Mute"}
      >
        {muted ? <VolumeX size={16} strokeWidth={1.8} /> : <Volume2 size={16} strokeWidth={1.8} />}
      </button>

      {/* Center play button — shown after auto-loops finish, or when manually paused */}
      {(showCenterPlay || paused) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/55 backdrop-blur-sm flex items-center justify-center">
            <Play size={28} strokeWidth={2} className="text-white ml-1" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedVideoPlayer;
