import { useNavigate } from "react-router-dom";
import { BackIcon } from "@/components/icons/PetosauraIcons";

interface BackButtonProps {
  /** Optional fallback path used when there is no history to go back to. */
  fallback?: string;
  /** When true, ALWAYS navigates to `fallback` regardless of history (use for SOS → /feeds). */
  forceFallback?: boolean;
  className?: string;
  ariaLabel?: string;
}

/**
 * Shared back button. Defaults to navigate(-1).
 * Pass `forceFallback` + `fallback` for special cases (SOS → /feeds).
 */
const BackButton = ({
  fallback = "/feeds",
  forceFallback = false,
  className = "",
  ariaLabel = "Back",
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (forceFallback) {
      navigate(fallback, { replace: true });
      return;
    }
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback, { replace: true });
    }
  };

  return (
    <button
      onClick={handleClick}
      aria-label={ariaLabel}
      className={
        className ||
        "w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center hover:bg-muted transition-colors"
      }
    >
      <BackIcon className="w-5 h-5" strokeWidth={1.8} />
    </button>
  );
};

export default BackButton;
