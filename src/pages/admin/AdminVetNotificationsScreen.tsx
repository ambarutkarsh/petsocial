import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { RefreshCw, Send } from "lucide-react";

type Row = {
  id: string;
  vet_id: string;
  booking_id: string | null;
  channel: string;
  recipient: string | null;
  subject: string | null;
  status: string;
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  delivered_at: string | null;
  sent_at: string;
};

const STATUS_COLOR: Record<string, string> = {
  sent: "bg-emerald-100 text-emerald-700",
  failed: "bg-amber-100 text-amber-700",
  dead: "bg-red-100 text-red-700",
  queued: "bg-slate-100 text-slate-600",
};

export default function AdminVetNotificationsScreen() {
  const [rows, setRows] = useState<Row[]>([]);
  const [filter, setFilter] = useState<"all" | "failed" | "sent" | "dead">("failed");
  const [busy, setBusy] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    let q = supabase
      .from("vet_notifications")
      .select("*")
      .order("sent_at", { ascending: false })
      .limit(200);
    if (filter !== "all") q = q.eq("status", filter);
    const { data, error } = await q;
    if (error) toast({ title: "Failed to load", description: error.message, variant: "destructive" });
    else setRows((data ?? []) as Row[]);
    setRefreshing(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const retryOne = async (id: string) => {
    setBusy(id);
    const { data, error } = await supabase.functions.invoke("retry-vet-notifications", { body: { id } });
    setBusy(null);
    if (error) {
      toast({ title: "Retry failed", description: error.message, variant: "destructive" });
    } else {
      const r = (data as any)?.results?.[0];
      toast({
        title: r?.ok ? "Delivered" : "Retry attempted",
        description: r?.ok ? "Notification sent." : `Status: ${r?.status ?? "—"}`,
      });
      load();
    }
  };

  const retryDue = async () => {
    setBusy("__bulk__");
    const { data, error } = await supabase.functions.invoke("retry-vet-notifications", { body: { limit: 50 } });
    setBusy(null);
    if (error) toast({ title: "Bulk retry failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Bulk retry complete", description: `Processed ${(data as any)?.processed ?? 0} rows.` });
      load();
    }
  };

  return (
    <AdminLayout
      title="Vet notifications"
      subtitle="Delivery log for WhatsApp + email alerts to vets, with retries."
      headerRight={
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button size="sm" onClick={retryDue} disabled={busy === "__bulk__"}>
            <Send className="w-4 h-4 mr-1.5" /> Retry due failures
          </Button>
        </div>
      }
    >
      <div className="flex gap-2 mb-4">
        {(["failed", "dead", "sent", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-body capitalize ${
              filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border" style={{ borderColor: "#F5F1EC" }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Channel</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Last error</TableHead>
              <TableHead>Next retry</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                  No notifications in this view.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {new Date(r.last_attempt_at ?? r.sent_at).toLocaleString()}
                </TableCell>
                <TableCell className="capitalize text-xs">{r.channel}</TableCell>
                <TableCell className="text-xs max-w-[180px] truncate">{r.recipient ?? "—"}</TableCell>
                <TableCell>
                  <Badge className={`${STATUS_COLOR[r.status] ?? "bg-slate-100 text-slate-700"} border-0`}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs">{r.attempts}/{r.max_attempts}</TableCell>
                <TableCell className="text-xs max-w-[200px] truncate" title={r.last_error ?? ""}>
                  {r.last_error ?? "—"}
                </TableCell>
                <TableCell className="text-xs whitespace-nowrap">
                  {r.next_retry_at ? new Date(r.next_retry_at).toLocaleString() : "—"}
                </TableCell>
                <TableCell className="text-right">
                  {(r.status === "failed" || r.status === "dead") && (
                    <Button size="sm" variant="outline" disabled={busy === r.id} onClick={() => retryOne(r.id)}>
                      {busy === r.id ? "Sending…" : "Retry"}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AdminLayout>
  );
}
