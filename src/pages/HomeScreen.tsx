import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Trees, Users as UsersIcon, Wallet, PawPrint, Plus, Syringe, Scale, BookOpen, Sparkles } from "lucide-react";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";

const FEATURE_CARDS = [
  { key: "services", title: "Pet Services", desc: "Vets, Grooming & more", Icon: Stethoscope, path: "/nearby?tab=services", bg: "bg-primary-light", color: "text-primary" },
  { key: "places", title: "Pet Friendly Places", desc: "Cafés, Parks, Shows", Icon: Trees, path: "/nearby?tab=places", bg: "bg-secondary-light", color: "text-secondary-foreground" },
  { key: "community", title: "Pet Community", desc: "Reels, news & facts", Icon: UsersIcon, path: "/feeds", bg: "bg-accent-light", color: "text-accent" },
  { key: "budget", title: "Pet Budget", desc: "Plan your pet expenses", Icon: Wallet, path: "/hub/budget", bg: "bg-muted", color: "text-foreground" },
];

const HomeScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const isGuest = !user;

  const { data: pets = [] } = useQuery({
    queryKey: ["home-my-pets", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("pets").select("id, name, avatar_emoji, avatar_url").eq("owner_id", user!.id).order("is_primary", { ascending: false }).limit(6);
      return data || [];
    },
  });

  const primaryPet = pets[0];

  const { data: brief } = useQuery({
    queryKey: ["home-brief", primaryPet?.id],
    enabled: !!primaryPet,
    queryFn: async () => {
      const [vaccRes, logRes] = await Promise.all([
        supabase.from("vaccinations").select("vaccine_name, due_date, status").eq("pet_id", primaryPet!.id).order("due_date", { ascending: true }).limit(3),
        supabase.from("health_logs").select("weight_kg, log_date").eq("pet_id", primaryPet!.id).order("log_date", { ascending: false }).limit(1),
      ]);
      const upcomingVacc = (vaccRes.data || []).find((v: any) => v.status !== "completed" && v.due_date);
      const lastLog = (logRes.data || [])[0];
      return { upcomingVacc, lastLog };
    },
  });

  const { data: blogs = [] } = useQuery({
    queryKey: ["home-blogs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("knowledge_articles")
        .select("id, title, summary, emoji, thumbnail_url, read_time_minutes, category")
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const greetingName = profile?.full_name?.split(" ")[0] || "Pet Parent";

  return (
    <MobileLayout>
      <div className="pb-24 px-5 pt-4 space-y-5">
        {/* Greeting */}
        <header>
          <h1 className="font-heading font-bold text-2xl">Hi, {greetingName}! 👋</h1>
          <p className="text-sm text-muted-foreground font-body">What would you like to do today?</p>
        </header>

        {/* 4 feature cards */}
        <section className="grid grid-cols-2 gap-3">
          {FEATURE_CARDS.map(({ key, title, desc, Icon, path, bg, color }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className={`text-left rounded-[22px] p-4 ${bg} border border-border shadow-sm hover:shadow-petosauras-md transition-shadow`}
            >
              <div className={`w-10 h-10 rounded-full bg-card flex items-center justify-center mb-2 ${color}`}>
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <h3 className="font-heading font-bold text-sm">{title}</h3>
              <p className="text-[11px] text-muted-foreground font-body mt-0.5">{desc}</p>
            </button>
          ))}
        </section>

        {/* My Pets / Guest CTAs */}
        {isGuest ? (
          <section className="space-y-3">
            <button
              onClick={() => navigate("/auth?redirect=/mypet")}
              className="w-full text-left rounded-[22px] p-4 bg-card border border-border shadow-sm flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center text-2xl">🐾</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-sm">I own a pet</h3>
                <p className="text-[11px] text-muted-foreground font-body">Login or register to manage your pet profile.</p>
              </div>
            </button>
            <button
              onClick={() => navigate("/mypet/pet-recommender")}
              className="w-full text-left rounded-[22px] p-4 bg-card border border-border shadow-sm flex items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-secondary-light flex items-center justify-center text-2xl">✨</div>
              <div className="flex-1 min-w-0">
                <h3 className="font-heading font-bold text-sm">I am planning to get a pet</h3>
                <p className="text-[11px] text-muted-foreground font-body">Discover the perfect pet with our Pet Recommender.</p>
              </div>
            </button>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading font-bold text-base">My Pets</h2>
              <button onClick={() => navigate("/mypet")} className="text-xs font-body font-bold text-primary">View all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto no-scrollbar">
              {pets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => navigate("/mypet")}
                  className="shrink-0 flex flex-col items-center gap-1 w-16"
                >
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary-light" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-2xl">{p.avatar_emoji || "🐾"}</div>
                  )}
                  <span className="text-[11px] font-body font-bold truncate w-full text-center">{p.name}</span>
                </button>
              ))}
              <button
                onClick={() => navigate("/mypet")}
                className="shrink-0 flex flex-col items-center gap-1 w-16"
              >
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-primary flex items-center justify-center text-primary">
                  <Plus size={20} />
                </div>
                <span className="text-[11px] font-body font-bold text-primary">Add</span>
              </button>
            </div>

            {/* Health Brief */}
            {primaryPet && (
              <div className="mt-3 rounded-[22px] bg-card border border-border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <PawPrint size={16} className="text-primary" />
                  <h3 className="font-heading font-bold text-sm">Health Brief — {primaryPet.name}</h3>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px] font-body">
                  <div className="flex items-start gap-2">
                    <Syringe size={14} className="text-accent mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[10px] uppercase">Next vaccine</p>
                      <p className="font-bold truncate">{brief?.upcomingVacc?.vaccine_name || "—"}</p>
                      {brief?.upcomingVacc?.due_date && (
                        <p className="text-[10px] text-muted-foreground">{new Date(brief.upcomingVacc.due_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Scale size={14} className="text-secondary mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground text-[10px] uppercase">Last weight</p>
                      <p className="font-bold">{brief?.lastLog?.weight_kg ? `${brief.lastLog.weight_kg} kg` : "—"}</p>
                      {brief?.lastLog?.log_date && (
                        <p className="text-[10px] text-muted-foreground">{new Date(brief.lastLog.log_date).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate("/mypet/health")}
                  className="mt-3 w-full h-9 rounded-full bg-primary-light text-primary text-xs font-heading font-bold flex items-center justify-center gap-1"
                >
                  <Sparkles size={12} /> Open Health Log
                </button>
              </div>
            )}
          </section>
        )}

        {/* Near You */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-bold text-base">Near You</h2>
            <button onClick={() => navigate("/nearby")} className="text-xs font-body font-bold text-primary">Explore</button>
          </div>
          <button
            onClick={() => navigate("/nearby")}
            className="w-full rounded-[22px] bg-gradient-to-br from-primary-light to-secondary-light p-4 text-left border border-border"
          >
            <p className="font-heading font-bold text-sm">Discover places & services around you</p>
            <p className="text-[11px] text-muted-foreground font-body mt-1">Vets, cafés, parks, grooming and more.</p>
          </button>
        </section>

        {/* Top Blogs */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-heading font-bold text-base">Top Blogs</h2>
            <button onClick={() => navigate("/learn")} className="text-xs font-body font-bold text-primary">See all</button>
          </div>
          {blogs.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body">No articles yet.</p>
          ) : (
            <div className="space-y-2">
              {blogs.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => navigate("/learn")}
                  className="w-full text-left rounded-[18px] bg-card border border-border p-3 flex items-center gap-3 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-2xl shrink-0">
                    {b.emoji || "🐾"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading font-bold text-sm truncate">{b.title}</h4>
                    <p className="text-[11px] text-muted-foreground font-body line-clamp-1">{b.summary}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 inline-flex items-center gap-1">
                      <BookOpen size={10} /> {b.read_time_minutes || 5} min read
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default HomeScreen;
