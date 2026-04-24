interface Props {
  step: 1 | 2 | 3;
}

const labels = ["Category", "Pet Details", "Results"];

const PetCareStepper = ({ step }: Props) => (
  <div className="flex items-center justify-between gap-1 px-1" aria-label={`Step ${step} of 3`}>
    {labels.map((label, i) => {
      const idx = i + 1;
      const filled = idx <= step;
      return (
        <div key={label} className="flex-1 flex items-center gap-1">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-heading font-bold border-2 transition-colors ${
                filled ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
              }`}
            >
              {idx}
            </div>
            <span className={`text-[9px] font-body whitespace-nowrap ${filled ? "text-foreground font-semibold" : "text-muted-foreground"}`}>
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <div className={`flex-1 h-[2px] rounded-full mb-4 ${idx < step ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      );
    })}
  </div>
);

export default PetCareStepper;
