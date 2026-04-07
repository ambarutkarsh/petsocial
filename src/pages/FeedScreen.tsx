import { useState } from "react";
import { Search, Bell, Heart, MessageCircle, Share2, Bookmark, Plus } from "lucide-react";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import PostUploadModal from "@/components/PostUploadModal";

const mockStories = [
  { id: "add", name: "Add", emoji: "", isAdd: true },
  { id: "1", name: "Max", emoji: "🐕", seen: false },
  { id: "2", name: "Whiskers", emoji: "🐈", seen: false },
  { id: "3", name: "Nemo", emoji: "🐠", seen: true },
  { id: "4", name: "Polly", emoji: "🦜", seen: false },
  { id: "5", name: "Bun Bun", emoji: "🐇", seen: true },
];

const mockPosts = [
  {
    id: "1",
    user: { name: "Sarah K.", handle: "sarahk", initials: "SK" },
    pet: { name: "Max", type: "Golden Retriever" },
    image: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop",
    caption: "Beach day with my best boy! 🏖️",
    hashtags: ["#beachdog", "#goldenretriever"],
    likes: 234,
    comments: 18,
    liked: false,
    saved: false,
    time: "2h ago",
  },
  {
    id: "2",
    user: { name: "Raj P.", handle: "rajp", initials: "RP" },
    pet: { name: "Luna", type: "Persian Cat" },
    image: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=600&fit=crop",
    caption: "Luna found her new favorite napping spot 😴",
    hashtags: ["#catlife", "#persian"],
    likes: 189,
    comments: 12,
    liked: true,
    saved: false,
    time: "4h ago",
  },
  {
    id: "3",
    user: { name: "Priya M.", handle: "priyam", initials: "PM" },
    pet: { name: "Coco", type: "Beagle" },
    image: "https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600&h=600&fit=crop",
    caption: "Morning walk adventures 🌅🐾",
    hashtags: ["#beagle", "#morningwalk"],
    likes: 156,
    comments: 8,
    liked: false,
    saved: true,
    time: "6h ago",
  },
];

const FeedScreen = () => {
  const [posts, setPosts] = useState(mockPosts);
  const [showUpload, setShowUpload] = useState(false);

  const toggleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const toggleSave = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p))
    );
  };

  return (
    <MobileLayout>
      <div className="pb-20">
        {/* Header */}
        <header className="sticky top-0 bg-background/80 backdrop-blur-lg z-40 px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-heading font-bold">
            <span className="text-primary">Paw</span>Social
          </h1>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid hover:bg-muted transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center text-text-mid hover:bg-muted transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </button>
          </div>
        </header>

        {/* Stories */}
        <div className="px-4 py-2 flex gap-3 overflow-x-auto no-scrollbar">
          {mockStories.map((s) => (
            <div key={s.id} className="flex flex-col items-center gap-1 shrink-0">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  s.isAdd
                    ? "border-2 border-dashed border-primary bg-primary/5"
                    : s.seen
                    ? "border-2 border-muted"
                    : "bg-gradient-to-br from-primary to-accent p-[3px]"
                }`}
              >
                {s.isAdd ? (
                  <Plus className="w-6 h-6 text-primary" />
                ) : (
                  <div className="w-full h-full rounded-full bg-card flex items-center justify-center text-2xl">
                    {s.emoji}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium text-text-mid">{s.name}</span>
            </div>
          ))}
        </div>

        {/* Posts */}
        <div className="space-y-4 px-4 mt-2">
          {posts.map((post) => (
            <article key={post.id} className="paw-card overflow-hidden animate-fade-in">
              {/* Post header */}
              <div className="flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
                  {post.user.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{post.user.name}</p>
                  <p className="text-xs text-text-muted">{post.pet.name} • {post.pet.type} • {post.time}</p>
                </div>
              </div>

              {/* Media */}
              <div className="relative aspect-square bg-muted">
                <img src={post.image} alt={post.caption} className="w-full h-full object-cover" loading="lazy" />
                {post.hashtags.length > 0 && (
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {post.hashtags.map((tag) => (
                      <span key={tag} className="text-xs font-medium bg-card/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-foreground">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post.id)} className="flex items-center gap-1.5 transition-colors">
                      <Heart className={`w-5 h-5 ${post.liked ? "fill-destructive text-destructive" : "text-text-mid"}`} />
                      <span className="text-sm font-medium">{post.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-text-mid">
                      <MessageCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{post.comments}</span>
                    </button>
                    <button className="text-text-mid">
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                  <button onClick={() => toggleSave(post.id)}>
                    <Bookmark className={`w-5 h-5 ${post.saved ? "fill-primary text-primary" : "text-text-mid"}`} />
                  </button>
                </div>
                <p className="text-sm">
                  <span className="font-semibold">@{post.user.handle}</span>{" "}
                  <span className="text-text-mid">{post.caption}</span>
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>

      <BottomNav onPostClick={() => setShowUpload(true)} />
      <PostUploadModal open={showUpload} onClose={() => setShowUpload(false)} />
    </MobileLayout>
  );
};

export default FeedScreen;
