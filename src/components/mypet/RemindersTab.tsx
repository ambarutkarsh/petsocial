import { useQuery } from "@tanstack/react-query";
import { differenceInDays, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { fetchHealthRecords, RECORD_TYPE_LABEL } from "@/lib/petDocuments";

interface Props {
  petId: string;
}

const RemindersTab = ({ petId }: Props) => {
  const { user } = useAuth();
  const { data: records = [] } = useQuery({
    queryKey: ["mypet-summary", petId],
    enabled: !!user && !!petId,
    queryFn: () => fetchHealthRecords({ ownerId: user!.id, petId }),
  });

  const upcoming = records
    .filter((r: any) => r.next_due_date)
    .map((r: any) => ({ ...r, _due: new Date(r.next_due_date) }))
    .sort((a: any, b: any) => a._due.getTime() - b._due.getTime());

  if (upcoming.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-surface-alt p-8 text-center">
        <p className="text-3xl mb-2">⏰</p>
        <p className="font-body text-sm text-muted-foreground">No upcoming reminders</p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Add a record with a "next due" date to see it here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {upcoming.map((r: any) => {
        const days = differenceInDays(r._due, new Date());
        const tone =
          days < 0
            ? "bg-destructive/15 text-destructive"
            : days <= 7
            ? "bg-accent/20 text-accent-foreground"
            : "bg-secondary/15 text-secondary";
        return (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-semibold text-muted-foreground">
                {RECORD_TYPE_LABEL[r.record_type as keyof typeof RECORD_TYPE_LABEL] || r.record_type}
              </p>
              <p className="font-body font-semibold text-sm truncate">{r.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Due {format(r._due, "dd MMM yyyy")}
              </p>
            </div>
            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${tone} whitespace-nowrap`}>
              {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `in ${days}d`}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default RemindersTab;
