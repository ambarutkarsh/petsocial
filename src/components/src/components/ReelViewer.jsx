import { useEffect, useRef, useState } from "react";

export default function ReelViewer({ reels, index, onClose }) {
  const [current, setCurrent] = useState(index);
  const videoRef = useRef(null);
  const touchStartY = useRef(0);

  const reel = reels[current];

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = "auto");
  }, []);

  useEffect(() => {
    if (!reel) return;

    let timer;

    if (reel.type === "image") {
      timer = setTimeout(() => next(), 10000);
    }

    return () => clearTimeout(timer);
  }, [current]);

  const next = () => {
    if (current < reels.length - 1) setCurrent((p) => p + 1);
  };

  const prev = () => {
    if (current > 0) setCurrent((p) => p - 1);
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    const delta = touchStartY.current - e.changedTouches[0].clientY;

    if (delta > 50) next();
    if (delta < -50) prev();
  };

  const toggleVideo = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) videoRef.current.play();
    else videoRef.current.pause();
  };

  return (
    <div
      style={styles.container}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <button style={styles.back} onClick={onClose}>←</button>

      {reel.type === "image" ? (
        <img src={reel.url} style={styles.media} />
      ) : (
        <video
          ref={videoRef}
          src={reel.url}
          style={styles.media}
          autoPlay
          muted
          onClick={toggleVideo}
          onEnded={next}
        />
      )}

      <div style={styles.actions}>
        <button>❤️</button>
        <button>💬</button>
        <button>🔗</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    background: "black",
    zIndex: 9999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  media: {
    maxHeight: "100%",
    maxWidth: "100%",
  },
  back: {
    position: "absolute",
    top: 20,
    left: 20,
    fontSize: 24,
    color: "white",
    background: "transparent",
    border: "none",
  },
  actions: {
    position: "absolute",
    right: 12,
    bottom: 80,
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
};
