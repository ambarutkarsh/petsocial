import { useState, useEffect } from "react";
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

// Category → fallback Unsplash image (cropped square)
const NEARBY_FALLBACK: Record<string, string> = {
  vets: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=400&fit=crop",
  vet: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=400&h=400&fit=crop",
  pet_restaurants: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
  cafe: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=400&fit=crop",
  spa_grooming: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400&h=400&fit=crop",
  grooming: "https://images.unsplash.com/photo-1591946614720-90a587da4a36?w=400&h=400&fit=crop",
  pet_park: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop",
  park: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=400&fit=crop",
  boarding: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=400&fit=crop",
  pet_show: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=400&fit=crop",
  aquarium: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&h=400&fit=crop",
};

const BLOG_FALLBACK: Record<string, string> = {
  dog: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop",
  cat: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop",
  fish: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&h=300&fit=crop",
  aquarium: "https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=400&h=300&fit=crop",
  bird: "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=400&h=300&fit=crop",
  rabbit: "https://images.unsplash.com/photo-1535241749838-299277b6305f?w=400&h=300&fit=crop",
  health: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=400&h=300&fit=crop",
  vet: "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=400&h=300&fit=crop",
  adopt: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop",
  rescue: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop",
  default: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&h=300&fit=crop",
};

const pickFallback = (map: Record<string, string>, ...candidates: (string | undefined | null)[]) => {
  for (const c of candidates) {
    if (!c) continue;
    const key = c.toLowerCase();
    for (const k of Object.keys(map)) {
      if (key.includes(k)) return map[k];
    }
  }
  return map.default || Object.values(map)[0];
};

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
        .select("id, name, species, avatar_emoji, avatar_url")
        .eq("owner_id", user!.id)
        .order("is_primary", { ascending: false })
        .limit(6);
      return data || [];
    },
  });

  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  useEffect(() => {
    if (!selectedPetId && pets[0]) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);
  const primaryPet = pets.find((p: any) => p.id === selectedPetId) || pets[0];

  const { data: brief } = useQuery({
    queryKey: ["home-brief", primaryPet?.id],
    enabled: !!primaryPet,
    queryFn: async () => {
      const [vaccRes, logRes] = await Promise.all([
        supabase.from("vaccinations").select("vaccine_name, due_date, status").eq("pet_id", primaryPet!.id).order("due_date", { ascending: true }).limit(3),
        supabase.from("health_logs").select("weight_kg, log_date").eq("pet_id", primaryPet!.id).order("log_date", { ascending: false }).limit(5),
      ]);
      const upcomingVacc = (vaccRes.data || []).find((v: any) => v.status !== "completed" && v.due_date);
      const lastLog = (logRes.data || [])[0];
      const lastCheckup = lastLog;
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
        {/* Greeting */}
        <div>
          <h1 className="font-heading font-bold text-2xl leading-tight">Hi, {greetingName}! 👋</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">What would you like to do today?</p>
        </div>

        {/* 4 feature pill cards */}
        <section className="grid grid-cols-4 gap-2.5">
          {FEATURE_CARDS.map(({ key, title, Icon, path }) => {
            const words = title.split(" ");
            const line1 = words[0];
            const line2 = words.slice(1).join(" ");
            return (
              <button
                key={key}
                onClick={() => navigate(path)}
                className="rounded-lg bg-primary-light px-2 pt-3 pb-2.5 flex flex-col items-center justify-start gap-2 aspect-square hover:shadow-petosauras transition-shadow"
              >
                <Icon size={26} className="text-primary" strokeWidth={1.8} fill="currentColor" />
                <span className="font-heading font-bold text-[11px] text-foreground text-center leading-[1.15]">
                  {line1}
                  {line2 && (
                    <>
                      <br />
                      {line2}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </section>

        {/* My Pets / Guest CTAs */}
        {isGuest ? (
          <section className="space-y-3">
            <button
              onClick={() => navigate("/auth?redirect=/mypet")}
              className="w-full rounded-lg bg-primary-light overflow-hidden border border-border shadow-sm flex items-stretch"
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
              className="w-full rounded-lg bg-secondary-light overflow-hidden border border-border shadow-sm flex items-stretch"
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
              {pets.map((p: any) => {
                const isActive = p.id === selectedPetId;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPetId(p.id)}
                    className="shrink-0 flex flex-col items-center gap-1.5 w-[68px]"
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.name} className={`w-16 h-16 rounded-full object-cover ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`} />
                    ) : (
                      <div className={`w-16 h-16 rounded-full bg-primary-light flex items-center justify-center text-3xl ${isActive ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>{p.avatar_emoji || "🐾"}</div>
                    )}
                    <span className="text-[12px] font-heading font-bold truncate w-full text-center">{p.name}</span>
                    <span className="text-[10px] font-body text-muted-foreground truncate w-full text-center -mt-1">{p.species}</span>
                  </button>
                );
              })}
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
                onClick={() => navigate(`/mypet?pet=${primaryPet.id}`)}
                className="mt-4 w-full rounded-lg bg-card border border-border p-4 shadow-sm text-left flex items-center gap-3"
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
                <div className="w-full aspect-square rounded-lg bg-primary-light overflow-hidden">
                  <img
                    src={n.image_url || pickFallback(NEARBY_FALLBACK, n.category, n.name)}
                    alt={n.name}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = pickFallback(NEARBY_FALLBACK, n.category, n.name);
                    }}
                    className="w-full h-full object-cover"
                  />
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
                  className="shrink-0 w-[150px] text-left rounded-lg bg-card border border-border overflow-hidden shadow-sm"
                >
                  <div className="w-full aspect-[4/3] bg-primary-light overflow-hidden">
                    <img
                      src={b.thumbnail_url || pickFallback(BLOG_FALLBACK, b.title, b.summary)}
                      alt={b.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = pickFallback(BLOG_FALLBACK, b.title, b.summary);
                      }}
                      className="w-full h-full object-cover"
                    />
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
