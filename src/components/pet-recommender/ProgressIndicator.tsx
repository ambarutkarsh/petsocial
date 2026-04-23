interface Props {
  step: 0 | 1 | 2 | 3;
}

const STEPS = ["Intent", "Lifestyle", "Budget", "Results"];

const ProgressIndicator = ({ step }: Props) => (
  <div className="flex items-center justify-between gap-2">
    {STEPS.map((label, i) => {
      const active = i === step;
      const done = i < step;
      return (
        <div key={label} className="flex flex-col items-center flex-1 min-w-0">
          <div
            className={[
              "w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-semibold border transition-colors",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : done
                ? "bg-primary/15 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border",
            ].join(" ")}
          >
            {i + 1}
          </div>
          <span
            className={[
              "mt-1 text-[10px] font-body truncate",
              active ? "text-foreground font-semibold" : "text-muted-foreground",
            ].join(" ")}
          >
            {label}
          </span>
        </div>
      );
    })}
  </div>
);

export default ProgressIndicator;
