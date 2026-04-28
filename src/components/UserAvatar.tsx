import { CSSProperties, Ref, forwardRef } from "react";

interface UserAvatarProps {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
  fontSize?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

const COLOURS: [string, string][] = [
  ["#EDE5FF", "#7B5EA7"], // purple
  ["#FFF0EB", "#FF8C66"], // peach
  ["#E8FAF9", "#2A9D8F"], // teal
  ["#E8F5EE", "#2A7D4F"], // green
  ["#FFF5E0", "#996600"], // amber
];

const getInitials = (name?: string | null): string => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const UserAvatar = forwardRef<HTMLImageElement | HTMLDivElement, UserAvatarProps>(({
  name,
  avatarUrl,
  size = 40,
  fontSize,
  className,
  style,
  onClick,
}, ref) => {
  const idx = name ? name.charCodeAt(0) % COLOURS.length : 0;
  const [bg, text] = COLOURS[idx];

  if (avatarUrl) {
    return (
      <img
        ref={ref as Ref<HTMLImageElement>}
        src={avatarUrl}
        alt={name || "User"}
        onClick={onClick}
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          objectFit: "cover",
          flexShrink: 0,
          cursor: onClick ? "pointer" : undefined,
          ...style,
        }}
      />
    );
  }

  return (
    <div
      ref={ref as Ref<HTMLDivElement>}
      onClick={onClick}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        border: `1.5px solid ${text}33`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: fontSize || Math.round(size * 0.38),
        color: text,
        letterSpacing: "0.02em",
        userSelect: "none",
        cursor: onClick ? "pointer" : undefined,
        ...style,
      }}
    >
      {getInitials(name)}
    </div>
  );
});
UserAvatar.displayName = "UserAvatar";

export default UserAvatar;
