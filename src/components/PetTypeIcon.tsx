import { CSSProperties } from "react";

type PetType =
  | "Canine"
  | "Feline"
  | "Avian"
  | "Aquatic"
  | "Small Pet"
  | "Reptile"
  | "Insect"
  | "Equine";

const petIcons: Record<PetType, () => JSX.Element> = {
  Canine: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <ellipse cx="12" cy="14" rx="7" ry="6" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="7.5" cy="8.5" rx="2.5" ry="3" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="16.5" cy="8.5" rx="2.5" ry="3" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="14" r="1" fill="currentColor" />
      <circle cx="14" cy="14" r="1" fill="currentColor" />
      <path d="M10 17q2 1.5 4 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M5 19l-1 2M19 19l1 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  ),
  Feline: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <path d="M6 5L4 2l3 3h10l3-3-2 3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="12" cy="14" rx="7" ry="6.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="9.5" cy="13" r="1" fill="currentColor" />
      <circle cx="14.5" cy="13" r="1" fill="currentColor" />
      <path d="M10.5 16.5q1.5 1 3 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M9 14.5l-2.5 1M15 14.5l2.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  ),
  Avian: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <path d="M15 8c0-3-2-5-5-5S4 7 4 9c0 4 4 7 8 7s8-3 8-7c0-2-2-4-5-4z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
      <path d="M6.5 11l-2.5 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 16v5M10 21h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Aquatic: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <path d="M7 12c0-4 2-8 4-8s4 4 4 4-4 0-8 4z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M20 12c-3-3-8-4-13-4 0 4 2 8 4 8s4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="16" cy="10" r="1" fill="currentColor" />
      <path d="M20 6l-3 6 3 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  "Small Pet": () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <ellipse cx="12" cy="14.5" rx="5" ry="6" stroke="currentColor" strokeWidth="1.5" />
      <ellipse cx="9" cy="6.5" rx="1.8" ry="4" stroke="currentColor" strokeWidth="1.4" />
      <ellipse cx="15" cy="6.5" rx="1.8" ry="4" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10.5" cy="14" r="1" fill="currentColor" />
      <circle cx="13.5" cy="14" r="1" fill="currentColor" />
      <circle cx="12" cy="16" r="1.2" fill="currentColor" opacity="0.5" />
    </svg>
  ),
  Reptile: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <ellipse cx="12" cy="10.5" rx="5" ry="3.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="10" cy="10" r="1" fill="currentColor" />
      <circle cx="14" cy="10" r="1" fill="currentColor" />
      <path d="M4 15c0 0 1-4 4-5 2-.5 3 0 4 0s2-.5 4 0c3 1 4 5 4 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 20v-5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  Insect: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <ellipse cx="12" cy="13" rx="3.5" ry="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="7" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 10l-3-2M15.5 10l3-2M8.5 13l-3.5 0M15.5 13l3.5 0M8.5 16l-3 2M15.5 16l3 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  Equine: () => (
    <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
      <path d="M6 20v-6l-2-4 4-4h4l3 3 3-1v3l-2 1v2l2 6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 10c0-2 1-3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 20v-3M14 20v-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

interface PetTypeIconProps {
  petType: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

const PetTypeIcon = ({
  petType,
  size = 24,
  color = "#7B5EA7",
  style,
  className,
}: PetTypeIconProps) => {
  const Icon = petIcons[petType as PetType];
  if (!Icon) return null;
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        color,
        flexShrink: 0,
        ...style,
      }}
    >
      <Icon />
    </span>
  );
};

export default PetTypeIcon;
