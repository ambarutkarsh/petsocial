import { useState } from "react";
import ReelViewer from "@/components/ReelViewer";

type Post = {
  id: number;
  media_type: "image" | "video";
  media_url: string;
};

const Index = () => {
  // 🔹 Mock data (replace later with Supabase)
  const [posts] = useState<Post[]>([
    {
      id: 1,
      media_type: "image",
      media_url: "https://placekitten.com/400/500",
    },
    {
      id: 2,
      media_type: "video",
      media_url: "https://www.w3schools.com/html/mov_bbb.mp4",
    },
    {
      id: 3,
      media_type: "image",
      media_url: "https://placekitten.com/500/500",
    },
  ]);

  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  return (
    <div className="min-h-screen bg-white p-4">
      {/* 🔹 Feed Grid */}
      <div className="grid grid-cols-2 gap-4">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="cursor-pointer overflow-hidden rounded-xl border"
            onClick={() => {
              setSelectedIndex(index);
              setIsViewerOpen(true);
            }}
          >
            {post.media_type === "image" ? (
              <img
                src={post.media_url}
                className="h-60 w-full object-cover"
              />
            ) : (
              <video
                src={post.media_url}
                className="h-60 w-full object-cover"
                muted
              />
            )}
          </div>
        ))}
      </div>

      {/* 🔹 Reel Viewer Overlay */}
      {isViewerOpen && (
        <ReelViewer
          reels={posts.map((p) => ({
            type: p.media_type,
            url: p.media_url,
          }))}
          index={selectedIndex}
          onClose={() => setIsViewerOpen(false)}
        />
      )}
    </div>
  );
};

export default Index;
