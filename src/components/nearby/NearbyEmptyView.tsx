import { Plus } from "lucide-react";

interface Props {
  emoji: string;
  title: string;
  subtitle: string;
  emptyTitle: string;
  emptySubtitle: string;
  /** Optional click handler. When provided, the Add button becomes enabled. */
  onAdd?: () => void;
  /** Custom Add CTA label. Defaults to `Add {title}`. */
  addLabel?: string;
}

/**
 * Visual mirror of NearbyListings (header + add button + empty state)
 * used for categories that don't yet have a listings backend (Vets, Pet
 * Restaurants, Walker, Petcation, Pet Moving, Pick & Drop).
 */
const NearbyEmptyView = ({ emoji, title, subtitle, emptyTitle, emptySubtitle, onAdd, addLabel }: Props) => {
  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold text-base">{emoji} {title}</h3>
          <p className="text-xs text-muted-foreground font-body mt-0.5">{subtitle}</p>
        </div>
      </div>

      <button
        onClick={onAdd}
        disabled={!onAdd}
        className={`w-full mb-3 h-11 rounded-full bg-primary-light text-primary text-sm font-heading font-bold flex items-center justify-center gap-2 transition-colors ${
          onAdd ? "hover:bg-primary hover:text-primary-foreground" : "opacity-70 cursor-not-allowed"
        }`}
      >
        <Plus size={16} /> {addLabel || `Add ${title}`}
      </button>

      <div className="text-center py-12">
        <div className="text-5xl mb-2 opacity-60">{emoji}</div>
        <p className="text-sm font-heading font-bold">{emptyTitle}</p>
        <p className="text-xs text-muted-foreground mt-1">{emptySubtitle}</p>
      </div>
    </div>
  );
};

export default NearbyEmptyView;
