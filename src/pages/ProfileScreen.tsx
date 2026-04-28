import type { FeedPillKey } from "@/lib/feedPills";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import PageWrapper from "@/components/PageWrapper";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";
import AddPetSheet from "@/components/AddPetSheet";
import EditAddressSheet from "@/components/EditAddressSheet";
import FeedPreferencesSheet from "@/components/FeedPreferencesSheet";
import { useQuery, ChevronRight, Grid3X3, LogOut, Trash2, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";
import { getCoinBalance } from "@/lib/coins";
import { Coins, useState } from "react";
import { Pencil } from "lucide-react";
import { BookVetIcon, CameraIcon, CheckIcon, CloseIcon, LocationPinIcon, PlusIcon, SaveIcon, SettingsIcon, StarIcon } from "@/components/icons/PetosauraIcons";

const defaultTabOptions = [
  { value: "interesting_facts", label: "⭐ Interesting Facts" },
  { value: "trending", label: "🔥 Trending" },
  { value: "urgent", label: "🚨 Urgent" },
  { value: "my_posts", label: "💬 My Posts" },
  { value: "walker", label: "🚶 Walker" },
  { value: "groomer", label: "✂️ Groomer" },
  { value: "vet", label: "🩺 Vet" },
];

const defaultTabLabels: Record<string, string> = Object.fromEntries(defaultTabOptions.map(o => [o.value, o.label]));

const ProfileScreen = () => {
  const { user } = useAuth();
  const { refreshProfile } = useUserProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showUpload, setShowUpload] = useState(false);
  const [showAddPet, setShowAddPet] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState("");
  const [activeTab, setActiveTab] = useState<"posts" | "saved">("posts");
  const [mediaFilter, setMediaFilter] = useState<"all" | "image" | "video">("all");
  const [showDefaultTabPref, setShowDefaultTabPref] = useState(false);
  const [selectedDefaultTab, setSelectedDefaultTab] = useState("");
  const [showFeedPrefs, setShowFeedPrefs] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: allPets = [] } = useQuery({
    queryKey: ["all-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("*").eq("owner_id", user!.id);
      return data || [];
    },
  });

  const { data: userPosts = [] } = useQuery({
    queryKey: ["user-posts", user?.id, mediaFilter],
    enabled: !!user,
    queryFn: async () => {
      let query = supabase.from("posts").select("id, media_url, media_type").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (mediaFilter !== "all") query = query.eq("media_type", mediaFilter);
      const { data } = await query;
      return data || [];
    },
  });

  const { data: savedPosts = [] } = useQuery({
    queryKey: ["saved-posts-profile", user?.id],
    enabled: !!user && activeTab === "saved",
    queryFn: async () => {
      const { data } = await supabase
        .from("saved_posts")
        .select("post_id, posts!saved_posts_post_id_fkey(id, media_url, media_type)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return (data || []).map((s: any) => s.posts).filter(Boolean);
    },
  });

  const { data: coinBalance = 0 } = useQuery({
    queryKey: ["coins", user?.id],
    enabled: !!user,
    queryFn: () => getCoinBalance(user!.id),
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("achievements").select("badge_key").eq("user_id", user!.id);
      return (data || []).map((a) => a.badge_key);
    },
  });

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getMediaUrl = (path: string) => {
    if (path.startsWith("http")) return path;
    return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  };

  const handleSignOut = async () => {
    try {
      // Clear local caches first so a new session never inherits prior state.
      try {
        localStorage.removeItem("feed_prefs");
        localStorage.removeItem("user_profile");
        localStorage.removeItem("communityDefaultTab");
        localStorage.removeItem("communityDefaultTabSet");
        localStorage.removeItem("onboardingComplete");
        localStorage.removeItem("gplaces_calls_" + new Date().toDateString());
      } catch {}

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        // Force-clear local session even if remote revoke failed.
        await supabase.auth.signOut({ scope: "local" });
      }
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      // Nuclear redirect — guarantees a fresh app state.
      window.location.href = "/";
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    const path = `${user.id}/avatar.jpg`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (uploadError) { toast.error("Upload failed"); return; }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: data.publicUrl + "?t=" + Date.now() }).eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    await refreshProfile();
    toast.success("Profile photo updated! 🦕");
  };

  const handleSaveName = async () => {
    if (!user || newName.trim().length < 2) { toast.error("Name must be at least 2 characters"); return; }
    if (newName.trim().length > 40) { toast.error("Name must be under 40 characters"); return; }
    await supabase.from("profiles").update({ full_name: newName.trim() }).eq("id", user.id);
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    await refreshProfile();
    setEditingName(false);
    toast.success("Name updated!");
  };

  const locationText = [profile?.city, profile?.state].filter(Boolean).join(", ");
  const primaryPet = allPets.find((p: any) => p.is_primary) || allPets[0];

  return (
    <MobileLayout>
      <PageWrapper noPadding>
        <div style={{ paddingBottom: 20 }}>
        <div className="h-[155px] relative" style={{ background: "linear-gradient(135deg, #1B2A4A 0%, #243660 50%, #C9A84C 100%)" }}>
          {/* LOGO LOCKED — Do not change without explicit user instruction */}
          <img src="/petosauras-icon.png" alt="Petosauras" style={{ height: 28, objectFit: "contain" }} className="absolute top-4 left-1/2 -translate-x-1/2 opacity-80" />
          <button className="absolute top-4 right-4 bg-card/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading font-bold flex items-center gap-1">
            <Pencil className="w-3.5 h-3.5" strokeWidth={1.8} /> Edit Profile
          </button>
          <button onClick={handleSignOut} className="absolute top-4 left-4 bg-card/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-heading font-bold flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" strokeWidth={1.8} /> Sign Out
          </button>
        </div>

        <div className="px-4 -mt-10 relative z-10">
          <div className="relative w-20 h-20">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-20 h-20 rounded-full border-4 border-card object-cover shadow-petosauras" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-light to-primary border-4 border-card flex items-center justify-center text-2xl font-heading font-extrabold text-primary-foreground shadow-petosauras">
                {getInitials(profile?.full_name)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-petosauras">
              <CameraIcon className="w-3.5 h-3.5 text-primary-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </label>
          </div>

          {/* Display name with edit */}
          <div className="flex items-center gap-2 mt-2">
            {editingName ? (
              <div className="flex items-center gap-1.5">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="text-xl font-heading font-bold bg-transparent border-b-2 border-primary outline-none w-[180px]"
                  maxLength={40}
                  autoFocus
                />
                <button onClick={handleSaveName} className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
                  <CheckIcon className="w-3.5 h-3.5 text-primary-foreground" />
                </button>
                <button onClick={() => setEditingName(false)} className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                  <CloseIcon className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-heading font-bold">{profile?.full_name || "Loading…"}</h2>
                <button onClick={() => { setNewName(profile?.full_name || ""); setEditingName(true); }}>
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-body">
            {locationText && <span className="flex items-center gap-1"><LocationPinIcon className="w-3 h-3" strokeWidth={1.8} /> {locationText}</span>}
            <span className="flex items-center gap-1"><BookVetIcon className="w-3 h-3" strokeWidth={1.8} /> Pet parent since {profile?.pet_parent_since || new Date().getFullYear()}</span>
          </div>
          <button onClick={() => setShowEditAddress(true)} className="text-xs text-primary font-heading font-bold mt-1">
            📍 Edit Address
          </button>
        </div>

        <div className="px-4 mt-4">
          <div className="flex items-center justify-around paw-card p-3">
            <div className="text-center">
              <p className="text-lg font-heading font-extrabold text-primary">{profile?.post_count || 0}</p>
              <p className="text-xs text-muted-foreground font-body">Posts</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-extrabold text-primary">{profile?.follower_count || 0}</p>
              <p className="text-xs text-muted-foreground font-body">Followers</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-extrabold text-primary">{profile?.following_count || 0}</p>
              <p className="text-xs text-muted-foreground font-body">Following</p>
            </div>
          </div>
          {/* Sauras-Coins balance hidden — gamification temporarily disabled */}
        </div>

        {/* Pets */}
        <div className="px-4 mt-4">
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {allPets.map((pet: any) => (
              <div key={pet.id} className="paw-card p-3 flex items-center gap-2 shrink-0 min-w-[140px]">
                <span className="text-2xl">{pet.avatar_emoji || "🐾"}</span>
                <div>
                  <p className="text-sm font-heading font-bold">{pet.name}</p>
                  <p className="text-[11px] text-muted-foreground font-body">{pet.species || pet.pet_type}</p>
                </div>
                {pet.is_primary && (
                  <span className="text-[9px] bg-primary-light text-primary px-1.5 py-0.5 rounded-full font-bold ml-auto">Primary</span>
                )}
              </div>
            ))}
          </div>
          <button onClick={() => setShowAddPet(true)} className="mt-2 px-4 py-2 rounded-full border-2 border-primary text-primary text-sm font-heading font-bold flex items-center gap-1">
            <PlusIcon className="w-4 h-4" /> Add Pet
          </button>
        </div>

        {/* Posts/Saved tabs */}
        <div className="px-4 mt-4">
          <div className="flex border-b border-border mb-3">
            <button onClick={() => setActiveTab("posts")} className={`flex-1 pb-2 text-sm font-heading font-bold flex items-center justify-center gap-1 transition-colors ${activeTab === "posts" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
              <Grid3X3 className="w-4 h-4" strokeWidth={1.8} /> My Posts
            </button>
            <button onClick={() => setActiveTab("saved")} className={`flex-1 pb-2 text-sm font-heading font-bold flex items-center justify-center gap-1 transition-colors ${activeTab === "saved" ? "text-primary border-b-2 border-primary" : "text-muted-foreground"}`}>
              <SaveIcon className="w-4 h-4" strokeWidth={1.8} /> Saved
            </button>
          </div>

          {activeTab === "posts" && (
            <>
              <div className="flex gap-2 mb-3">
                {(["all", "image", "video"] as const).map((f) => (
                  <button key={f} onClick={() => setMediaFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-body font-bold transition-colors ${
                      mediaFilter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                    {f === "all" ? "All" : f === "image" ? "Photos" : "Videos"}
                  </button>
                ))}
              </div>
              {userPosts.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl">📸</span>
                  <p className="text-sm text-muted-foreground mt-2 font-body">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 rounded-[22px] overflow-hidden">
                  {userPosts.map((post: any) => (
                    <div key={post.id} className="aspect-square relative group">
                      <img src={getMediaUrl(post.media_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this post? This cannot be undone.")) return;
                          await supabase.from("post_comments").delete().eq("post_id", post.id);
                          await supabase.from("post_likes").delete().eq("post_id", post.id);
                          await supabase.from("saved_posts").delete().eq("post_id", post.id);
                          await supabase.from("posts").delete().eq("id", post.id).eq("user_id", user!.id);
                          queryClient.invalidateQueries({ queryKey: ["user-posts"] });
                          queryClient.invalidateQueries({ queryKey: ["feed-posts"] });
                          toast.success("Post deleted 🗑️");
                        }}
                        className="absolute top-1 right-1 w-7 h-7 rounded-full bg-foreground/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === "saved" && (
            <>
              {savedPosts.length === 0 ? (
                <div className="text-center py-10">
                  <span className="text-4xl">🔖</span>
                  <p className="text-sm text-muted-foreground mt-2 font-body">No saved posts yet</p>
                  <p className="text-xs text-muted-foreground mt-1 font-body">Tap the bookmark icon on any post to save it</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-1 rounded-[22px] overflow-hidden">
                  {savedPosts.map((post: any) => (
                    <div key={post.id} className="aspect-square relative">
                      <img src={getMediaUrl(post.media_url)} alt="" className="w-full h-full object-cover" loading="lazy" />
                      <SaveIcon className="absolute top-1 right-1 w-4 h-4 text-primary" filled />
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Preferences Section */}
        <div className="px-4 mt-6 mb-4">
          <h3 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1"><SettingsIcon className="w-3.5 h-3.5" /> Preferences</h3>
          <button onClick={() => { setSelectedDefaultTab(profile?.community_default_tab || "interesting_facts"); setShowDefaultTabPref(true); }}
            className="paw-card p-3 w-full flex items-center justify-between">
            <div>
              <p className="text-sm font-heading font-semibold">Default Community Tab</p>
              <p className="text-xs text-muted-foreground font-body">{defaultTabLabels[profile?.community_default_tab || "interesting_facts"] || "⭐ Interesting Facts"}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Default Tab Preference Sheet */}
        {showDefaultTabPref && (
          <div className="fixed inset-0 z-[1100] flex items-end">
            <div className="absolute inset-0 bg-foreground/40 backdrop-blur-sm" onClick={() => setShowDefaultTabPref(false)} />
            <div className="relative w-full mx-auto bg-card rounded-t-[28px] px-6 pt-4 pb-8 animate-slide-up" style={{ maxWidth: 480 }}>
              <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />
              <h2 className="text-lg font-heading font-bold mb-1">Default Community Tab</h2>
              <p className="text-sm text-muted-foreground font-body mb-4">Choose which tab opens first in Community</p>
              <div className="space-y-2">
                {defaultTabOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setSelectedDefaultTab(opt.value)}
                    className={`w-full flex items-center gap-3 p-3 rounded-[16px] border-2 transition-all ${
                      selectedDefaultTab === opt.value ? "border-primary bg-primary-light" : "border-border"
                    }`}>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${selectedDefaultTab === opt.value ? "border-primary" : "border-muted-foreground"}`}>
                      {selectedDefaultTab === opt.value && <div className="w-3 h-3 rounded-full bg-primary" />}
                    </div>
                    <span className="text-sm font-body font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
              <Button className="w-full mt-4" onClick={async () => {
                localStorage.setItem("communityDefaultTab", selectedDefaultTab);
                localStorage.setItem("communityDefaultTabSet", "true");
                if (user) await supabase.from("profiles").update({ community_default_tab: selectedDefaultTab }).eq("id", user.id);
                queryClient.invalidateQueries({ queryKey: ["profile"] });
                setShowDefaultTabPref(false);
                toast.success("Preference saved!");
              }}>Save Preference</Button>
            </div>
          </div>
        )}
        </div>
      </PageWrapper>

      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
      <AddPetSheet open={showAddPet} onClose={() => setShowAddPet(false)} />
      <EditAddressSheet
        open={showEditAddress}
        onClose={() => setShowEditAddress(false)}
        currentCity={profile?.city}
        currentState={profile?.state}
        currentPin={profile?.pin_code}
      />
      {user && (
        <FeedPreferencesSheet
          open={showFeedPrefs}
          onClose={() => setShowFeedPrefs(false)}
          userId={user.id}
          initial={(profile?.feed_preferences || []) as FeedPillKey[]}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ["profile"] })}
        />
      )}
    </MobileLayout>
  );
};

export default ProfileScreen;
