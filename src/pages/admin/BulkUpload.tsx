import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, X, Check, Loader2, ImagePlus } from "lucide-react";

const SEED_USERS = [
  { name: "Priya Krishnamurthy", username: "priya_petmom", city: "Chennai", pet: "Bruno (Labrador)" },
  { name: "Arjun Mehta", username: "arjun_fishkeeper", city: "Mumbai", pet: "Nemo (Betta)" },
  { name: "Meera Iyer", username: "meera_birdlady", city: "Bengaluru", pet: "Kiki (African Grey)" },
  { name: "Rahul Sharma", username: "rahul_dogdad", city: "Delhi", pet: "Simba (Golden Retriever)" },
  { name: "Ananya Pillai", username: "ananya_catmom", city: "Kochi", pet: "Luna (Persian)" },
  { name: "Vikram Nair", username: "vikram_reptiles", city: "Hyderabad", pet: "Spike (Bearded Dragon)" },
  { name: "Deepa Venkataraman", username: "deepa_rabbitlove", city: "Coimbatore", pet: "Toffee (Holland Lop)" },
  { name: "Siddharth Gupta", username: "sid_indie_dad", city: "Pune", pet: "Bholu (Indie Dog)" },
  { name: "Kavitha Rajan", username: "kavitha_koi", city: "Chennai", pet: "Raja (Koi)" },
  { name: "Rohan Malhotra", username: "rohan_germshep", city: "Chandigarh", pet: "Major (GSD)" },
  { name: "Nisha Kapoor", username: "nisha_siamese", city: "Jaipur", pet: "Cleo (Siamese)" },
  { name: "Aditya Reddy", username: "adi_macaw", city: "Hyderabad", pet: "Rio (Macaw)" },
  { name: "Sunita Bose", username: "sunita_guinea", city: "Kolkata", pet: "Chhotu (Guinea Pig)" },
  { name: "Kartik Pandey", username: "kartik_pomeranian", city: "Lucknow", pet: "Fluffy (Pomeranian)" },
  { name: "Divya Krishnan", username: "divya_aqua", city: "Bengaluru", pet: "Disco (Discus)" },
  { name: "Manish Agarwal", username: "manish_beagle", city: "Ahmedabad", pet: "Sherlock (Beagle)" },
  { name: "Pooja Nambiar", username: "pooja_tortoise", city: "Thiruvananthapuram", pet: "Kachua (Tortoise)" },
  { name: "Amit Chatterjee", username: "amit_shihtzudad", city: "Kolkata", pet: "Momo (Shih Tzu)" },
  { name: "Lakshmi Subramanian", username: "lakshmi_bengalcat", city: "Chennai", pet: "Tiger (Bengal)" },
  { name: "Rajesh Pillai", username: "rajesh_budgie", city: "Kochi", pet: "Mithu (Budgie)" },
];

const CATEGORIES = [
  { value: "reel", label: "Reel 🎬" },
  { value: "adoption", label: "Adopt 🐾" },
  { value: "walker", label: "Walker 🚶" },
  { value: "pet_club", label: "Pet Club 🐶" },
];

type PhotoStatus = "pending" | "uploading" | "done" | "error";

interface PhotoItem {
  id: string;
  file: File;
  preview: string;
  caption: string;
  category: string;
  location: string;
  hashtags: string;
  username: string;
  userId: string | null;
  status: PhotoStatus;
  selected: boolean;
  errorMsg?: string;
}

const BulkUpload = () => {
  const [userIdMap, setUserIdMap] = useState<Record<string, string>>({});
  const [seedCount, setSeedCount] = useState(0);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("is_seed_user", true);
      if (error) {
        toast.error("Failed to load seed users");
        return;
      }
      const map: Record<string, string> = {};
      (data || []).forEach((p: any) => {
        if (p.username) map[p.username] = p.id;
      });
      setUserIdMap(map);
      setSeedCount((data || []).length);
    })();
  }, []);

  const availableSeedUsers = useMemo(
    () => SEED_USERS.filter((u) => userIdMap[u.username]),
    [userIdMap]
  );

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (availableSeedUsers.length === 0) {
      toast.error("No seed users found in database");
      return;
    }
    const newItems: PhotoItem[] = Array.from(files).map((file) => {
      const rand = availableSeedUsers[Math.floor(Math.random() * availableSeedUsers.length)];
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        caption: "",
        category: "reel",
        location: "",
        hashtags: "",
        username: rand.username,
        userId: userIdMap[rand.username],
        status: "pending",
        selected: true,
      };
    });
    setPhotos((p) => [...p, ...newItems]);
  };

  const updatePhoto = (id: string, patch: Partial<PhotoItem>) => {
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => {
      const ph = prev.find((p) => p.id === id);
      if (ph) URL.revokeObjectURL(ph.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const clearAll = () => {
    photos.forEach((p) => URL.revokeObjectURL(p.preview));
    setPhotos([]);
  };

  const toggleAll = (checked: boolean) => {
    setPhotos((prev) => prev.map((p) => ({ ...p, selected: checked })));
  };

  const selectedCount = photos.filter((p) => p.selected).length;
  const doneCount = photos.filter((p) => p.status === "done").length;
  const errorCount = photos.filter((p) => p.status === "error").length;
  const pendingSelected = photos.filter((p) => p.selected && p.status === "pending");

  const uploadOne = async (photo: PhotoItem) => {
    if (!photo.userId) throw new Error("Missing user ID");
    const ext = (photo.file.name.split(".").pop() || "jpg").toLowerCase();
    const filePath = `${photo.userId}/bulk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("posts")
      .upload(filePath, photo.file, {
        contentType: photo.file.type || "image/jpeg",
        upsert: false,
      });
    if (upErr) {
      console.error("Storage upload error:", JSON.stringify(upErr));
      throw new Error(upErr.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(filePath);

    const postDate = new Date();
    postDate.setDate(postDate.getDate() - Math.floor(Math.random() * 30));
    postDate.setHours(Math.floor(Math.random() * 24));

    const hashArr = photo.hashtags
      .split(/[\s,]+/)
      .map((h) => h.replace(/^#/, "").trim())
      .filter(Boolean)
      .map((h) => "#" + h);

    const { error: insErr } = await supabase.from("posts").insert({
      user_id: photo.userId,
      media_url: publicUrl,
      media_type: "image",
      caption: photo.caption || null,
      hashtags: hashArr,
      location: photo.location || null,
      post_category: photo.category,
      is_seed_post: true,
      ai_validated: true,
      like_count: Math.floor(Math.random() * 280) + 20,
      comment_count: Math.floor(Math.random() * 35) + 3,
      created_at: postDate.toISOString(),
    });
    if (insErr) throw insErr;
  };

  const handleUploadAll = async () => {
    if (pendingSelected.length === 0) {
      toast.error("No photos selected to upload");
      return;
    }
    setIsUploading(true);
    let success = 0;
    for (const photo of pendingSelected) {
      updatePhoto(photo.id, { status: "uploading" });
      try {
        await uploadOne(photo);
        updatePhoto(photo.id, { status: "done" });
        success++;
      } catch (e: any) {
        console.error("Upload failed", e);
        updatePhoto(photo.id, { status: "error", errorMsg: e?.message || "Upload failed" });
      }
    }
    setIsUploading(false);
    if (success > 0) toast.success(`✅ ${success} photos uploaded to Petosauras feed!`);
  };

  const totalDone = doneCount + errorCount;
  const totalToProcess = photos.filter((p) => p.status !== "pending").length;
  const progressPct = photos.length === 0 ? 0 : Math.round((totalDone / photos.length) * 100);

  return (
    <AdminLayout title="Bulk Upload" subtitle="Upload curated photos as seed posts">
      <div className="pb-32">
        {/* Seed users count */}
        <div className="mb-4 text-sm font-body text-muted-foreground">
          <span className="font-semibold text-[#7B5EA7]">{seedCount}</span> seed users found
        </div>

        {/* Upload zone */}
        <Card
          className="p-8 border-2 border-dashed rounded-2xl bg-white text-center cursor-pointer hover:border-[#7B5EA7] transition-colors mb-6"
          style={{ borderColor: "#D5C9EC" }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
        >
          <ImagePlus className="w-10 h-10 mx-auto mb-2 text-[#7B5EA7]" strokeWidth={1.5} />
          <p className="font-heading font-semibold text-foreground">Tap to select photos from your device</p>
          <p className="text-xs font-body text-muted-foreground mt-1">Select multiple photos at once</p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleFiles(e.target.files);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
          />
        </Card>

        {/* Bulk controls */}
        {photos.length > 0 && (
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-body cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedCount === photos.length}
                  onChange={(e) => toggleAll(e.target.checked)}
                  className="w-4 h-4 accent-[#7B5EA7]"
                />
                Select All
              </label>
              <span className="text-sm font-body text-muted-foreground">
                {selectedCount} of {photos.length} selected
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={clearAll} disabled={isUploading}>
              Clear All
            </Button>
          </div>
        )}

        {/* Photo grid */}
        {photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <Card
                key={photo.id}
                className={`p-3 rounded-2xl bg-white relative overflow-hidden ${
                  photo.status === "error" ? "border-2 border-red-400" : ""
                }`}
              >
                <div className="relative rounded-lg overflow-hidden bg-muted aspect-square mb-3">
                  <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                  {photo.status === "uploading" && (
                    <div className="absolute inset-0 bg-[#7B5EA7]/70 flex items-center justify-center animate-pulse">
                      <div className="text-white text-xs font-body flex items-center gap-1.5">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Uploading...
                      </div>
                    </div>
                  )}
                  {photo.status === "done" && (
                    <div className="absolute inset-0 bg-green-500/70 flex items-center justify-center">
                      <Check className="w-10 h-10 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <button
                    onClick={() => removePhoto(photo.id)}
                    disabled={isUploading || photo.status === "uploading"}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute top-1.5 left-1.5">
                    <input
                      type="checkbox"
                      checked={photo.selected}
                      onChange={(e) => updatePhoto(photo.id, { selected: e.target.checked })}
                      disabled={isUploading || photo.status === "done"}
                      className="w-4 h-4 accent-[#7B5EA7]"
                    />
                  </div>
                </div>

                <label className="block text-[11px] font-body text-muted-foreground mb-0.5">Post as</label>
                <select
                  value={photo.username}
                  onChange={(e) => {
                    const username = e.target.value;
                    updatePhoto(photo.id, { username, userId: userIdMap[username] || null });
                  }}
                  disabled={photo.status !== "pending"}
                  className="w-full text-xs px-2 py-1.5 rounded-md border border-input bg-background mb-2 font-body"
                >
                  {availableSeedUsers.map((u) => (
                    <option key={u.username} value={u.username}>
                      @{u.username} · {u.pet}
                    </option>
                  ))}
                </select>

                <label className="block text-[11px] font-body text-muted-foreground mb-0.5">Category</label>
                <select
                  value={photo.category}
                  onChange={(e) => updatePhoto(photo.id, { category: e.target.value })}
                  disabled={photo.status !== "pending"}
                  className="w-full text-xs px-2 py-1.5 rounded-md border border-input bg-background mb-2 font-body"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>

                <Input
                  placeholder="e.g. Anna Nagar, Chennai"
                  value={photo.location}
                  onChange={(e) => updatePhoto(photo.id, { location: e.target.value })}
                  disabled={photo.status !== "pending"}
                  className="text-xs h-8 mb-2"
                />

                <Textarea
                  placeholder="Write a caption..."
                  value={photo.caption}
                  onChange={(e) => updatePhoto(photo.id, { caption: e.target.value })}
                  disabled={photo.status !== "pending"}
                  className="text-xs min-h-[50px] mb-2"
                />

                <Input
                  placeholder="#PetsOfIndia #DogsOfIndia"
                  value={photo.hashtags}
                  onChange={(e) => updatePhoto(photo.id, { hashtags: e.target.value })}
                  disabled={photo.status !== "pending"}
                  className="text-xs h-8"
                />

                {photo.status === "error" && (
                  <p className="text-[11px] text-red-600 font-body mt-2">{photo.errorMsg}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Sticky upload bar */}
      {photos.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:left-[220px] bg-white border-t z-30 px-4 py-3" style={{ borderColor: "#F5F1EC" }}>
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-col">
              <span className="text-sm font-body font-semibold text-foreground">
                {pendingSelected.length} photos ready to upload
              </span>
              <span className="text-xs font-body text-muted-foreground">
                ✅ Done: {doneCount} &nbsp;|&nbsp; ❌ Failed: {errorCount}
              </span>
              {isUploading && (
                <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-[#7B5EA7] transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              )}
            </div>
            <Button
              onClick={handleUploadAll}
              disabled={isUploading || pendingSelected.length === 0}
              className="gap-2"
            >
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Upload All
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BulkUpload;
