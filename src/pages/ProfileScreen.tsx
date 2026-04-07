import { Settings, MapPin, Calendar, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";

const mockPosts = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1415369629372-26f2fe60c467?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop",
];

const ProfileScreen = () => {
  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Cover gradient */}
        <div className="h-[155px] bg-gradient-to-r from-primary via-accent to-secondary relative">
          <button className="absolute top-4 right-4 bg-card/20 backdrop-blur-sm text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1">
            <Settings className="w-3.5 h-3.5" /> Edit Profile
          </button>
        </div>

        {/* Profile info */}
        <div className="px-4 -mt-10 relative z-10">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 border-4 border-card flex items-center justify-center text-2xl font-bold text-primary shadow-paw">
            SK
          </div>
          <h2 className="text-xl font-heading font-bold mt-2">Sarah Kumar</h2>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Mumbai, India</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Pet parent since 2021</span>
          </div>
        </div>

        {/* Stats */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-around paw-card p-3">
            <div className="text-center">
              <p className="text-lg font-heading font-bold">24</p>
              <p className="text-xs text-text-muted">Posts</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-bold">1.2k</p>
              <p className="text-xs text-text-muted">Followers</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div className="text-center">
              <p className="text-lg font-heading font-bold">348</p>
              <p className="text-xs text-text-muted">Following</p>
            </div>
          </div>
        </div>

        {/* Pet card */}
        <div className="px-4 mt-4">
          <div className="paw-card p-4 flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-3xl">🐕</div>
            <div className="flex-1">
              <h3 className="font-heading font-bold">Max</h3>
              <p className="text-xs text-text-muted">Golden Retriever • 3 yrs • Male</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary mt-1 inline-block">
                ✅ Vaccinations up to date
              </span>
            </div>
          </div>
        </div>

        {/* Post gallery */}
        <div className="px-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Grid3X3 className="w-4 h-4 text-text-mid" />
            <span className="text-sm font-semibold">Posts</span>
          </div>
          <div className="grid grid-cols-3 gap-1 rounded-xl overflow-hidden">
            {mockPosts.map((url, i) => (
              <div key={i} className="aspect-square">
                <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileLayout>
  );
};

export default ProfileScreen;
