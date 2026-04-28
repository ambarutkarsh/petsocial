import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const ADMIN_EMAILS = (Deno.env.get("ADMIN_EMAILS") ?? "petosauras@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

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

const USERS = [
  { name: "Priya Krishnamurthy", username: "priya_petmom", city: "Chennai", state: "Tamil Nadu", bio: "Dog mom 🐕 | Chennai vibes", petName: "Bruno", petType: "Canine", species: "Labrador Retriever", gender: "Male", age: 3, captions: ["Bruno's evening walk at Besant Nagar beach 🐾 Nothing beats this!", "My boy after his bath 😂 The drama is real #LabradorLife"] },
  { name: "Arjun Mehta", username: "arjun_fishkeeper", city: "Mumbai", state: "Maharashtra", bio: "Aquarium enthusiast 🐠 | Mumbai", petName: "Nemo", petType: "Aquatic", species: "Betta", gender: "Male", age: 1, captions: ["Finally set up the planted tank 🌿🐠 Nemo is exploring every corner!", "Water parameters perfect today. Happy fish, happy life 💙 #AquariumIndia"] },
  { name: "Meera Iyer", username: "meera_birdlady", city: "Bengaluru", state: "Karnataka", bio: "African Grey mom 🦜 | Bangalore", petName: "Kiki", petType: "Avian", species: "African Grey", gender: "Female", age: 4, captions: ["Kiki learned to say 'I want mango' in Kannada 😭 #AfricanGrey", "Sunday mornings with my girl ☕🦜 She steals my coffee every time"] },
  { name: "Rahul Sharma", username: "rahul_dogdad", city: "Delhi", state: "Delhi", bio: "Golden dad 🐕 | Runner | Delhi", petName: "Simba", petType: "Canine", species: "Golden Retriever", gender: "Male", age: 2, captions: ["Simba's first snow in Shimla ❄️🐕 He had no idea what to do with it", "6AM run with my best boy 🏃🐾 #GoldenRetriever #DelhiDogs"] },
  { name: "Ananya Pillai", username: "ananya_catmom", city: "Kochi", state: "Kerala", bio: "Persian cat mom 🐈 | Kerala", petName: "Luna", petType: "Feline", species: "Persian", gender: "Female", age: 5, captions: ["Luna judging me for eating chips at 11pm again 🙄🐈 #PersianCat", "When your cat takes over your WFH setup 💻🐾 Monday meetings ft. Luna"] },
  { name: "Vikram Nair", username: "vikram_reptiles", city: "Hyderabad", state: "Telangana", bio: "Reptile keeper 🦎 | Hyd", petName: "Spike", petType: "Reptile", species: "Bearded Dragon", gender: "Male", age: 2, captions: ["Spike's morning basking ritual 🌞🦎 More punctual than me honestly", "New climbing branch and he has not left it in 3 days 😂 #BeardedDragon"] },
  { name: "Deepa Venkataraman", username: "deepa_rabbitlove", city: "Coimbatore", state: "Tamil Nadu", bio: "Bunny mom x2 🐇 | Coimbatore", petName: "Toffee", petType: "Small Pet", species: "Holland Lop Rabbit", gender: "Female", age: 1, captions: ["Toffee discovered the garden today 🌿🐇 The zoomies were next level", "Floppy ears and zero problems ✨ Just Toffee on a Tuesday #BunnyLife"] },
  { name: "Siddharth Gupta", username: "sid_indie_dad", city: "Pune", state: "Maharashtra", bio: "Indie dog parent 🐕 | Pune", petName: "Bholu", petType: "Canine", species: "Indie/Mixed Breed", gender: "Male", age: 4, captions: ["Bholu was a street dog I rescued during lockdown. Best decision of my life 🐾", "Indie dogs are the most loyal creatures on this planet #AdoptDontShop"] },
  { name: "Kavitha Rajan", username: "kavitha_koi", city: "Chennai", state: "Tamil Nadu", bio: "Koi pond enthusiast 🐟 | Chennai", petName: "Raja", petType: "Aquatic", species: "Koi", gender: "Male", age: 3, captions: ["My koi pond after 6 months of work 🌸🐟 Raja is absolutely thriving!", "Feeding time is the best part of my evening 🧡 They recognise me now"] },
  { name: "Rohan Malhotra", username: "rohan_germshep", city: "Chandigarh", state: "Punjab", bio: "GSD parent 🐕 | Chandigarh", petName: "Major", petType: "Canine", species: "German Shepherd", gender: "Male", age: 3, captions: ["Major completing agility training 🏆🐕 Proudest dad moment!", "Early morning patrol with Major 🌅 4AM walks hit different #GSD"] },
  { name: "Nisha Kapoor", username: "nisha_siamese", city: "Jaipur", state: "Rajasthan", bio: "Siamese cat obsessed 🐈 | Jaipur", petName: "Cleo", petType: "Feline", species: "Siamese", gender: "Female", age: 3, captions: ["Cleo decided my art supplies were more interesting than her toys 🎨🐈", "The loudest cat in all of Rajasthan 😂 #SiameseCat #JaipurPets"] },
  { name: "Aditya Reddy", username: "adi_macaw", city: "Hyderabad", state: "Telangana", bio: "Macaw parent 🦜 | Hyd", petName: "Rio", petType: "Avian", species: "Macaw (Blue-and-Gold)", gender: "Male", age: 6, captions: ["Rio whistling my latest track better than I wrote it 😭🎵 #MacawLife", "40 years of friendship in the making 🦜💛 Growing old together"] },
  { name: "Sunita Bose", username: "sunita_guinea", city: "Kolkata", state: "West Bengal", bio: "Guinea pig mama x3 🐾 | Kolkata", petName: "Chhotu", petType: "Small Pet", species: "Guinea Pig", gender: "Male", age: 1, captions: ["Chhotu found the vegetable drawer 🥕🎉 The wheeks of joy were heard everywhere", "Three guinea pigs and they all need attention at once 😂 #GuineaPig"] },
  { name: "Kartik Pandey", username: "kartik_pomeranian", city: "Lucknow", state: "Uttar Pradesh", bio: "Pom parent 🐕 | Lucknow", petName: "Fluffy", petType: "Canine", species: "Pomeranian", gender: "Female", age: 2, captions: ["Fluffy in her winter sweater and she KNOWS she looks adorable 🧣🐾", "2kg of pure chaos and I would not trade her for anything 🧡 #Pomeranian"] },
  { name: "Divya Krishnan", username: "divya_aqua", city: "Bengaluru", state: "Karnataka", bio: "Discus fish keeper 🐠 | Blr", petName: "Disco", petType: "Aquatic", species: "Discus", gender: "Male", age: 2, captions: ["Disco's colours after the water change are absolutely unreal 🌈🐠", "Tank temp 29°C, pH 6.5, parameters perfect 🧪 Happy Disco #DiscusFish"] },
  { name: "Manish Agarwal", username: "manish_beagle", city: "Ahmedabad", state: "Gujarat", bio: "Beagle dad 🐕 | Ahmedabad", petName: "Sherlock", petType: "Canine", species: "Beagle", gender: "Male", age: 3, captions: ["Sherlock sniffed out my hidden birthday cake from behind two closed doors 😂", "Festival season and Sherlock gets a special treat 🪔🐾 #BeagleDad"] },
  { name: "Pooja Nambiar", username: "pooja_tortoise", city: "Thiruvananthapuram", state: "Kerala", bio: "Tortoise parent 🐢 | TVM", petName: "Kachua", petType: "Reptile", species: "Indian Star Tortoise", gender: "Female", age: 8, captions: ["Kachua's morning garden walk 🌿🐢 Same route every single day", "8 years together and she still surprises me 🌟 #Tortoise #KeralaPets"] },
  { name: "Amit Chatterjee", username: "amit_shihtzudad", city: "Kolkata", state: "West Bengal", bio: "Shih Tzu dad 🐕 | Kolkata", petName: "Momo", petType: "Canine", species: "Shih Tzu", gender: "Male", age: 4, captions: ["Momo after grooming looking like absolute royalty 👑🐕 #ShihTzu", "Durga Puja with Momo 🪷 He got more photos than anyone in the family 😂"] },
  { name: "Lakshmi Subramanian", username: "lakshmi_bengalcat", city: "Chennai", state: "Tamil Nadu", bio: "Bengal cat mom 🐈 | Chennai", petName: "Tiger", petType: "Feline", species: "Bengal", gender: "Male", age: 2, captions: ["Tiger doing his daily wall-climbing routine 🐆 #BengalCat #ChennaiCats", "The markings on this boy 😍 Every visitor asks if he is a wild cat"] },
  { name: "Rajesh Pillai", username: "rajesh_budgie", city: "Kochi", state: "Kerala", bio: "Budgie family x4 🦜 | Kochi", petName: "Mithu", petType: "Avian", species: "Budgerigar (Budgie)", gender: "Male", age: 3, captions: ["Mithu learned a new Malayalam song this week 🎵 #BudgieMom", "Four budgies and the noise level is incomprehensible but worth it 🌈🦜"] },
];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function requireAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return { error: json({ error: "Missing Authorization header" }, 401) };
  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } });
  const { data, error } = await userClient.auth.getUser();
  const email = data.user?.email?.toLowerCase() ?? "";
  if (error || !data.user) return { error: json({ error: "Invalid auth token" }, 401) };
  if (!ADMIN_EMAILS.includes(email)) return { error: json({ error: "Forbidden: not an admin" }, 403) };
  return { user: data.user };
}

const emojiFor = (petType: string) =>
  petType === "Canine" ? "🐕" : petType === "Feline" ? "🐈" : petType === "Avian" ? "🦜" : petType === "Aquatic" ? "🐠" : petType === "Reptile" ? "🦎" : "🐾";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireAdmin(req);
    if (auth.error) return auth.error;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const usernames = USERS.map((u) => u.username);
    const { data: existingProfiles, error: existingErr } = await admin
      .from("profiles")
      .select("id, username")
      .in("username", usernames)
      .eq("is_seed_user", true);
    if (existingErr) return json({ error: existingErr.message }, 500);

    const byUsername = new Map((existingProfiles ?? []).map((p: any) => [p.username, p.id]));
    let profiles = 0;
    let pets = 0;
    let posts = 0;

    for (const u of USERS) {
      let seedUserId = byUsername.get(u.username) as string | undefined;
      if (!seedUserId) {
        seedUserId = crypto.randomUUID();
        const { error } = await admin.from("profiles").insert({
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
        if (error) return json({ error: `profile ${u.username}: ${error.message}` }, 500);
        profiles++;
      }

      const { data: existingPets } = await admin.from("pets").select("id").eq("owner_id", seedUserId).limit(1);
      let petId = existingPets?.[0]?.id;
      if (!petId) {
        const { data: pet, error } = await admin.from("pets").insert({
          owner_id: seedUserId,
          name: u.petName,
          pet_type: u.petType,
          species: u.species,
          gender: u.gender,
          age_years: u.age,
          is_primary: true,
          avatar_emoji: emojiFor(u.petType),
        }).select("id").single();
        if (error) return json({ error: `pet ${u.username}: ${error.message}` }, 500);
        petId = pet.id;
        pets++;
      }

      const { data: existingPosts } = await admin.from("posts").select("caption").eq("user_id", seedUserId).eq("is_seed_post", true);
      const existingCaptions = new Set((existingPosts ?? []).map((p: any) => p.caption));
      const rows = u.captions.filter((caption) => !existingCaptions.has(caption)).map((caption, idx) => {
        const postDate = new Date();
        postDate.setDate(postDate.getDate() - Math.floor(Math.random() * 30));
        postDate.setHours(postDate.getHours() - Math.floor(Math.random() * 24));
        return {
          user_id: seedUserId,
          pet_id: petId,
          media_url: FALLBACK_IMAGES[(idx + u.username.length) % FALLBACK_IMAGES.length],
          media_type: "image",
          caption,
          hashtags: caption.match(/#\w+/g) || [],
          ai_validated: true,
          like_count: Math.floor(Math.random() * 300) + 15,
          comment_count: Math.floor(Math.random() * 30) + 3,
          is_seed_post: true,
          post_category: "reel",
          created_at: postDate.toISOString(),
        };
      });
      if (rows.length) {
        const { error } = await admin.from("posts").insert(rows);
        if (error) return json({ error: `posts ${u.username}: ${error.message}` }, 500);
        posts += rows.length;
      }
    }

    const { data: seedProfiles } = await admin.from("profiles").select("id").eq("is_seed_user", true).in("username", usernames);
    const ids = (seedProfiles ?? []).map((p: any) => p.id);
    const followRows: { follower_id: string; following_id: string }[] = [];
    ids.forEach((id: string, i: number) => {
      ids.filter((target: string) => target !== id).slice(i % Math.max(1, ids.length - 1), i % Math.max(1, ids.length - 1) + 3).forEach((target: string) => {
        followRows.push({ follower_id: id, following_id: target });
      });
    });
    let follows = 0;
    if (followRows.length) {
      await admin.from("follows").delete().in("follower_id", ids).in("following_id", ids);
      const { error } = await admin.from("follows").insert(followRows);
      if (!error) follows = followRows.length;
    }

    return json({ profiles, pets, posts, follows, ensuredSeedUsers: ids.length });
  } catch (e) {
    console.error("admin-seed-demo error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});
