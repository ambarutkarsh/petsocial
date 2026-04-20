import { createClient } from 'npm:@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const DUMMY_USERS = [
  {
    full_name: "Priya Krishnamurthy", username: "priya_petmom", city: "Chennai", state: "Tamil Nadu", pin_code: "600001",
    bio: "Dog mom 🐕 | Coffee lover | Chennai vibes",
    pet: { name: "Bruno", type: "Canine", species: "Labrador Retriever", gender: "Male", age: 3, emoji: "🐕" },
    posts: [
      "Bruno had the best Monday ever 🐾 Nothing beats those evening walks at Besant Nagar beach!",
      "My boy after his bath 😂 The drama is unreal but I live for it #LabradorLife #Chennai"
    ]
  },
  {
    full_name: "Arjun Mehta", username: "arjun_fishkeeper", city: "Mumbai", state: "Maharashtra", pin_code: "400001",
    bio: "Aquarium enthusiast 🐠 | Software dev | Mumbai",
    pet: { name: "Nemo", type: "Aquatic", species: "Betta", gender: "Male", age: 1, emoji: "🐠" },
    posts: [
      "Finally set up the planted tank I dreamed of for 2 years 🌿🐠 Nemo is already exploring every corner!",
      "Water parameters are perfect today. Happy fish, happy life 💙 #AquariumIndia #BettaFish"
    ]
  },
  {
    full_name: "Meera Iyer", username: "meera_birdlady", city: "Bengaluru", state: "Karnataka", pin_code: "560001",
    bio: "African Grey mom 🦜 | Tech worker | Bangalore",
    pet: { name: "Kiki", type: "Avian", species: "African Grey", gender: "Female", age: 4, emoji: "🦜" },
    posts: [
      "Kiki learned to say 'I want mango' in Kannada 😭 This bird is smarter than most people I know #AfricanGrey #BangalorePets",
      "Sunday mornings with my girl ☕🦜 She steals my coffee every single time"
    ]
  },
  {
    full_name: "Rahul Sharma", username: "rahul_dogdad", city: "Delhi", state: "Delhi", pin_code: "110001",
    bio: "Golden dad 🐕 | Runner | Delhi NCR",
    pet: { name: "Simba", type: "Canine", species: "Golden Retriever", gender: "Male", age: 2, emoji: "🐕" },
    posts: [
      "Simba's first snow in Shimla ❄️🐕 He had absolutely no idea what to do with it and honestly same",
      "6AM run with my best boy 🏃🐾 He has more energy than me and I'm deeply humbled #GoldenRetriever #DelhiDogs"
    ]
  },
  {
    full_name: "Ananya Pillai", username: "ananya_catmom", city: "Kochi", state: "Kerala", pin_code: "682001",
    bio: "Persian cat mom 🐈 | Homechef | Kerala",
    pet: { name: "Luna", type: "Feline", species: "Persian", gender: "Female", age: 5, emoji: "🐈" },
    posts: [
      "Luna judging me for eating chips at 11pm again 🙄🐈 The look of disappointment is very real #PersianCat #KeralaGram",
      "When your cat takes over your WFH setup and you just accept it 💻🐾 Monday meetings ft. Luna"
    ]
  },
  {
    full_name: "Vikram Nair", username: "vikram_reptiles", city: "Hyderabad", state: "Telangana", pin_code: "500001",
    bio: "Reptile keeper 🦎 | Wildlife lover | Hyd",
    pet: { name: "Spike", type: "Reptile", species: "Bearded Dragon", gender: "Male", age: 2, emoji: "🦎" },
    posts: [
      "Spike's morning basking ritual 🌞🦎 Every morning at exactly 8AM without fail. More punctual than me honestly",
      "Got Spike a new climbing branch and he has not left it in 3 days 😂 #BeardedDragon #ReptilesOfIndia #HyderabadPets"
    ]
  },
  {
    full_name: "Deepa Venkataraman", username: "deepa_rabbitlove", city: "Coimbatore", state: "Tamil Nadu", pin_code: "641001",
    bio: "Bunny mom x2 🐇 | Yoga teacher | Coimbatore",
    pet: { name: "Toffee", type: "Small Pet", species: "Holland Lop Rabbit", gender: "Female", age: 1, emoji: "🐇" },
    posts: [
      "Toffee discovered the garden today and I thought she would never come back inside 🌿🐇 The zoomies were next level",
      "Floppy ears and zero problems ✨ Just Toffee being Toffee on a Tuesday afternoon #HollandLop #BunnyLife"
    ]
  },
  {
    full_name: "Siddharth Gupta", username: "sid_indie_dad", city: "Pune", state: "Maharashtra", pin_code: "411001",
    bio: "Indie dog parent 🐕 | Startup founder | Pune",
    pet: { name: "Bholu", type: "Canine", species: "Indie/Mixed Breed", gender: "Male", age: 4, emoji: "🐕" },
    posts: [
      "Bholu was a street dog I rescued during lockdown. Best decision of my life. 3 years later and he runs the house 🏠🐾",
      "Indie dogs are the most loyal creatures on this planet, change my mind 🐕❤️ #IndieDog #AdoptDontShop #PunePets"
    ]
  },
  {
    full_name: "Kavitha Rajan", username: "kavitha_koi", city: "Chennai", state: "Tamil Nadu", pin_code: "600020",
    bio: "Koi pond enthusiast 🐟 | Garden lover | Chennai",
    pet: { name: "Raja", type: "Aquatic", species: "Koi", gender: "Male", age: 3, emoji: "🐠" },
    posts: [
      "My koi pond after 6 months of work 🌸🐟 Raja and his 5 friends are absolutely thriving. Worth every bit of effort!",
      "Feeding time is the best part of my evening 🧡 They recognise me now and swim to the edge #KoiPond #ChennaiGarden"
    ]
  },
  {
    full_name: "Rohan Malhotra", username: "rohan_germshep", city: "Chandigarh", state: "Punjab", pin_code: "160001",
    bio: "GSD parent 🐕 | Ex-army | Chandigarh",
    pet: { name: "Major", type: "Canine", species: "German Shepherd", gender: "Male", age: 3, emoji: "🐕" },
    posts: [
      "Major completing his agility training today 🏆🐕 This dog has more discipline than any human I know. Proud dad moment!",
      "Early morning patrol with Major 🌅 4AM walks hit different when you have a German Shepherd by your side #GSD #ChandigarhDogs"
    ]
  },
  {
    full_name: "Nisha Kapoor", username: "nisha_siamese", city: "Jaipur", state: "Rajasthan", pin_code: "302001",
    bio: "Siamese cat obsessed 🐈 | Artist | Jaipur",
    pet: { name: "Cleo", type: "Feline", species: "Siamese", gender: "Female", age: 3, emoji: "🐈" },
    posts: [
      "Cleo decided my art supplies were more interesting than her toys today 🎨🐈 At least she has good taste in colours",
      "The loudest cat in all of Rajasthan 😂 Cleo has something to say about absolutely everything #SiameseCat #JaipurPets"
    ]
  },
  {
    full_name: "Aditya Reddy", username: "adi_macaw", city: "Hyderabad", state: "Telangana", pin_code: "500081",
    bio: "Macaw parent 🦜 | Music producer | Hyd",
    pet: { name: "Rio", type: "Avian", species: "Macaw (Blue-and-Gold)", gender: "Male", age: 6, emoji: "🦜" },
    posts: [
      "Rio whistling the intro to my latest track better than I wrote it 😭🎵 This bird has an ear for music #MacawLife #HydPets",
      "40 years of friendship in the making 🦜💛 Blue and gold macaws live long and Rio and I are going to grow old together"
    ]
  },
  {
    full_name: "Sunita Bose", username: "sunita_guinea", city: "Kolkata", state: "West Bengal", pin_code: "700001",
    bio: "Guinea pig mama x3 🐾 | Teacher | Kolkata",
    pet: { name: "Chhotu", type: "Small Pet", species: "Guinea Pig", gender: "Male", age: 1, emoji: "🐇" },
    posts: [
      "Chhotu found the vegetable drawer today and the wheeks of joy were heard across the entire flat 🥕🎉 #GuineaPig #KolkataPets",
      "Three guinea pigs and they all need attention at the exact same moment 😂 Chhotu, Momo and Laddoo ruling my life"
    ]
  },
  {
    full_name: "Kartik Pandey", username: "kartik_pomeranian", city: "Lucknow", state: "Uttar Pradesh", pin_code: "226001",
    bio: "Pom parent 🐕 | CA | Lucknow",
    pet: { name: "Fluffy", type: "Canine", species: "Pomeranian", gender: "Female", age: 2, emoji: "🐕" },
    posts: [
      "Fluffy in her winter sweater and she KNOWS she looks adorable 🧣🐾 The attitude that comes with it is unmatched #Pomeranian",
      "2kg of pure chaos and I would not trade her for anything in this world 🧡 Fluffy's first Diwali with us ✨ #LucknowPets"
    ]
  },
  {
    full_name: "Divya Krishnan", username: "divya_aqua", city: "Bengaluru", state: "Karnataka", pin_code: "560034",
    bio: "Discus fish keeper 🐠 | Biologist | Blr",
    pet: { name: "Disco", type: "Aquatic", species: "Discus", gender: "Male", age: 2, emoji: "🐠" },
    posts: [
      "Disco's colours after the water change are absolutely unreal 🌈🐠 Discus fish are the most rewarding and most demanding pets",
      "Tank temperature at 29°C, pH 6.5, parameters perfect 🧪 Happy Disco is the best kind of Disco #DiscusFish #BangalorePets"
    ]
  },
  {
    full_name: "Manish Agarwal", username: "manish_beagle", city: "Ahmedabad", state: "Gujarat", pin_code: "380001",
    bio: "Beagle dad 🐕 | Foodie | Ahmedabad",
    pet: { name: "Sherlock", type: "Canine", species: "Beagle", gender: "Male", age: 3, emoji: "🐕" },
    posts: [
      "Sherlock sniffed out my hidden birthday cake from behind two closed doors 😂 The nose knows everything #BeagleDad #Ahmedabad",
      "Festival season and Sherlock gets a special treat 🪔🐾 Diwali is his favourite time of year because the whole family is home"
    ]
  },
  {
    full_name: "Pooja Nambiar", username: "pooja_tortoise", city: "Thiruvananthapuram", state: "Kerala", pin_code: "695001",
    bio: "Tortoise parent 🐢 | Environmentalist | TVM",
    pet: { name: "Kachua", type: "Reptile", species: "Indian Star Tortoise", gender: "Female", age: 8, emoji: "🦎" },
    posts: [
      "Kachua's morning garden walk 🌿🐢 She has the same route every single day and will not be redirected under any circumstances",
      "8 years together and she still surprises me 🌟 Indian Star Tortoises are the most peaceful pets #Tortoise #KeralaPets"
    ]
  },
  {
    full_name: "Amit Chatterjee", username: "amit_shihtzudad", city: "Kolkata", state: "West Bengal", pin_code: "700019",
    bio: "Shih Tzu dad 🐕 | Banker | Kolkata",
    pet: { name: "Momo", type: "Canine", species: "Shih Tzu", gender: "Male", age: 4, emoji: "🐕" },
    posts: [
      "Momo after his grooming session looking like absolute royalty 👑🐕 He knows it too. The strut is real #ShihTzu #KolkataDogs",
      "Durga Puja with Momo 🪷 He wore his little kurta and got more photos taken than anyone in the family 😂"
    ]
  },
  {
    full_name: "Lakshmi Subramanian", username: "lakshmi_bengalcat", city: "Chennai", state: "Tamil Nadu", pin_code: "600017",
    bio: "Bengal cat mom 🐈 | UX designer | Chennai",
    pet: { name: "Tiger", type: "Feline", species: "Bengal", gender: "Male", age: 2, emoji: "🐈" },
    posts: [
      "Tiger doing his daily wall-climbing routine 🐆 Bengal cats are basically small leopards and I signed up for this willingly #BengalCat #ChennaiCats",
      "The markings on this boy 😍 Every visitor asks if he's actually a wild cat. Just a very dramatic domestic one I promise"
    ]
  },
  {
    full_name: "Rajesh Pillai", username: "rajesh_budgie", city: "Kochi", state: "Kerala", pin_code: "682016",
    bio: "Budgie family x4 🦜 | Retired | Kochi",
    pet: { name: "Mithu", type: "Avian", species: "Budgerigar (Budgie)", gender: "Male", age: 3, emoji: "🦜" },
    posts: [
      "Mithu learned a new Malayalam song this week and sings it on loop from 6AM 😂🎵 The neighbours have questions #BudgieMom",
      "Four budgies and the noise level in this house is incomprehensible but I would not change it 🌈🦜 Mithu, Chintu, Raju, Pinki"
    ]
  }
]

const PEXELS_QUERIES: Record<string, string[]> = {
  'Canine': ['labrador dog india', 'golden retriever pet', 'german shepherd dog', 'cute dog india', 'indie dog street india', 'beagle dog cute', 'pomeranian fluffy dog', 'shih tzu groomed'],
  'Feline': ['persian cat india', 'siamese cat', 'bengal cat', 'cute cat india', 'kitten playing'],
  'Avian': ['african grey parrot', 'budgerigar colorful', 'macaw parrot blue', 'indian ringneck parrot', 'cockatiel bird'],
  'Aquatic': ['betta fish colorful', 'koi fish pond', 'discus fish aquarium', 'goldfish aquarium', 'planted aquarium fish'],
  'Reptile': ['bearded dragon pet', 'tortoise garden', 'leopard gecko', 'corn snake pet'],
  'Small Pet': ['guinea pig cute', 'holland lop rabbit', 'hamster pet', 'bunny rabbit']
}

const SEED_COMMENTS = [
  "So cute! 🐾 My pet does the exact same thing",
  "What a beautiful animal! 😍",
  "This made my day ❤️",
  "Adorable! How old is {petName}?",
  "The cutest thing I have seen all week 🥺",
  "Goals 🙌 Living for these updates!",
  "My heart 💕 Petosauras needs more of this",
  "This is everything ✨",
  "Aww this is too precious 🥰",
  "What breed is {petName}? Asking for a friend 😄",
  "Following for more {petName} content 🐾",
  "{petName} is living the best life fr 🌟"
]

async function fetchPexelsImage(query: string, pexelsKey: string): Promise<string> {
  try {
    const page = Math.floor(Math.random() * 5) + 1
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&page=${page}`,
      { headers: { Authorization: pexelsKey } }
    )
    const data = await res.json()
    if (data.photos?.length > 0) {
      const random = Math.floor(Math.random() * data.photos.length)
      return data.photos[random].src.large
    }
  } catch (e) {
    console.error('Pexels fetch error:', e)
  }
  return 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )
    const PEXELS_KEY = Deno.env.get('PEXELS_API_KEY')!

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !caller || caller.email !== 'petosauras@gmail.com') {
      return new Response(JSON.stringify({ error: 'Forbidden: admin only' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Check action
    let body: any = {}
    try { body = await req.json() } catch {}
    const action = body.action || 'seed'

    // DELETE action
    if (action === 'delete') {
      // Get all seed user IDs
      const { data: seedProfiles } = await supabaseAdmin
        .from('profiles').select('id').eq('is_seed_user', true)
      const seedUserIds = (seedProfiles || []).map((p: any) => p.id)

      if (seedUserIds.length > 0) {
        // Delete in order: comments, follows, posts, pets, profiles, auth users
        await supabaseAdmin.from('post_comments').delete().in('user_id', seedUserIds)
        await supabaseAdmin.from('post_likes').delete().in('user_id', seedUserIds)
        await supabaseAdmin.from('saved_posts').delete().in('user_id', seedUserIds)
        await supabaseAdmin.from('follows').delete().in('follower_id', seedUserIds)
        await supabaseAdmin.from('follows').delete().in('following_id', seedUserIds)
        await supabaseAdmin.from('stories').delete().in('user_id', seedUserIds)
        // Delete seed posts (by is_seed_post flag)
        await supabaseAdmin.from('posts').delete().eq('is_seed_post', true)
        await supabaseAdmin.from('pets').delete().in('owner_id', seedUserIds)
        await supabaseAdmin.from('profiles').delete().in('id', seedUserIds)

        // Delete auth users
        for (const uid of seedUserIds) {
          await supabaseAdmin.auth.admin.deleteUser(uid)
        }
      }

      return new Response(JSON.stringify({
        success: true, deleted: seedUserIds.length,
        message: `Deleted ${seedUserIds.length} seed users and all related data`
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // STATUS action
    if (action === 'status') {
      const { count: userCount } = await supabaseAdmin
        .from('profiles').select('*', { count: 'exact', head: true }).eq('is_seed_user', true)
      const { count: postCount } = await supabaseAdmin
        .from('posts').select('*', { count: 'exact', head: true }).eq('is_seed_post', true)
      return new Response(JSON.stringify({
        seed_users: userCount || 0, seed_posts: postCount || 0
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // SEED action
    let usersCreated = 0
    let postsCreated = 0
    let skipped = 0
    const createdUserIds: string[] = []
    const userPetNames: Record<string, string> = {}

    for (const user of DUMMY_USERS) {
      const email = `${user.username}@petosauras.seed`

      // 1. Create auth user
      const { data: authUser, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { full_name: user.full_name }
      })

      if (error || !authUser?.user) {
        console.log(`Skipping ${user.username}: ${error?.message || 'unknown error'}`)
        skipped++
        continue
      }

      const userId = authUser.user.id
      createdUserIds.push(userId)
      userPetNames[userId] = user.pet.name

      // 2. Update profile (handle_new_user trigger creates it)
      await supabaseAdmin.from('profiles').update({
        full_name: user.full_name,
        username: user.username,
        bio: user.bio,
        city: user.city,
        state: user.state,
        pin_code: user.pin_code,
        is_seed_user: true,
        email,
        pet_parent_since: 2022
      }).eq('id', userId)

      // 3. Create pet
      const { data: petData } = await supabaseAdmin.from('pets').insert({
        owner_id: userId,
        name: user.pet.name,
        pet_type: user.pet.type,
        species: user.pet.species,
        gender: user.pet.gender,
        age_years: user.pet.age,
        avatar_emoji: user.pet.emoji,
        is_primary: true
      }).select('id').single()

      const petId = petData?.id

      // 4. Create posts
      const queries = PEXELS_QUERIES[user.pet.type] || PEXELS_QUERIES['Canine']
      for (const caption of user.posts) {
        const query = queries[Math.floor(Math.random() * queries.length)]
        const imageUrl = await fetchPexelsImage(query, PEXELS_KEY)

        const daysAgo = Math.floor(Math.random() * 30)
        const hoursAgo = Math.floor(Math.random() * 24)
        const createdAt = new Date()
        createdAt.setDate(createdAt.getDate() - daysAgo)
        createdAt.setHours(createdAt.getHours() - hoursAgo)

        const likeCount = Math.floor(Math.random() * 490) + 10
        const commentCount = Math.floor(Math.random() * 48) + 2
        const hashtags = caption.match(/#\w+/g) || []

        await supabaseAdmin.from('posts').insert({
          user_id: userId,
          pet_id: petId,
          media_url: imageUrl,
          media_type: 'image',
          caption,
          hashtags,
          ai_validated: true,
          like_count: likeCount,
          comment_count: commentCount,
          is_seed_post: true,
          created_at: createdAt.toISOString()
        })
        postsCreated++
      }

      usersCreated++
    }

    // 5. Cross-follows
    if (createdUserIds.length > 1) {
      for (const userId of createdUserIds) {
        const others = createdUserIds.filter(id => id !== userId)
        const shuffled = others.sort(() => Math.random() - 0.5)
        const followCount = Math.min(Math.floor(Math.random() * 6) + 5, shuffled.length)

        for (let i = 0; i < followCount; i++) {
          await supabaseAdmin.from('follows').insert({
            follower_id: userId,
            following_id: shuffled[i]
          })
        }

        // Update counts
        await supabaseAdmin.from('profiles').update({
          following_count: followCount
        }).eq('id', userId)
      }

      // Update follower counts
      for (const userId of createdUserIds) {
        const { count } = await supabaseAdmin
          .from('follows').select('*', { count: 'exact', head: true }).eq('following_id', userId)
        await supabaseAdmin.from('profiles').update({
          follower_count: count || 0
        }).eq('id', userId)
      }
    }

    // 6. Seed comments on posts
    if (createdUserIds.length > 1) {
      const { data: seedPosts } = await supabaseAdmin
        .from('posts').select('id, user_id, pet_id, created_at').eq('is_seed_post', true)

      for (const post of (seedPosts || [])) {
        const commentersPool = createdUserIds.filter(id => id !== post.user_id)
        const numComments = Math.floor(Math.random() * 3) + 2
        const postDate = new Date(post.created_at)
        const petName = userPetNames[post.user_id] || 'your pet'

        for (let i = 0; i < numComments && i < commentersPool.length; i++) {
          const template = SEED_COMMENTS[Math.floor(Math.random() * SEED_COMMENTS.length)]
          const content = template.replace(/\{petName\}/g, petName)
          const commentDate = new Date(postDate.getTime() + Math.random() * 86400000 * 3)

          await supabaseAdmin.from('post_comments').insert({
            post_id: post.id,
            user_id: commentersPool[Math.floor(Math.random() * commentersPool.length)],
            content,
            created_at: commentDate.toISOString()
          })
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      users_created: usersCreated,
      posts_created: postsCreated,
      skipped,
      message: `Seed data created: ${usersCreated} users, ${postsCreated} posts`
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('Seed error:', err)
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
