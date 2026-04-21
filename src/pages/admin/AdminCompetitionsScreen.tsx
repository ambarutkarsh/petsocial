import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Loader2, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MobileLayout from "@/components/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { isAdminEmail } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const AdminCompetitionsScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prize, setPrize] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [status, setStatus] = useState<"draft" | "active" | "ended">("active");
  const [saving, setSaving] = useState(false);

  const { data: comps = [], isLoading } = useQuery({
    queryKey: ["admin-competitions"],
    enabled: isAdminEmail(user?.email),
    queryFn: async () => {
      const { data } = await supabase
        .from("competitions")
        .select("*")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  if (!isAdminEmail(user?.email)) {
    return (
      <MobileLayout>
        <div className="p-8 text-center">
          <p className="text-sm font-body text-muted-foreground">Admin access only.</p>
        </div>
      </MobileLayout>
    );
  }

  const reset = () => {
    setTitle(""); setDescription(""); setPrize(""); setStartDate(""); setEndDate(""); setStatus("active");
    setShowForm(false);
  };

  const save = async () => {
    if (!title.trim()) { toast.error("Title required"); return; }
    setSaving(true);
    const { error } = await supabase.from("competitions").insert({
      title: title.trim(),
      description: description.trim() || null,
      prize: prize.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      status,
      created_by: user!.id,
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Competition created");
    reset();
    qc.invalidateQueries({ queryKey: ["admin-competitions"] });
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this competition?")) return;
    const { error } = await supabase.from("competitions").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-competitions"] });
  };

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("competitions").update({ status: newStatus }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-competitions"] });
  };

  return (
    <MobileLayout>
      <div className="pb-20 min-h-screen">
        <header className="px-4 pt-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-[12px] bg-card border border-border shadow-petosauras flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
          </button>
          <h1 className="font-heading font-bold text-xl flex-1">🏆 Competitions</h1>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-1" strokeWidth={2} /> New
          </Button>
        </header>

        <div className="px-4 mt-5 space-y-4">
          {showForm && (
            <div className="rounded-[18px] bg-card border border-border p-4 shadow-petosauras space-y-3 animate-fade-in">
              <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
              <Textarea placeholder="Description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
              <Input placeholder="Prize (e.g. ₹5,000 voucher)" value={prize} onChange={(e) => setPrize(e.target.value)} />
              <div className="grid grid-cols-2 gap-2">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full h-10 rounded-[10px] border border-border bg-card px-3 text-sm font-body"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="ended">Ended</option>
              </select>
              <div className="flex gap-2">
                <Button onClick={save} disabled={saving} className="flex-1">
                  {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Create"}
                </Button>
                <Button variant="outline" onClick={reset} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground font-body text-center">Loading…</p>
          ) : comps.length === 0 ? (
            <p className="text-sm text-muted-foreground font-body text-center">No competitions yet.</p>
          ) : (
            comps.map((c: any) => (
              <div key={c.id} className="rounded-[18px] bg-card border border-border p-4 shadow-petosauras">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-heading font-bold text-[15px]">{c.title}</h3>
                    {c.prize && <p className="text-xs text-accent font-body font-semibold mt-0.5">🏆 {c.prize}</p>}
                    {c.description && <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-2">{c.description}</p>}
                    <div className="flex gap-2 mt-2 text-[10px] font-body text-muted-foreground">
                      {c.start_date && <span>From {c.start_date}</span>}
                      {c.end_date && <span>→ {c.end_date}</span>}
                    </div>
                  </div>
                  <button onClick={() => remove(c.id)} className="text-destructive p-1" aria-label="Delete">
                    <Trash2 className="w-4 h-4" strokeWidth={1.8} />
                  </button>
                </div>
                <div className="flex gap-2 mt-3">
                  {(["draft", "active", "ended"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => updateStatus(c.id, s)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                        c.status === s
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default AdminCompetitionsScreen;
