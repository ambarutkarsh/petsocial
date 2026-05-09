import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Trash2, Plus, Upload } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type SourceType = "reels" | "news" | "facts" | "blogs" | "nearby" | "custom";

interface CustomBanner {
  id: string;
  media_url: string;
  media_type: "image" | "video";
  heading?: string;
  content?: string;
  location?: string;
  hashtags?: string[];
  cta_url?: string;
  display_order?: number;
  is_active?: boolean;
}

const newBanner = (): CustomBanner => ({
  id: crypto.randomUUID(),
  media_url: "",
  media_type: "image",
  heading: "",
  content: "",
  location: "",
  hashtags: [],
  cta_url: "",
  display_order: 0,
  is_active: true,
});

const AdminHomeCarouselScreen = () => {
  const { user } = useAuth();
  const [configId, setConfigId] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<SourceType>("reels");
  const [selectedIds, setSelectedIds] = useState<string>("");
  const [customBanners, setCustomBanners] = useState<CustomBanner[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("home_carousel_config" as any)
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (data) {
        const d = data as any;
        setConfigId(d.id);
        setSourceType(d.source_type);
        setSelectedIds((d.selected_item_ids || []).join(", "));
        setCustomBanners(d.custom_banners || []);
        setIsActive(!!d.is_active);
      }
      setLoading(false);
    })();
  }, []);

  const uploadMedia = async (file: File, idx: number) => {
    const ext = file.name.split(".").pop();
    const path = `carousel/${Date.now()}-${idx}.${ext}`;
    const { error } = await supabase.storage.from("posts").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      return null;
    }
    const { data } = supabase.storage.from("posts").getPublicUrl(path);
    return data.publicUrl;
  };

  const handleFile = async (idx: number, file: File) => {
    const isVideo = file.type.startsWith("video/");
    const url = await uploadMedia(file, idx);
    if (!url) return;
    setCustomBanners((arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], media_url: url, media_type: isVideo ? "video" : "image" };
      return next;
    });
  };

  const updateBanner = (idx: number, patch: Partial<CustomBanner>) => {
    setCustomBanners((arr) => {
      const next = [...arr];
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    const ids = selectedIds.split(",").map((s) => s.trim()).filter(Boolean);
    const activeCustoms = customBanners.slice(0, 3);
    const payload: any = {
      source_type: sourceType,
      selected_item_ids: ids,
      custom_banners: activeCustoms,
      is_active: isActive,
      updated_by: user?.id,
    };
    let res;
    if (configId) {
      res = await supabase.from("home_carousel_config" as any).update(payload).eq("id", configId);
    } else {
      payload.created_by = user?.id;
      res = await supabase.from("home_carousel_config" as any).insert(payload);
    }
    if (res.error) {
      toast({ title: "Save failed", description: res.error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Home carousel configuration updated." });
      // reload id if just inserted
      if (!configId) {
        const { data } = await supabase
          .from("home_carousel_config" as any)
          .select("id")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data) setConfigId((data as any).id);
      }
    }
    setSaving(false);
  };

  return (
    <AdminLayout title="Home Carousel" subtitle="Configure the banner shown above the Home greeting.">
      {loading ? (
        <p className="font-body text-muted-foreground">Loading…</p>
      ) : (
        <div className="space-y-6 max-w-3xl">
          <Card className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Label className="font-heading">Active</Label>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>
            <div>
              <Label className="font-heading mb-2 block">Source</Label>
              <Select value={sourceType} onValueChange={(v) => setSourceType(v as SourceType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="reels">Reels</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="facts">Facts</SelectItem>
                  <SelectItem value="blogs">Blogs</SelectItem>
                  <SelectItem value="nearby">Nearby Services</SelectItem>
                  <SelectItem value="custom">Custom Banner</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs font-body text-muted-foreground mt-1">
                If left empty, top 3 items of the selected source are shown by default.
              </p>
            </div>
            {sourceType !== "custom" && (
              <div>
                <Label className="font-heading mb-2 block">Selected item IDs (optional, comma-separated)</Label>
                <Input
                  value={selectedIds}
                  onChange={(e) => setSelectedIds(e.target.value)}
                  placeholder="uuid1, uuid2, uuid3"
                />
              </div>
            )}
          </Card>

          {sourceType === "custom" && (
            <Card className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold">Custom Banners (max 3)</h3>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCustomBanners((arr) => [...arr, newBanner()].slice(0, 3))}
                  disabled={customBanners.length >= 3}
                >
                  <Plus className="w-4 h-4 mr-1" /> Add
                </Button>
              </div>

              {customBanners.length === 0 && (
                <p className="text-sm font-body text-muted-foreground">No custom banners yet.</p>
              )}

              {customBanners.map((b, idx) => (
                <Card key={b.id} className="p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-body font-bold">Banner #{idx + 1}</span>
                    <button
                      onClick={() => setCustomBanners((arr) => arr.filter((_, i) => i !== idx))}
                      className="text-destructive"
                      aria-label="Remove banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <Label className="text-xs">Media (image/video)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={(e) => e.target.files?.[0] && handleFile(idx, e.target.files[0])}
                        className="text-xs"
                      />
                    </div>
                    {b.media_url && (
                      <div className="mt-2 w-full max-h-40 overflow-hidden rounded-lg bg-black/5">
                        {b.media_type === "video" ? (
                          <video src={b.media_url} controls className="w-full max-h-40 object-cover" />
                        ) : (
                          <img src={b.media_url} alt="" className="w-full max-h-40 object-cover" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Heading</Label>
                      <Input value={b.heading || ""} onChange={(e) => updateBanner(idx, { heading: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Location</Label>
                      <Input value={b.location || ""} onChange={(e) => updateBanner(idx, { location: e.target.value })} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Content / caption</Label>
                    <Textarea
                      rows={2}
                      value={b.content || ""}
                      onChange={(e) => updateBanner(idx, { content: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Hashtags (comma-separated)</Label>
                      <Input
                        value={(b.hashtags || []).join(", ")}
                        onChange={(e) =>
                          updateBanner(idx, {
                            hashtags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">CTA URL/route</Label>
                      <Input value={b.cta_url || ""} onChange={(e) => updateBanner(idx, { cta_url: e.target.value })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 items-center">
                    <div>
                      <Label className="text-xs">Display order</Label>
                      <Input
                        type="number"
                        value={b.display_order ?? 0}
                        onChange={(e) => updateBanner(idx, { display_order: Number(e.target.value) })}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-5">
                      <Switch
                        checked={b.is_active !== false}
                        onCheckedChange={(v) => updateBanner(idx, { is_active: v })}
                      />
                      <span className="text-xs font-body">Active</span>
                    </div>
                  </div>
                </Card>
              ))}
            </Card>
          )}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save Configuration"}
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminHomeCarouselScreen;
