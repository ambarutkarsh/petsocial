import { useEffect, useMemo, useState } from "react";
import { Lightbulb } from "lucide-react";
import { getDailyQuickTips } from "@/lib/quickTips";

const QuickTipOfTheDay = () => {
  const tips = useMemo(() => getDailyQuickTips(3), []);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (tips.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % tips.length), 4000);
    return () => clearInterval(t);
  }, [tips.length]);

  if (!tips.length) return null;

  return (
    <section aria-label="Quick Tip of the Day">
      <div className="rounded-lg bg-primary-light border border-border px-3 py-2.5 flex items-center gap-2.5 overflow-hidden">
        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
          <Lightbulb size={15} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-heading font-bold uppercase tracking-wide text-primary leading-none mb-0.5">
            Quick Tip
          </div>
          <p
            key={tips[idx].id}
            className="text-[12px] font-body text-foreground truncate animate-in fade-in duration-500"
            title={tips[idx].tip}
          >
            {tips[idx].tip}
          </p>
        </div>
        <div className="flex gap-1 shrink-0">
          {tips.map((_, i) => (
            <span
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === idx ? "bg-primary" : "bg-primary/30"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default QuickTipOfTheDay;
