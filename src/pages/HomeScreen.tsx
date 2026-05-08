import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PawPrint, MapPin, Users as UsersIcon, Wallet, Plus, Calendar, Stethoscope, Scale, ArrowRight, Bell } from "lucide-react";

import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { supabase } from "@/integrations/supabase/client";

const FEATURE_CARDS = [
  { key: "services", title: "Pet Services", Icon: PawPrint, path: "/nearby?tab=services" },
  { key: "places", title: "Pet-Friendly Places", Icon: MapPin, path: "/nearby?tab=places" },
  { key: "community", title: "Pet Community", Icon: UsersIcon, path: "/feeds" },
  { key: "budget", title: "Pet Budget", Icon: Wallet, path: "/hub/budget" },
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
      const { data } = await supabase
        .from("pets")
        .select("id, name, species, breed, avatar_emoji, avatar_url")
        .eq("owner_id", user!.id)
        .order("is_primary", { ascending: false })
        .limit(6);
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
        supabase.from("health_logs").select("weight_kg, log_date, log_type").eq("pet_id", primaryPet!.id).order("log_date", { ascending: false }).limit(5),
      ]);
      const upcomingVacc = (vaccRes.data || []).find((v: any) => v.status !== "completed" && v.due_date);
      const lastLog = (logRes.data || [])[0];
      const lastCheckup = (logRes.data || []).find((l: any) => l.log_type === "checkup") || lastLog;
      return { upcomingVacc, lastLog, lastCheckup };
    },
  });

  const { data: blogs = [] } = useQuery({
    queryKey: ["home-blogs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("knowledge_articles")
        .select("id, title, summary, emoji, thumbnail_url, read_time_minutes")
        .eq("is_published", true)
        .order("view_count", { ascending: false })
        .limit(3);
      return data || [];
    },
  });

  const { data: nearby = [] } = useQuery({
    queryKey: ["home-nearby"],
    queryFn: async () => {
      const { data } = await supabase
        .from("nearby_listings" as any)
        .select("id, name, category, image_url, rating, review_count")
        .limit(3);
      return (data as any[]) || [];
    },
  });

  const greetingName = profile?.full_name?.split(" ")[0] || "Pet Parent";
  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");

  return (
    <MobileLayout>
      <div className="pb-28 px-5 pt-4 space-y-5 bg-background min-h-screen">
        {/* TopBar */}
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate("/mypet")}
            className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-petosauras"
            aria-label="Profile"
          >
            <PawPrint size={22} />
          </button>
          <button
            onClick={() => navigate("/notifications")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-foreground"
            aria-label="Notifications"
          >
            <Bell size={22} />
          </button>
        </header>

        {/* Greeting */}
        <div>
          <h1 className="font-heading font-bold text-2xl leading-tight">Hi, {greetingName}! 👋</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">What would you like to do today?</p>
        </div>

        {/* 4 feature pill cards */}
        <section className="grid grid-cols-4 gap-2">
          {FEATURE_CARDS.map(({ key, title, Icon, path }) => (
            <button
              key={key}
              onClick={() => navigate(path)}
              className="rounded-2xl bg-primary-light p-3 flex flex-col items-center justify-center gap-2 aspect-[0.95] hover:shadow-petosauras transition-shadow"
            >
              <Icon size={22} className="text-primary" strokeWidth={2} />
              <span className="font-heading font-bold text-[11px] text-primary text-center leading-tight">{title}</span>
            </button>
          ))}
        </section>

        {/* My Pets / Guest CTAs */}
        {isGuest ? (
          <section className="space-y-3">
            <button
              onClick={() => navigate("/auth?redirect=/mypet")}
              className="w-full rounded-[22px] bg-primary-light overflow-hidden border border-border shadow-sm flex items-stretch"
            >
              <div className="flex-1 p-4 text-left">
                <h3 className="font-heading font-bold text-base">I own a pet</h3>
                <p className="text-[11px] text-muted-foreground font-body mt-1 leading-snug">
                  Login or register to manage your pet profile and access your My Pet section.
                </p>
              </div>
              <div className="w-24 bg-primary-light flex items-center justify-center pr-3">
                <div className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <ArrowRight size={18} />
                </div>
              </div>
            </button>
            <button
              onClick={() => navigate("/mypet/pet-recommender")}
              className="w-full rounded-[22px] bg-secondary-light overflow-hidden border border-border shadow-sm flex items-stretch"
            >
              <div className="flex-1 p-4 text-left">
                <h3 className="font-heading font-bold text-base">I am planning to get a pet</h3>
                <p className="text-[11px] text-muted-foreground font-body mt-1 leading-snug">
                  Discover the perfect pet for you with our Pet Recommender.
                </p>
              </div>
              <div className="w-24 flex items-center justify-center pr-3">
                <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center">
                  <ArrowRight size={18} />
                </div>
              </div>
            </button>
          </section>
        ) : (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-heading font-bold text-base">My Pets</h2>
              <button onClick={() => navigate("/mypet")} className="text-xs font-body font-bold text-primary">View all</button>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar">
              {pets.map((p: any) => (
                <button
                  key={p.id}
                  onClick={() => navigate("/mypet")}
                  className="shrink-0 flex flex-col items-center gap-1.5 w-[68px]"
                >
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.name} className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-3xl">{p.avatar_emoji || "🐾"}</div>
                  )}
                  <span className="text-[12px] font-heading font-bold truncate w-full text-center">{p.name}</span>
                  <span className="text-[10px] font-body text-muted-foreground truncate w-full text-center -mt-1">{p.breed || p.species}</span>
                </button>
              ))}
              <button
                onClick={() => navigate("/mypet")}
                className="shrink-0 flex flex-col items-center gap-1.5 w-[68px]"
              >
                <div className="w-16 h-16 rounded-full border-2 border-dashed border-primary flex items-center justify-center text-primary">
                  <Plus size={22} />
                </div>
                <span className="text-[12px] font-heading font-bold text-primary">Add Pet</span>
              </button>
            </div>

            {/* Health Brief */}
            {primaryPet && (
              <button
                onClick={() => navigate("/mypet/health")}
                className="mt-4 w-full rounded-[22px] bg-card border border-border p-4 shadow-sm text-left flex items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-light flex items-center justify-center">
                      <Stethoscope size={14} className="text-primary" />
                    </div>
                    <h3 className="font-heading font-bold text-sm">Health Brief</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[11px] font-body">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar size={11} /> Next Vaccination
                      </div>
                      <p className="font-heading font-bold text-foreground mt-0.5">{fmtDate(brief?.upcomingVacc?.due_date)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Stethoscope size={11} /> Last Checkup
                      </div>
                      <p className="font-heading font-bold text-foreground mt-0.5">{fmtDate(brief?.lastCheckup?.log_date)}</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Scale size={11} /> Weight
                      </div>
                      <p className="font-heading font-bold text-foreground mt-0.5">
                        {brief?.lastLog?.weight_kg ? `${brief.lastLog.weight_kg} kg` : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <ArrowRight size={18} className="text-muted-foreground shrink-0" />
              </button>
            )}
          </section>
        )}

        {/* Near You */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Near You</h2>
            <button onClick={() => navigate("/nearby")} className="text-xs font-body font-bold text-primary">View all</button>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
            {(nearby.length > 0
              ? nearby
              : [
                  { id: "p1", name: "Paws & Purrs Café", category: "Pet-friendly Café", rating: 4.8, review_count: 120, image_url: null },
                  { id: "p2", name: "Happy Paws", category: "Pet Grooming", rating: 4.9, review_count: 86, image_url: null },
                  { id: "p3", name: "Aquatic World", category: "Aquarium Store", rating: 4.7, review_count: 64, image_url: null },
                ]
            ).map((n: any) => (
              <button
                key={n.id}
                onClick={() => navigate("/nearby")}
                className="shrink-0 w-[140px] text-left"
              >
                <div className="w-full aspect-square rounded-2xl bg-primary-light overflow-hidden">
                  {n.image_url ? (
                    <img src={n.image_url} alt={n.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🐾</div>
                  )}
                </div>
                <h4 className="font-heading font-bold text-[13px] mt-2 truncate">{n.name}</h4>
                <p className="text-[11px] text-muted-foreground font-body truncate">{n.category}</p>
                <p className="text-[11px] font-body mt-0.5">
                  <span className="text-accent">★</span> <span className="font-bold">{n.rating ?? "—"}</span>{" "}
                  <span className="text-muted-foreground">({n.review_count ?? 0})</span>
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Top Blogs */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-bold text-base">Top Blogs</h2>
            <button onClick={() => navigate("/learn")} className="text-xs font-body font-bold text-primary">View all</button>
          </div>
          {blogs.length === 0 ? (
            <p className="text-xs text-muted-foreground font-body">No articles yet.</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-1 px-1">
              {blogs.map((b: any) => (
                <button
                  key={b.id}
                  onClick={() => navigate("/learn")}
                  className="shrink-0 w-[150px] text-left rounded-2xl bg-card border border-border overflow-hidden shadow-sm"
                >
                  <div className="w-full aspect-[4/3] bg-primary-light flex items-center justify-center text-4xl">
                    {b.thumbnail_url ? (
                      <img src={b.thumbnail_url} alt={b.title} className="w-full h-full object-cover" />
                    ) : (
                      <span>{b.emoji || "📖"}</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h4 className="font-heading font-bold text-[12px] leading-tight line-clamp-2">{b.title}</h4>
                    <p className="text-[10px] text-muted-foreground font-body mt-1">
                      {b.read_time_minutes || 5} min read
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
