import { useEffect, useRef, useState, TouchEvent, useCallback } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, Heart, MessageCircle, Share2, Play, Volume2, VolumeX } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export interface ReelItem {
  id: string;
  media_type: "image" | "video";
  media_url: string;
  thumbnail_url?: string | null;
  caption?: string | null;
  like_count?: number;
  comment_count?: number;
  author_name?: string | null;
  author_avatar?: string | null;
}

interface Props {
  items: ReelItem[];
  initialIndex: number;
  isLiked?: (id: string) => boolean;
  onClose: () => void;
  onLike?: (id: string) => void;
  onComment?: (id: string) => void;
  onShare?: (item: ReelItem) => void;
  /** Image autoadvance duration ms (default 10000) */
  imageDurationMs?: number;
}

const resolveUrl = (path: string) => {
  if (!path) return path;
  if (path.startsWith("http")) return path;
  return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
};

const ReelMedia = ({
  item,
  active,
  muted,
  onAdvance,
  imageDurationMs,
}: {
  item: ReelItem;
  active: boolean;
  muted: boolean;
  onAdvance: () => void;
  imageDurationMs: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [paused, setPaused] = useState(true);
  const url = resolveUrl(item.media_url);
  const poster = item.thumbnail_url ? resolveUrl(item.thumbnail_url) : undefined;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.currentTime = 0;
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
    }
  }, [active]);

  // Image auto-advance
  useEffect(() => {
    if (!active || item.media_type !== "image") return;
    const t = setTimeout(onAdvance, imageDurationMs);
    return () => clearTimeout(t);
  }, [active, imageDurationMs, item.media_type, onAdvance]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPaused(false);
    } else {
      v.pause();
      setPaused(true);
    }
  };

  if (item.media_type === "video") {
    return (
      <div className="relative w-full h-full" onClick={toggle}>
        <video
          ref={videoRef}
          src={url}
          poster={poster}
          muted={muted}
          playsInline
          preload={active ? "auto" : "metadata"}
          className="w-full h-full object-contain bg-black"
          onEnded={onAdvance}
        />
        {paused && active && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-black/55 flex items-center justify-center">
              <Play size={36} className="text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={item.caption || ""}
      className="w-full h-full object-contain bg-black select-none"
      draggable={false}
    />
  );
};

const ReelViewer = ({ items, initialIndex, onClose, onLike, onComment, onShare, isLiked, imageDurationMs = 10000 }: Props) => {
  const [index, setIndex] = useState(initialIndex);
  const [muted, setMuted] = useState(true);
  const [dragY, setDragY] = useState(0);
  const startY = useRef<number | null>(null);

  // Lock scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") setIndex((i) => Math.min(items.length - 1, i + 1));
      if (e.key === "ArrowUp") setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items.length, onClose]);

  const advance = useCallback(() => {
    setIndex((i) => Math.min(items.length - 1, i + 1));
  }, [items.length]);

  const onTouchStart = (e: TouchEvent) => { startY.current = e.touches[0].clientY; };
  const onTouchMove = (e: TouchEvent) => {
    if (startY.current == null) return;
    setDragY(e.touches[0].clientY - startY.current);
  };
  const onTouchEnd = () => {
    const threshold = 70;
    if (dragY < -threshold && index < items.length - 1) setIndex(index + 1);
    else if (dragY > threshold && index > 0) setIndex(index - 1);
    setDragY(0);
    startY.current = null;
  };

  const current = items[index];
  if (!current) return null;

  // Render only prev/current/next
  const visible = [index - 1, index, index + 1].filter((i) => i >= 0 && i < items.length);

  const node = (
    <div className="fixed inset-0 z-[10000] bg-reel text-reel-foreground" role="dialog" aria-modal="true">
      {/* Top bar */}
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 left-4 z-20 w-10 h-10 rounded-full bg-reel-control backdrop-blur flex items-center justify-center"
      >
        <ArrowLeft size={22} />
      </button>
      <button
        onClick={() => setMuted((m) => !m)}
        aria-label={muted ? "Unmute" : "Mute"}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-reel-control backdrop-blur flex items-center justify-center"
      >
        {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
      </button>

      {/* Slides */}
      <div
        className="absolute inset-0 touch-none overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {visible.map((i) => (
          <div
            key={items[i].id}
            className="absolute inset-0 transition-transform duration-300 ease-out"
            style={{ transform: `translateY(calc(${(i - index) * 100}% + ${dragY}px))` }}
          >
            <ReelMedia item={items[i]} active={i === index} muted={muted} onAdvance={advance} imageDurationMs={imageDurationMs} />
          </div>
        ))}
      </div>

      {/* Right action stack */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-5">
        <button
          onClick={() => onLike?.(current.id)}
          className="flex flex-col items-center gap-1"
          aria-label="Like"
        >
          <div className="w-12 h-12 rounded-full bg-reel-control backdrop-blur flex items-center justify-center">
            <Heart
              size={26}
              fill={isLiked?.(current.id) ? "#FF6B6B" : "none"}
              color={isLiked?.(current.id) ? "#FF6B6B" : "#fff"}
            />
          </div>
          <span className="text-xs">{current.like_count || 0}</span>
        </button>
        <button
          onClick={() => onComment?.(current.id)}
          className="flex flex-col items-center gap-1"
          aria-label="Comment"
        >
          <div className="w-12 h-12 rounded-full bg-reel-control backdrop-blur flex items-center justify-center">
            <MessageCircle size={26} />
          </div>
          <span className="text-xs">{current.comment_count || 0}</span>
        </button>
        <button
          onClick={() => onShare?.(current)}
          className="flex flex-col items-center gap-1"
          aria-label="Share"
        >
          <div className="w-12 h-12 rounded-full bg-reel-control backdrop-blur flex items-center justify-center">
            <Share2 size={26} />
          </div>
        </button>
      </div>

      {/* Caption */}
      {(current.caption || current.author_name) && (
        <div className="absolute left-4 right-20 bottom-8 z-10">
          {current.author_name && (
            <p className="font-bold text-sm mb-1">@{current.author_name}</p>
          )}
          {current.caption && <p className="text-sm opacity-90 line-clamp-3">{current.caption}</p>}
        </div>
      )}

      {/* Progress dots */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-1">
        {items.slice(Math.max(0, index - 2), index + 3).map((_, i, arr) => {
          const realIdx = Math.max(0, index - 2) + i;
          return (
            <span
              key={realIdx}
              className={`h-1 rounded-full transition-all ${realIdx === index ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
            />
          );
        })}
      </div>
    </div>
  );

  return createPortal(node, document.body);
};

export default ReelViewer;
