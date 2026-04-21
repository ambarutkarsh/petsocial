import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShoppingBag, MapPin, Star, ExternalLink, Loader2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import CreateSheet from "@/components/CreateSheet";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";

const BRANDS = [
  { name: "Royal Canin", emoji: "🐶", url: "https://www.royalcanin.com/in" },
  { name: "Drools", emoji: "🥩", url: "https://www.droolspetfood.com" },
  { name: "Heads Up For Tails", emoji: "🦴", url: "https://www.headsupfortails.com" },
  { name: "Pedigree", emoji: "🐕", url: "https://www.pedigree.in" },
];

const NGOS = [
  { name: "Blue Cross of India", emoji: "🐾", desc: "Chennai's oldest animal welfare org", url: "https://bluecrossofindia.org" },
  { name: "PETA India", emoji: "🐾", desc: "People for the Ethical Treatment of Animals", url: "https://www.petaindia.com" },
  { name: "Animal Aid Unlimited", emoji: "🐾", desc: "Udaipur-based rescue org", url: "https://www.animalaidunlimited.org" },
  { name: "Friendicoes SECA", emoji: "🐾", desc: "Delhi animal rescue and adoption", url: "https://friendicoes.com" },
];

type Sub = "adopt" | "mate";

const ShopScreen = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [adoptTab, setAdoptTab] = useState<Sub>("adopt");
  const [shops, setShops] = useState<any[]>([]);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState("");

  const { data: adoptionTopics = [] } = useQuery({
    queryKey: ["forum-topics", "adoption"],
    queryFn: async () => {
      const { data } = await supabase.from("forum_topics").select("*").eq("pet_category", "adoption").order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const { data: matingTopics = [] } = useQuery({
    queryKey: ["forum-topics", "mating"],
    queryFn: async () => {
      const { data } = await supabase.from("forum_topics").select("*").eq("pet_category", "mating").order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
  });

  const findShops = async () => {
    setShopsLoading(true);
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
      const { data, error } = await supabase.functions.invoke("fetch-nearby-places", {
        body: { lat: pos.coords.latitude, lng: pos.coords.longitude, type: "pet_store", radius: 5000 },
      });
      if (error) throw error;
      setShops(data?.places || []);
    } catch {
      toast.error("Could not get location");
    } finally {
      setShopsLoading(false);
    }
  };

  const joinWaitlist = async () => {
    if (!waitlistEmail || !waitlistEmail.includes("@")) {
      toast.error("Please enter a valid email");
      return;
    }
    await supabase.from("waitlist").insert({ email: waitlistEmail, user_id: user?.id || null, feature: "order_now" });
    toast.success("You're on the waitlist! 🦕");
    trackEvent("waitlist_joined");
    setWaitlistEmail("");
  };

  const postAdoption = (cat: "adoption" | "mating") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const title = prompt(cat === "adoption" ? "Pet to adopt — title" : "Pet for mating — title");
    if (!title) return;
    const content = prompt("Describe pet (species, breed, age, location, contact info)");
    if (!content || content.length < 20) {
      toast.error("Please add more detail");
      return;
    }
    supabase.from("forum_topics").insert({ user_id: user.id, title, content, pet_category: cat, tags: [cat] }).then(() => {
      toast.success("Posted!");
      window.location.reload();
    });
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-xl font-heading font-bold">🐾 MyPet</h1>
          <p className="text-xs text-muted-foreground font-body mt-0.5">Your pets, all in one place. Full rebuild coming next phase.</p>
        </div>

        {/* SECTION 1: Brands */}
        <div className="px-4 mt-4">
          <h2 className="font-heading font-bold text-base mb-2">🥩 Pet Food Brands</h2>
          <div className="grid grid-cols-2 gap-2">
            {BRANDS.map((b) => (
              <a key={b.name} href={b.url} target="_blank" rel="noreferrer" onClick={() => trackEvent("brand_clicked", { brand: b.name })} className="paw-card p-3">
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{b.emoji}</span>
                  <span className="text-[9px] font-body font-bold bg-accent-light text-accent px-1.5 py-0.5 rounded-full">Partner</span>
                </div>
                <p className="font-heading font-bold text-sm mt-2">{b.name}</p>
                <p className="text-[11px] text-primary font-body font-bold mt-1 flex items-center gap-1">Shop <ExternalLink className="w-3 h-3" /></p>
              </a>
            ))}
          </div>

          {/* Waitlist */}
          <div className="paw-card p-4 mt-3 bg-gradient-to-br from-primary-light to-secondary-light">
            <p className="font-heading font-bold text-sm">🚀 Order Now — Coming Soon</p>
            <p className="text-xs text-muted-foreground font-body mt-1 mb-2">Get notified at launch</p>
            <div className="flex gap-2">
              <Input value={waitlistEmail} onChange={(e) => setWaitlistEmail(e.target.value)} placeholder="you@example.com" className="flex-1 h-10" />
              <Button size="sm" onClick={joinWaitlist}>Join</Button>
            </div>
          </div>
        </div>

        {/* SECTION 2: Local shops */}
        <div className="px-4 mt-6">
          <h2 className="font-heading font-bold text-base mb-2">📍 Pet Shops Near You</h2>
          <Button onClick={findShops} disabled={shopsLoading} className="w-full" variant="outline">
            {shopsLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</> : <><MapPin className="w-4 h-4" /> Find Nearby Shops</>}
          </Button>
          <div className="mt-3 space-y-2">
            {shops.map((s) => (
              <div key={s.place_id} className="paw-card p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-bold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground font-body truncate">{s.address}</p>
                  <div className="flex gap-3 mt-1">
                    {s.rating > 0 && <span className="text-xs flex items-center gap-1"><Star className="w-3 h-3 fill-warning text-warning" />{s.rating}</span>}
                    <span className="text-xs text-muted-foreground">{s.distance_km} km</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}&query_place_id=${s.place_id}`, "_blank")}>
                  Directions
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3: Adoption / Mating */}
        <div className="px-4 mt-6">
          <h2 className="font-heading font-bold text-base mb-2">🐾 Adoption & Mating</h2>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setAdoptTab("adopt")} className={`flex-1 py-2 rounded-full text-sm font-body font-bold transition-colors ${adoptTab === "adopt" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Adopt 🐾</button>
            <button onClick={() => setAdoptTab("mate")} className={`flex-1 py-2 rounded-full text-sm font-body font-bold transition-colors ${adoptTab === "mate" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>Find a Mate 💕</button>
          </div>
          <Button size="sm" className="w-full mb-3" onClick={() => postAdoption(adoptTab === "adopt" ? "adoption" : "mating")}>
            <Heart className="w-4 h-4" /> {adoptTab === "adopt" ? "Post for Adoption" : "Post for Mating"}
          </Button>
          <div className="space-y-2">
            {(adoptTab === "adopt" ? adoptionTopics : matingTopics).length === 0 ? (
              <p className="text-center text-sm text-muted-foreground font-body py-4">No posts yet. Be the first!</p>
            ) : (adoptTab === "adopt" ? adoptionTopics : matingTopics).map((t: any) => (
              <div key={t.id} className="paw-card p-3">
                <p className="font-heading font-bold text-sm">{t.title}</p>
                <p className="text-xs text-muted-foreground font-body mt-1 line-clamp-3 whitespace-pre-line">{t.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 4: NGO Hub */}
        <div className="px-4 mt-6">
          <h2 className="font-heading font-bold text-base mb-2">❤️ NGO Hub</h2>
          <div className="space-y-2">
            {NGOS.map((n) => (
              <div key={n.name} className="paw-card p-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{n.emoji}</span>
                  <div className="flex-1">
                    <p className="font-heading font-bold text-sm">{n.name}</p>
                    <p className="text-xs text-muted-foreground font-body">{n.desc}</p>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => window.open(n.url, "_blank")}>Visit Website</Button>
                      <Button size="sm" onClick={() => window.open(n.url, "_blank")}>Donate</Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav onPostClick={() => setShowCreate(true)} />
      <CreateSheet open={showCreate} onClose={() => setShowCreate(false)} />
    </MobileLayout>
  );
};

export default ShopScreen;
