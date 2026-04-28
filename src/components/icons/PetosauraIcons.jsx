// Petosauras Custom Icon Library
// Flat, materialistic SVG icons — Navy #7B5EA7 + Gold #FF8C66
// Usage: import { PIcon } from './PetosauraIcons'
// All icons accept: size (default 24), color, className, style props

const defaultNavy = "#7B5EA7";
const defaultGold = "#FF8C66";

// ─── BASE WRAPPER ────────────────────────────────────────────────
const Svg = ({ size = 24, className, style, children, viewBox = "0 0 24 24" }) => (
  <svg
    width={size} height={size}
    viewBox={viewBox}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={style}
  >
    {children}
  </svg>
);

// ─── NAVIGATION ICONS ───────────────────────────────────────────
export const FeedsIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="3" y="4" width="18" height="3" rx="1.5" fill={color} />
    <rect x="3" y="10.5" width="13" height="3" rx="1.5" fill={color} />
    <rect x="3" y="17" width="9" height="3" rx="1.5" fill={color} />
    <circle cx="20" cy="18.5" r="3" fill={defaultGold} />
  </Svg>
);

export const HubIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 3L4 8v8l8 5 8-5V8L12 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 3v13M4 8l8 5 8-5" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </Svg>
);

export const MyPetIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <ellipse cx="9" cy="6.5" rx="2.5" ry="3" stroke={color} strokeWidth="1.5" />
    <ellipse cx="15" cy="6.5" rx="2.5" ry="3" stroke={color} strokeWidth="1.5" />
    <ellipse cx="12" cy="13" rx="5" ry="5.5" stroke={color} strokeWidth="1.5" />
    <circle cx="10" cy="12.5" r="1" fill={color} />
    <circle cx="14" cy="12.5" r="1" fill={color} />
    <path d="M10.5 15.5q1.5 1 3 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="4.5" cy="10.5" r="2" stroke={color} strokeWidth="1.5" />
    <circle cx="19.5" cy="10.5" r="2" stroke={color} strokeWidth="1.5" />
  </Svg>
);

export const ShopIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M6 2L3 7h18l-3-5H6z" fill={defaultGold} opacity="0.3" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="3" y="7" width="18" height="14" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M9 7v2a3 3 0 006 0V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="9" cy="13" r="1.5" fill={defaultGold} />
    <path d="M12 13h3M12 16.5h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

export const PlusIcon = ({ size = 24, color = "#FFFFFF", ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

// ─── HUB SERVICE ICONS ──────────────────────────────────────────
export const SOSIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="12" r="9" stroke="#C4897A" strokeWidth="1.5" />
    <path d="M12 7v6" stroke="#C4897A" strokeWidth="2" strokeLinecap="round" />
    <circle cx="12" cy="16.5" r="1.2" fill="#C4897A" />
    <path d="M8.5 5.5a5 5 0 017 0" stroke="#C4897A" strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const VetIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="10" r="7" stroke={color} strokeWidth="1.5" />
    <path d="M10 10h4M12 8v4" stroke={defaultGold} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M8 17l-3 4h14l-3-4" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
  </Svg>
);

export const PetCareIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 21C12 21 4 15.5 4 9a5 5 0 0110 0 5 5 0 0110 0c0 6.5-8 12-8 12h-4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 9h2v2H9V9zM13 9h2v2h-2V9zM11 13h2" stroke={defaultGold} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BudgetIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M3 9h18" stroke={color} strokeWidth="1.5" />
    <path d="M12 6.5v-3M12 20v-2" stroke={defaultGold} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9.5 14.5c0 1.1.9 2 2.5 2s2.5-.9 2.5-2-.9-1.5-2.5-2-2.5-.9-2.5-2 .9-2 2.5-2 2.5.9 2.5 2" stroke={defaultGold} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

export const InsuranceIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 3L4 7v5c0 5 4 8.5 8 10 4-1.5 8-5 8-10V7L12 3z" fill={defaultGold} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const MicrochipIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="7" y="7" width="10" height="10" rx="1.5" stroke={color} strokeWidth="1.5" />
    <rect x="9.5" y="9.5" width="5" height="5" rx="0.5" fill={defaultGold} opacity="0.5" stroke={defaultGold} strokeWidth="1" />
    <path d="M9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

export const PetRecommenderIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.3L12 17l-6.2 4.2 2.4-7.3L2 9.4h7.6L12 2z" fill={defaultGold} opacity="0.2" stroke={defaultGold} strokeWidth="1.4" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" fill={color} />
  </Svg>
);

export const PetcationIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M5 18l3-9 4 6 3-4 4 7H5z" fill={defaultGold} opacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="19" cy="5" r="3" fill={defaultGold} opacity="0.4" stroke={defaultGold} strokeWidth="1.4" />
    <path d="M19 3v4M17 5h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

export const PetMovingIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="1" y="10" width="14" height="9" rx="1.5" stroke={color} strokeWidth="1.5" />
    <path d="M15 14h4l3 3v2h-7v-5z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="5.5" cy="20.5" r="1.8" fill={color} />
    <circle cx="17.5" cy="20.5" r="1.8" fill={color} />
    <path d="M5 10V7l3-3h6l1 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 7h5" stroke={defaultGold} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

export const NGOIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 21s-8-4.5-8-11a8 8 0 1116 0c0 6.5-8 11-8 11z" fill={defaultGold} opacity="0.15" stroke={color} strokeWidth="1.5" />
    <path d="M9.5 11c0 1.4 1.1 2.5 2.5 2.5s2.5-1.1 2.5-2.5V9.5h-5V11z" fill={color} />
    <path d="M10 9.5V8a2 2 0 014 0v1.5" stroke={color} strokeWidth="1.3" />
  </Svg>
);

export const PickDropIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="2" y="13" width="20" height="6" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M5 13V9l4-4h6l4 4v4" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="6.5" cy="20" r="1.5" fill={color} />
    <circle cx="17.5" cy="20" r="1.5" fill={color} />
    <path d="M9 9h6" stroke={defaultGold} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

export const BookVetIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M3 10h18" stroke={color} strokeWidth="1.5" />
    <path d="M8 3v4M16 3v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 15h2v2H9v-2zM13 15h2v2h-2v-2z" fill={defaultGold} />
    <path d="M9 12h2v2H9v-2z" fill={defaultGold} opacity="0.5" />
    <path d="M13 12h2v2h-2v-2zM7 12h.5" stroke={defaultGold} strokeWidth="1.2" strokeLinecap="round" />
  </Svg>
);

// ─── FEED / POST ICONS ──────────────────────────────────────────
export const HeartIcon = ({ size = 24, color = defaultNavy, filled = false, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 20.5C12 20.5 3 14.5 3 8.5a5 5 0 019-3 5 5 0 019 3c0 6-9 12-9 12z"
      fill={filled ? "#C4897A" : "none"}
      stroke={filled ? "#C4897A" : color}
      strokeWidth="1.5" strokeLinejoin="round" />
  </Svg>
);

export const CommentIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"
      stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 10h8M8 13h5" stroke={defaultGold} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

export const ShareIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 3v12M8.5 6.5L12 3l3.5 3.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SaveIcon = ({ size = 24, color = defaultNavy, filled = false, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"
      fill={filled ? defaultNavy : "none"}
      stroke={filled ? defaultNavy : color}
      strokeWidth="1.5" strokeLinejoin="round" />
    {!filled && <path d="M9 10h6M12 7v6" stroke={defaultGold} strokeWidth="1.3" strokeLinecap="round" />}
  </Svg>
);

// ─── HEALTH / MYPET ICONS ───────────────────────────────────────
export const WeightIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M3 20h18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 20l1.5-8h11L19 20" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
    <path d="M10 8h4M12 6v4" stroke={defaultGold} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

export const FoodBowlIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M4 12h16c0 4.4-3.6 8-8 8s-8-3.6-8-8z" fill={defaultGold} opacity="0.15" stroke={color} strokeWidth="1.5" />
    <path d="M4 12c0-1 8-5 16 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 8V5M12 7V4M16 8V5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    <ellipse cx="12" cy="17" rx="3" ry="2" fill={defaultGold} opacity="0.4" />
  </Svg>
);

export const VaccineIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M18 4l2 2-2 2-8 8-4 1 1-4 8-8-2-2 5 1z" fill={defaultGold} opacity="0.2" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M14 6l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 14l-2 4 4-2" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M10 9l1.5 1.5" stroke={defaultGold} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const DocumentIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 3v6h6" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 13h8M8 16h5M8 10h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

export const GrowthIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M3 20h18M3 20V4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 16l4-5 4 3 4-7" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="6" cy="16" r="1.5" fill={color} />
    <circle cx="10" cy="11" r="1.5" fill={color} />
    <circle cx="14" cy="14" r="1.5" fill={color} />
    <circle cx="18" cy="7" r="1.5" fill={defaultGold} />
  </Svg>
);

export const HealthScoreIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

// ─── NAVIGATION UTILITY ICONS ───────────────────────────────────
export const SearchIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="11" cy="11" r="7" stroke={color} strokeWidth="1.5" />
    <path d="M16.5 16.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 11h6M11 8v6" stroke={defaultGold} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

export const BellIcon = ({ size = 24, color = defaultNavy, count = 0, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M18 13.5V10a6 6 0 00-12 0v3.5L4 16h16l-2-2.5z" fill={defaultGold} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M10 18a2 2 0 004 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    {count > 0 && <>
      <circle cx="18" cy="5" r="4" fill="#C4897A" />
      <text x="18" y="8" textAnchor="middle" fontSize="5" fill="white" fontWeight="bold">{count > 9 ? "9+" : count}</text>
    </>}
  </Svg>
);

export const ProfileIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="1.5" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="8" r="1.5" fill={defaultGold} opacity="0.5" />
  </Svg>
);

export const BackIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M19 12H5M10 7l-5 5 5 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SettingsIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="1.5" />
    <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="12" r="1" fill={defaultGold} />
  </Svg>
);

export const CloseIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
  </Svg>
);

export const CheckIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M20 6L9 17l-5-5" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LocationPinIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 21s-7-6.8-7-12a7 7 0 1114 0c0 5.2-7 12-7 12z" fill={defaultGold} opacity="0.2" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="9" r="2.5" fill={color} />
  </Svg>
);

export const EditIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M16 4l4 4-12 12H4v-4L16 4z" fill={defaultGold} opacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M14 6l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
  </Svg>
);

export const CameraIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5" />
    <path d="M16 7l-2-3H10L8 7" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="12" cy="14" r="3.5" stroke={color} strokeWidth="1.5" />
    <circle cx="12" cy="14" r="1.5" fill={defaultGold} opacity="0.5" />
  </Svg>
);

export const UploadIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M17 8l-5-5-5 5M12 3v12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 10h8" stroke={defaultGold} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

// ─── STORY / MEDIA ICONS ────────────────────────────────────────
export const StoryAddIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" strokeDasharray="3 2" />
    <path d="M12 8v8M8 12h8" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const PlayIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="12" r="9" fill={defaultNavy} opacity="0.08" stroke={color} strokeWidth="1.5" />
    <path d="M10 8.5l7 3.5-7 3.5V8.5z" fill={defaultGold} stroke={defaultGold} strokeWidth="1" strokeLinejoin="round" />
  </Svg>
);

// ─── PET TYPE ICONS ─────────────────────────────────────────────
export const DogIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <ellipse cx="12" cy="13" rx="7" ry="6" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" />
    <ellipse cx="8" cy="8.5" rx="2.5" ry="3" stroke={color} strokeWidth="1.4" />
    <ellipse cx="16" cy="8.5" rx="2.5" ry="3" stroke={color} strokeWidth="1.4" />
    <circle cx="10" cy="13" r="1" fill={color} />
    <circle cx="14" cy="13" r="1" fill={color} />
    <path d="M10 16q2 1.5 4 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M5 18l-1 2M19 18l1 2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

export const CatIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M6 5L4 2l3 3h10l3-3-2 3" stroke={color} strokeWidth="1.4" strokeLinejoin="round" />
    <ellipse cx="12" cy="13" rx="7" ry="6.5" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" />
    <circle cx="9.5" cy="12" r="1" fill={color} />
    <circle cx="14.5" cy="12" r="1" fill={color} />
    <path d="M10.5 15.5q1.5 1 3 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    <path d="M9 13.5l-2.5 1M15 13.5l2.5 1" stroke={color} strokeWidth="1" strokeLinecap="round" />
  </Svg>
);

export const BirdIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M15 8c0-3-2-5-5-5S4 7 4 9c0 4 4 7 8 7s8-3 8-7c0-2-2-4-5-4z" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" />
    <circle cx="8.5" cy="8.5" r="1.2" fill={color} />
    <path d="M6.5 10.5l-2.5 1" stroke={defaultGold} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M12 16v5M10 21h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

export const FishIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M20 12c-3-3-8-4-13-4 0 4 2 8 4 8s4-2 4-2" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M7 12c0-4 2-8 4-8s4 4 4 4-4 0-8 4z" fill={defaultGold} opacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="16" cy="10" r="1" fill={color} />
    <path d="M20 6l-3 6 3 6" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const RabbitIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <ellipse cx="12" cy="14" rx="5" ry="6" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" />
    <ellipse cx="9" cy="6" rx="1.8" ry="4" stroke={color} strokeWidth="1.4" />
    <ellipse cx="15" cy="6" rx="1.8" ry="4" stroke={color} strokeWidth="1.4" />
    <circle cx="10.5" cy="13.5" r="1" fill={color} />
    <circle cx="13.5" cy="13.5" r="1" fill={color} />
    <circle cx="12" cy="15.5" r="1.2" fill={defaultGold} opacity="0.5" />
    <path d="M8 20l1-2M16 20l-1-2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
  </Svg>
);

export const ReptileIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M4 15c0 0 1-4 4-5 2-0.5 3 0 4 0s2-0.5 4 0c3 1 4 5 4 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="12" cy="10" rx="5" ry="3.5" fill={defaultGold} opacity="0.15" stroke={color} strokeWidth="1.5" />
    <circle cx="10" cy="9.5" r="1" fill={color} />
    <circle cx="14" cy="9.5" r="1" fill={color} />
    <path d="M10 13c.5 1 1 2 2 2s1.5-1 2-2" stroke={color} strokeWidth="1.3" strokeLinecap="round" />
    <path d="M12 20v-5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

// ─── MISC UTILITY ICONS ─────────────────────────────────────────
export const StarIcon = ({ size = 24, color = defaultGold, filled = true, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 2l3.1 6.4 7 1-5 4.9 1.2 6.9L12 18l-6.3 3.2 1.2-6.9L2 9.4l7-1L12 2z"
      fill={filled ? defaultGold : "none"}
      stroke={defaultGold}
      strokeWidth="1.4" strokeLinejoin="round" />
  </Svg>
);

export const InfoIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
    <path d="M12 11v5M12 8.5v.5" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const WarningIcon = ({ size = 24, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 3L2 21h20L12 3z" fill="#C4897A" opacity="0.15" stroke="#C4897A" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M12 9v5M12 17v.5" stroke="#C4897A" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const VerifiedIcon = ({ size = 24, ...p }) => (
  <Svg size={size} {...p}>
    <path d="M12 2l3 2.5h4v4l2.5 3-2.5 3v4h-4L12 22l-3-2.5H5v-4L2.5 12 5 9V5h4L12 2z" fill={defaultNavy} opacity="0.12" stroke={defaultNavy} strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M8.5 12l2.5 2.5 4.5-5" stroke={defaultGold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LockIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <rect x="5" y="11" width="14" height="10" rx="2" fill={defaultGold} opacity="0.12" stroke={color} strokeWidth="1.5" />
    <path d="M8 11V7a4 4 0 018 0v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="12" cy="16" r="1.5" fill={defaultGold} />
  </Svg>
);

export const NotFoundIcon = ({ size = 24, color = defaultNavy, ...p }) => (
  <Svg size={size} {...p}>
    <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5" />
    <path d="M21 21l-4.5-4.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <path d="M8 11h6M11 8v6" stroke={defaultGold} strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 7l2-2" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
  </Svg>
);

// ─── VISUAL SHOWCASE COMPONENT ──────────────────────────────────
const iconGroups = [
  {
    label: "Navigation",
    icons: [
      { name: "Feeds", C: FeedsIcon },
      { name: "Hub", C: HubIcon },
      { name: "MyPet", C: MyPetIcon },
      { name: "Shop", C: ShopIcon },
      { name: "Plus (FAB)", C: PlusIcon, bg: "#7B5EA7" },
    ]
  },
  {
    label: "Hub Services",
    icons: [
      { name: "SOS", C: SOSIcon },
      { name: "Vet Near Me", C: VetIcon },
      { name: "Pet Care", C: PetCareIcon },
      { name: "Budget", C: BudgetIcon },
      { name: "Insurance", C: InsuranceIcon },
      { name: "Microchip", C: MicrochipIcon },
      { name: "Recommender", C: PetRecommenderIcon },
      { name: "Petcation", C: PetcationIcon },
      { name: "Pet Moving", C: PetMovingIcon },
      { name: "NGO", C: NGOIcon },
      { name: "Pick & Drop", C: PickDropIcon },
      { name: "Book Vet", C: BookVetIcon },
    ]
  },
  {
    label: "Feed Actions",
    icons: [
      { name: "Heart", C: HeartIcon },
      { name: "Heart Filled", C: (p) => <HeartIcon {...p} filled /> },
      { name: "Comment", C: CommentIcon },
      { name: "Share", C: ShareIcon },
      { name: "Save", C: SaveIcon },
      { name: "Save Filled", C: (p) => <SaveIcon {...p} filled /> },
    ]
  },
  {
    label: "MyPet / Health",
    icons: [
      { name: "Weight", C: WeightIcon },
      { name: "Food Bowl", C: FoodBowlIcon },
      { name: "Vaccine", C: VaccineIcon },
      { name: "Document", C: DocumentIcon },
      { name: "Growth", C: GrowthIcon },
      { name: "Health ECG", C: HealthScoreIcon },
    ]
  },
  {
    label: "Header & UI",
    icons: [
      { name: "Search", C: SearchIcon },
      { name: "Bell", C: BellIcon },
      { name: "Profile", C: ProfileIcon },
      { name: "Back", C: BackIcon },
      { name: "Settings", C: SettingsIcon },
      { name: "Close", C: CloseIcon },
      { name: "Check", C: CheckIcon },
      { name: "Location", C: LocationPinIcon },
      { name: "Edit", C: EditIcon },
      { name: "Camera", C: CameraIcon },
      { name: "Upload", C: UploadIcon },
    ]
  },
  {
    label: "Media & Story",
    icons: [
      { name: "Story Add", C: StoryAddIcon },
      { name: "Play", C: PlayIcon },
    ]
  },
  {
    label: "Pet Types",
    icons: [
      { name: "Dog", C: DogIcon },
      { name: "Cat", C: CatIcon },
      { name: "Bird", C: BirdIcon },
      { name: "Fish", C: FishIcon },
      { name: "Rabbit", C: RabbitIcon },
      { name: "Reptile", C: ReptileIcon },
    ]
  },
  {
    label: "Status & Utility",
    icons: [
      { name: "Star", C: StarIcon },
      { name: "Info", C: InfoIcon },
      { name: "Warning", C: WarningIcon },
      { name: "Verified", C: VerifiedIcon },
      { name: "Lock", C: LockIcon },
      { name: "Not Found", C: NotFoundIcon },
    ]
  }
];

export default function PetosauraIconLibrary() {
  return (
    <div style={{
      background: "#FBF8F4",
      minHeight: "100vh",
      fontFamily: "'Raleway', sans-serif",
      padding: "32px 24px",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Raleway:wght@300;400;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <div style={{ width: 40, height: 2, background: "#FF8C66" }} />
          <span style={{ fontSize: 10, letterSpacing: "0.25em", color: "#9B96B0", textTransform: "uppercase", fontWeight: 600 }}>
            Icon System
          </span>
          <div style={{ width: 40, height: 2, background: "#FF8C66" }} />
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 36, fontWeight: 600,
          color: "#7B5EA7", margin: "0 0 6px"
        }}>
          Petosauras Icon Library
        </h1>
        <p style={{ fontSize: 11, letterSpacing: "0.2em", color: "#9B96B0", textTransform: "uppercase", fontWeight: 300, margin: 0 }}>
          For Every Pet · For Every Moment
        </p>
        {/* Colour swatches */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 20 }}>
          {[
            { c: "#7B5EA7", n: "Navy" },
            { c: "#FF8C66", n: "Gold" },
            { c: "#FBF8F4", n: "Cream", border: true },
            { c: "#F5F1EC", n: "Sand" },
            { c: "#C4897A", n: "Error" },
          ].map(s => (
            <div key={s.c} style={{ textAlign: "center" }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: s.c,
                border: s.border ? "1px solid #F5F1EC" : "none",
                boxShadow: "0 2px 8px rgba(27,42,74,0.12)"
              }} />
              <span style={{ fontSize: 9, color: "#9B96B0", display: "block", marginTop: 4, letterSpacing: "0.05em" }}>{s.n}</span>
              <span style={{ fontSize: 8, color: "#ABA8B8", fontFamily: "monospace" }}>{s.c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Icon Groups */}
      {iconGroups.map(group => (
        <div key={group.label} style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 20, fontWeight: 600,
              color: "#7B5EA7", margin: 0
            }}>
              {group.label}
            </h2>
            <div style={{ flex: 1, height: 1, background: "rgba(27,42,74,0.10)" }} />
          </div>

          <div style={{
            display: "flex", flexWrap: "wrap", gap: 12
          }}>
            {group.icons.map(({ name, C, bg }) => (
              <div key={name} style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 8,
                background: "white",
                borderRadius: 16,
                padding: "16px 12px",
                minWidth: 80,
                border: "1px solid rgba(27,42,74,0.08)",
                boxShadow: "0 2px 8px rgba(27,42,74,0.06)",
                transition: "all 0.2s",
                cursor: "pointer",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-3px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(27,42,74,0.14)";
                  e.currentTarget.style.borderColor = "#FF8C66";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 2px 8px rgba(27,42,74,0.06)";
                  e.currentTarget.style.borderColor = "rgba(27,42,74,0.08)";
                }}
              >
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 12,
                  background: bg || "#FFF0EB",
                  display: "flex", alignItems: "center",
                  justifyContent: "center",
                  border: `1px solid ${bg ? "transparent" : "rgba(201,168,76,0.25)"}`,
                }}>
                  <C size={26} />
                </div>
                <span style={{
                  fontSize: 10, color: "#9B96B0",
                  textAlign: "center", fontWeight: 600,
                  letterSpacing: "0.04em",
                  lineHeight: 1.3,
                  maxWidth: 72,
                  textTransform: "uppercase"
                }}>
                  {name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Usage note */}
      <div style={{
        background: "#7B5EA7", borderRadius: 16,
        padding: "20px 24px", marginTop: 16,
        display: "flex", alignItems: "flex-start", gap: 16
      }}>
        <VerifiedIcon size={28} />
        <div>
          <p style={{ color: "#FF8C66", fontSize: 12, fontWeight: 700, margin: "0 0 4px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Usage in Lovable
          </p>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, margin: 0, lineHeight: 1.6 }}>
            Copy <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, color: "#FF8C66" }}>PetosauraIcons.jsx</code> into{" "}
            <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, color: "#FF8C66" }}>src/components/icons/</code> and import any icon with{" "}
            <code style={{ background: "rgba(255,255,255,0.1)", padding: "1px 6px", borderRadius: 4, color: "#FF8C66" }}>{"import { FeedsIcon } from '../icons/PetosauraIcons'"}</code>
          </p>
        </div>
      </div>
    </div>
  );
}
