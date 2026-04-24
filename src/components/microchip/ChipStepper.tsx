interface Props {
  current: number; // 1-based
  total: number;
  labels: string[];
}

const ChipStepper = ({ current, total, labels }: Props) => {
  const pct = (current / total) * 100;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground font-body">
          Step {current} of {total}
        </p>
        <p className="text-[11px] font-semibold text-primary font-body">{labels[current - 1]}</p>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};

export default ChipStepper;
