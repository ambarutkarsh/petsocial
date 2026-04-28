import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { DocumentIcon, PetCareIcon, ProfileIcon } from "@/components/icons/PetosauraIcons";

import AdminLayout from "@/components/admin/AdminLayout";

const ADMIN_EMAIL = "petosauras@gmail.com";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600",
  "https://images.unsplash.com/photo-1548681528-6a5c45b66b42?w=600",
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600",
  "https://images.unsplash.com/photo-1592754862816-1a21a4ea2281?w=600",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600",
  "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=600",
  "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=600",
  "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600",
  "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600",
  "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=600",
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600",
  "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600",
];

const randomImage = () =>
  FALLBACK_IMAGES[Math.floor(Math.random() * FALLBACK_IMAGES.length)];

const USERS = [
  { name: "Priya Krishnamurthy", username: "priya_petmom", city: "Chennai", state: "Tamil Nadu", bio: "Dog mom 🐕 | Chennai vibes", petName: "Bruno", petType: "Canine", species: "Labrador Retriever", gender: "Male", age: 3,
    captions: ["Bruno's evening walk at Besant Nagar beach 🐾 Nothing beats this!", "My boy after his bath 😂 The drama is real #LabradorLife"] },
  { name: "Arjun Mehta", username: "arjun_fishkeeper", city: "Mumbai", state: "Maharashtra", bio: "Aquarium enthusiast 🐠 | Mumbai", petName: "Nemo", petType: "Aquatic", species: "Betta", gender: "Male", age: 1,
    captions: ["Finally set up the planted tank 🌿🐠 Nemo is exploring every corner!", "Water parameters perfect today. Happy fish, happy life 💙 #AquariumIndia"] },
  { name: "Meera Iyer", username: "meera_birdlady", city: "Bengaluru", state: "Karnataka", bio: "African Grey mom 🦜 | Bangalore", petName: "Kiki", petType: "Avian", species: "African Grey", gender: "Female", age: 4,
    captions: ["Kiki learned to say 'I want mango' in Kannada 😭 #AfricanGrey", "Sunday mornings with my girl ☕🦜 She steals my coffee every time"] },
  { name: "Rahul Sharma", username: "rahul_dogdad", city: "Delhi", state: "Delhi", bio: "Golden dad 🐕 | Runner | Delhi", petName: "Simba", petType: "Canine", species: "Golden Retriever", gender: "Male", age: 2,
    captions: ["Simba's first snow in Shimla ❄️🐕 He had no idea what to do with it", "6AM run with my best boy 🏃🐾 #GoldenRetriever #DelhiDogs"] },
  { name: "Ananya Pillai", username: "ananya_catmom", city: "Kochi", state: "Kerala", bio: "Persian cat mom 🐈 | Kerala", petName: "Luna", petType: "Feline", species: "Persian", gender: "Female", age: 5,
    captions: ["Luna judging me for eating chips at 11pm again 🙄🐈 #PersianCat", "When your cat takes over your WFH setup 💻🐾 Monday meetings ft. Luna"] },
  { name: "Vikram Nair", username: "vikram_reptiles", city: "Hyderabad", state: "Telangana", bio: "Reptile keeper 🦎 | Hyd", petName: "Spike", petType: "Reptile", species: "Bearded Dragon", gender: "Male", age: 2,
    captions: ["Spike's morning basking ritual 🌞🦎 More punctual than me honestly", "New climbing branch and he has not left it in 3 days 😂 #BeardedDragon"] },
  { name: "Deepa Venkataraman", username: "deepa_rabbitlove", city: "Coimbatore", state: "Tamil Nadu", bio: "Bunny mom x2 🐇 | Coimbatore", petName: "Toffee", petType: "Small Pet", species: "Holland Lop Rabbit", gender: "Female", age: 1,
    captions: ["Toffee discovered the garden today 🌿🐇 The zoomies were next level", "Floppy ears and zero problems ✨ Just Toffee on a Tuesday #BunnyLife"] },
  { name: "Siddharth Gupta", username: "sid_indie_dad", city: "Pune", state: "Maharashtra", bio: "Indie dog parent 🐕 | Pune", petName: "Bholu", petType: "Canine", species: "Indie/Mixed Breed", gender: "Male", age: 4,
    captions: ["Bholu was a street dog I rescued during lockdown. Best decision of my life 🐾", "Indie dogs are the most loyal creatures on this planet #AdoptDontShop"] },
  { name: "Kavitha Rajan", username: "kavitha_koi", city: "Chennai", state: "Tamil Nadu", bio: "Koi pond enthusiast 🐟 | Chennai", petName: "Raja", petType: "Aquatic", species: "Koi", gender: "Male", age: 3,
    captions: ["My koi pond after 6 months of work 🌸🐟 Raja is absolutely thriving!", "Feeding time is the best part of my evening 🧡 They recognise me now"] },
  { name: "Rohan Malhotra", username: "rohan_germshep", city: "Chandigarh", state: "Punjab", bio: "GSD parent 🐕 | Chandigarh", petName: "Major", petType: "Canine", species: "German Shepherd", gender: "Male", age: 3,
    captions: ["Major completing agility training 🏆🐕 Proudest dad moment!", "Early morning patrol with Major 🌅 4AM walks hit different #GSD"] },
  { name: "Nisha Kapoor", username: "nisha_siamese", city: "Jaipur", state: "Rajasthan", bio: "Siamese cat obsessed 🐈 | Jaipur", petName: "Cleo", petType: "Feline", species: "Siamese", gender: "Female", age: 3,
    captions: ["Cleo decided my art supplies were more interesting than her toys 🎨🐈", "The loudest cat in all of Rajasthan 😂 #SiameseCat #JaipurPets"] },
  { name: "Aditya Reddy", username: "adi_macaw", city: "Hyderabad", state: "Telangana", bio: "Macaw parent 🦜 | Hyd", petName: "Rio", petType: "Avian", species: "Macaw (Blue-and-Gold)", gender: "Male", age: 6,
    captions: ["Rio whistling my latest track better than I wrote it 😭🎵 #MacawLife", "40 years of friendship in the making 🦜💛 Growing old together"] },
  { name: "Sunita Bose", username: "sunita_guinea", city: "Kolkata", state: "West Bengal", bio: "Guinea pig mama x3 🐾 | Kolkata", petName: "Chhotu", petType: "Small Pet", species: "Guinea Pig", gender: "Male", age: 1,
    captions: ["Chhotu found the vegetable drawer 🥕🎉 The wheeks of joy were heard everywhere", "Three guinea pigs and they all need attention at once 😂 #GuineaPig"] },
  { name: "Kartik Pandey", username: "kartik_pomeranian", city: "Lucknow", state: "Uttar Pradesh", bio: "Pom parent 🐕 | Lucknow", petName: "Fluffy", petType: "Canine", species: "Pomeranian", gender: "Female", age: 2,
    captions: ["Fluffy in her winter sweater and she KNOWS she looks adorable 🧣🐾", "2kg of pure chaos and I would not trade her for anything 🧡 #Pomeranian"] },
  { name: "Divya Krishnan", username: "divya_aqua", city: "Bengaluru", state: "Karnataka", bio: "Discus fish keeper 🐠 | Blr", petName: "Disco", petType: "Aquatic", species: "Discus", gender: "Male", age: 2,
    captions: ["Disco's colours after the water change are absolutely unreal 🌈🐠", "Tank temp 29°C, pH 6.5, parameters perfect 🧪 Happy Disco #DiscusFish"] },
  { name: "Manish Agarwal", username: "manish_beagle", city: "Ahmedabad", state: "Gujarat", bio: "Beagle dad 🐕 | Ahmedabad", petName: "Sherlock", petType: "Canine", species: "Beagle", gender: "Male", age: 3,
    captions: ["Sherlock sniffed out my hidden birthday cake from behind two closed doors 😂", "Festival season and Sherlock gets a special treat 🪔🐾 #BeagleDad"] },
  { name: "Pooja Nambiar", username: "pooja_tortoise", city: "Thiruvananthapuram", state: "Kerala", bio: "Tortoise parent 🐢 | TVM", petName: "Kachua", petType: "Reptile", species: "Indian Star Tortoise", gender: "Female", age: 8,
    captions: ["Kachua's morning garden walk 🌿🐢 Same route every single day", "8 years together and she still surprises me 🌟 #Tortoise #KeralaPets"] },
  { name: "Amit Chatterjee", username: "amit_shihtzudad", city: "Kolkata", state: "West Bengal", bio: "Shih Tzu dad 🐕 | Kolkata", petName: "Momo", petType: "Canine", species: "Shih Tzu", gender: "Male", age: 4,
    captions: ["Momo after grooming looking like absolute royalty 👑🐕 #ShihTzu", "Durga Puja with Momo 🪷 He got more photos than anyone in the family 😂"] },
  { name: "Lakshmi Subramanian", username: "lakshmi_bengalcat", city: "Chennai", state: "Tamil Nadu", bio: "Bengal cat mom 🐈 | Chennai", petName: "Tiger", petType: "Feline", species: "Bengal", gender: "Male", age: 2,
    captions: ["Tiger doing his daily wall-climbing routine 🐆 #BengalCat #ChennaiCats", "The markings on this boy 😍 Every visitor asks if he is a wild cat"] },
  { name: "Rajesh Pillai", username: "rajesh_budgie", city: "Kochi", state: "Kerala", bio: "Budgie family x4 🦜 | Kochi", petName: "Mithu", petType: "Avian", species: "Budgerigar (Budgie)", gender: "Male", age: 3,
    captions: ["Mithu learned a new Malayalam song this week 🎵 #BudgieMom", "Four budgies and the noise level is incomprehensible but worth it 🌈🦜"] },
];

const emojiFor = (petType: string) =>
  petType === "Canine" ? "🐕" :
  petType === "Feline" ? "🐈" :
  petType === "Avian" ? "🦜" :
  petType === "Aquatic" ? "🐠" :
  petType === "Reptile" ? "🦎" : "🐾";

const AdminSeedScreen = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [seedUsers, setSeedUsers] = useState(0);
  const [seedPosts, setSeedPosts] = useState(0);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) navigate("/feed");
  }, [user, authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) fetchStatus();
  }, [isAdmin]);

  const fetchStatus = async () => {
    setStatusLoading(true);
    const [{ count: uCount }, { count: pCount }] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_seed_user", true),
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("is_seed_post", true),
    ]);
    setSeedUsers(uCount || 0);
    setSeedPosts(pCount || 0);
    setStatusLoading(false);
  };

  const handleSeed = async () => {
    setRunning(true);
    setLog(["🌱 Starting seed..."]);

    let usersCreated = 0;
    let postsCreated = 0;
    const createdUserIds: string[] = [];

    for (let i = 0; i < USERS.length; i++) {
      const u = USERS[i];
      setLog((prev) => [...prev, `👤 Creating user ${i + 1}/${USERS.length}: ${u.name}...`]);

      try {
        const seedUserId = crypto.randomUUID();

        const { error: profileError } = await supabase.from("profiles").insert({
          id: seedUserId,
          full_name: u.name,
          username: u.username,
          bio: u.bio,
          city: u.city,
          state: u.state,
          is_seed_user: true,
          pet_parent_since: 2021,
          post_count: u.captions.length,
          follower_count: Math.floor(Math.random() * 200) + 20,
          following_count: Math.floor(Math.random() * 100) + 10,
        });

        if (profileError) {
          setLog((prev) => [...prev, `⚠️ Profile error for ${u.name}: ${profileError.message}`]);
          continue;
        }
        createdUserIds.push(seedUserId);

        const { data: pet } = await supabase
          .from("pets")
          .insert({
            owner_id: seedUserId,
            name: u.petName,
            pet_type: u.petType,
            species: u.species,
            gender: u.gender,
            age_years: u.age,
            is_primary: true,
            avatar_emoji: emojiFor(u.petType),
          })
          .select("id")
          .single();

        for (let p = 0; p < u.captions.length; p++) {
          const daysBack = Math.floor(Math.random() * 30);
          const hoursBack = Math.floor(Math.random() * 24);
          const postDate = new Date();
          postDate.setDate(postDate.getDate() - daysBack);
          postDate.setHours(postDate.getHours() - hoursBack);

          const { error: postError } = await supabase.from("posts").insert({
            user_id: seedUserId,
            pet_id: pet?.id || null,
            media_url: randomImage(),
            media_type: "image",
            caption: u.captions[p],
            hashtags: u.captions[p].match(/#\w+/g) || [],
            ai_validated: true,
            like_count: Math.floor(Math.random() * 300) + 15,
            comment_count: Math.floor(Math.random() * 30) + 3,
            is_seed_post: true,
            created_at: postDate.toISOString(),
          });

          if (!postError) postsCreated++;
        }

        usersCreated++;
        setLog((prev) => [...prev, `✅ ${u.name} created with pet ${u.petName}`]);
      } catch (err: any) {
        setLog((prev) => [...prev, `❌ Failed for ${u.name}: ${err.message}`]);
      }
    }

    setLog((prev) => [...prev, "🔗 Adding follows between users..."]);
    const followRows: { follower_id: string; following_id: string }[] = [];
    for (let i = 0; i < createdUserIds.length; i++) {
      const followTargets = createdUserIds.filter((_, j) => j !== i).slice(0, 5);
      for (const targetId of followTargets) {
        followRows.push({ follower_id: createdUserIds[i], following_id: targetId });
      }
    }
    if (followRows.length > 0) {
      const { error: followsErr } = await supabase.functions.invoke("admin-seed-follows", {
        body: { follows: followRows },
      });
      if (followsErr) {
        setLog((prev) => [...prev, `⚠️ Failed to add follows: ${followsErr.message}`]);
      }
    }

    setLog((prev) => [...prev, `🎉 Done! ${usersCreated} users and ${postsCreated} posts created!`]);
    toast.success(`✅ ${usersCreated} users and ${postsCreated} posts created successfully!`);
    await fetchStatus();
    setRunning(false);
  };

  const handleDelete = async () => {
    if (!confirm("Delete ALL seed data? This cannot be undone.")) return;
    setDeleting(true);
    setLog(["🗑️ Deleting all seed data..."]);

    try {
      const { data: seedProfiles } = await supabase
        .from("profiles")
        .select("id")
        .eq("is_seed_user", true);

      const ids = (seedProfiles || []).map((p) => p.id);

      if (ids.length > 0) {
        await supabase.from("post_comments").delete().in("user_id", ids);
        await supabase.from("post_likes").delete().in("user_id", ids);
        await supabase.from("follows").delete().in("follower_id", ids);
        await supabase.from("follows").delete().in("following_id", ids);
        await supabase.from("stories").delete().in("user_id", ids);
        await supabase.from("posts").delete().in("user_id", ids);
        await supabase.from("pets").delete().in("owner_id", ids);
        await supabase.from("profiles").delete().in("id", ids);
      }

      setLog((prev) => [...prev, `✅ Deleted ${ids.length} seed users and all their data`]);
      toast.success("Seed data deleted");
      await fetchStatus();
    } catch (err: any) {
      setLog((prev) => [...prev, `❌ Error: ${err.message}`]);
      toast.error("Delete failed: " + err.message);
    }
    setDeleting(false);
  };

  if (authLoading || !isAdmin) return null;

  return (
    <AdminLayout title="Seed Data Manager" subtitle="Populate Petosauras with demo users and posts">
      <div className="max-w-3xl">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="p-4 text-center rounded-2xl">
            <ProfileIcon className="w-6 h-6 mx-auto mb-1 text-primary" />
            <div className="text-2xl font-bold text-foreground">
              {statusLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : seedUsers}
            </div>
            <div className="text-xs text-muted-foreground">Seed ProfileIcon</div>
          </Card>
          <Card className="p-4 text-center rounded-2xl">
            <DocumentIcon className="w-6 h-6 mx-auto mb-1 text-accent" />
            <div className="text-2xl font-bold text-foreground">
              {statusLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : seedPosts}
            </div>
            <div className="text-xs text-muted-foreground">Seed Posts</div>
          </Card>
        </div>

        <Button
          onClick={handleSeed}
          disabled={running || deleting}
          className="w-full rounded-2xl h-12 text-base mb-4"
        >
          {running ? (
            <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Seeding...</>
          ) : (
            <><PetCareIcon className="w-5 h-5 mr-2" /> 🌱 Run Seed Data</>
          )}
        </Button>

        {log.length > 0 && (
          <Card className="p-4 rounded-2xl mb-6 bg-muted/40 max-h-80 overflow-y-auto">
            <div className="text-xs font-mono space-y-1">
              {log.map((line, i) => (
                <div key={i} className="text-muted-foreground">{line}</div>
              ))}
            </div>
          </Card>
        )}

        {seedUsers > 0 && (
          <div className="border border-destructive/30 rounded-2xl p-4 mt-4 bg-white">
            <h3 className="text-sm font-semibold text-destructive mb-2">Danger Zone</h3>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={running || deleting}
              className="w-full border-destructive text-destructive hover:bg-destructive/10 rounded-2xl"
            >
              {deleting ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Deleting...</>
              ) : (
                <><Trash2 className="w-4 h-4 mr-2" /> 🗑️ Delete All Seed Data</>
              )}
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminSeedScreen;
