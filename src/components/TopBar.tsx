import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/petosauras-logo.png";

const TopBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  // Profile (avatar)
  const { data: profile } = useQuery({
    queryKey: ["topbar-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  // Unread notifications count, polled every 60s
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unread-notifications", user?.id],
    enabled: !!user,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      return count || 0;
    },
  });

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: results } = useQuery({
    queryKey: ["search-results", debounced],
    enabled: searchOpen && debounced.length >= 2,
    queryFn: async () => {
      const like = `%${debounced}%`;
      const [usersRes, postsRes, petsRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .or(`full_name.ilike.${like},username.ilike.${like}`)
          .limit(5),
        supabase
          .from("posts")
          .select("id, caption, media_url, user_id")
          .ilike("caption", like)
          .limit(5),
        supabase
          .from("pets")
          .select("id, name, species, avatar_emoji, owner_id")
          .or(`name.ilike.${like},species.ilike.${like}`)
          .limit(5),
      ]);
      return {
        users: usersRes.data || [],
        posts: postsRes.data || [],
        pets: petsRes.data || [],
      };
    },
  });

  const initials = (profile?.full_name || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
    setDebounced("");
  };

  const getMediaUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return supabase.storage.from("posts").getPublicUrl(path).data.publicUrl;
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => navigate("/feeds")}
            aria-label="Petosauras home"
            className="flex items-center"
          >
            <img src={logo} alt="Petosauras" className="h-8 w-auto" />
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Search className="w-5 h-5" strokeWidth={1.8} />
            </button>
            <button
              onClick={() => navigate("/notifications")}
              aria-label="Notifications"
              className="relative w-10 h-10 rounded-full flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5" strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => navigate("/profile")}
              aria-label="Profile"
              className="w-9 h-9 rounded-full bg-primary-light text-primary font-bold text-sm flex items-center justify-center overflow-hidden ml-1"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span>{initials}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="max-w-[430px] mx-auto h-full flex flex-col">
            <div className="h-14 px-4 flex items-center gap-2 border-b border-border bg-card">
              <Search className="w-4 h-4 text-muted-foreground" strokeWidth={1.8} />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pets, users, posts..."
                className="flex-1 bg-transparent outline-none text-[15px] font-body"
              />
              <button
                onClick={closeSearch}
                aria-label="Close search"
                className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted"
              >
                <X className="w-5 h-5" strokeWidth={1.8} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {debounced.length < 2 ? (
                <p className="text-sm text-muted-foreground font-body text-center mt-10">
                  Type at least 2 characters to search.
                </p>
              ) : (
                <>
                  {/* Users */}
                  <section>
                    <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2">
                      👤 Users
                    </h3>
                    {results?.users.length ? (
                      <div className="space-y-1.5">
                        {results.users.map((u: any) => (
                          <button
                            key={u.id}
                            onClick={() => {
                              closeSearch();
                              navigate(`/profile/${u.id}`);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-[14px] hover:bg-muted text-left"
                          >
                            <div className="w-10 h-10 rounded-full bg-primary-light text-primary font-bold flex items-center justify-center overflow-hidden">
                              {u.avatar_url ? (
                                <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                (u.full_name || "U").slice(0, 1).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-body font-bold truncate">{u.full_name || "User"}</p>
                              {u.username && (
                                <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground font-body">No users found.</p>
                    )}
                  </section>

                  {/* Posts */}
                  <section>
                    <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2">
                      📸 Posts
                    </h3>
                    {results?.posts.length ? (
                      <div className="space-y-1.5">
                        {results.posts.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              closeSearch();
                              navigate(`/post/${p.id}`);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-[14px] hover:bg-muted text-left"
                          >
                            <div className="w-12 h-12 rounded-[10px] bg-muted overflow-hidden shrink-0">
                              {p.media_url && (
                                <img src={getMediaUrl(p.media_url)} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                            <p className="text-sm font-body line-clamp-2">
                              {p.caption || "(no caption)"}
                            </p>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground font-body">No posts found.</p>
                    )}
                  </section>

                  {/* Pets */}
                  <section>
                    <h3 className="text-xs font-heading font-bold text-muted-foreground uppercase tracking-wide mb-2">
                      🐾 Pets
                    </h3>
                    {results?.pets.length ? (
                      <div className="space-y-1.5">
                        {results.pets.map((p: any) => (
                          <button
                            key={p.id}
                            onClick={() => {
                              closeSearch();
                              navigate(`/profile/${p.owner_id}`);
                            }}
                            className="w-full flex items-center gap-3 p-2 rounded-[14px] hover:bg-muted text-left"
                          >
                            <span className="text-2xl">{p.avatar_emoji || "🐾"}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-body font-bold truncate">{p.name}</p>
                              {p.species && (
                                <p className="text-xs text-muted-foreground truncate">{p.species}</p>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground font-body">No pets found.</p>
                    )}
                  </section>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TopBar;
