import PublicSeoPage from "@/components/seo/PublicSeoPage";

type CareDef = {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
  breadcrumbLabel: string;
};

export const CARE_PAGES: Record<string, CareDef> = {
  "dog-care": {
    slug: "dog-care",
    title: "Dog Care Guide India | Petosauras",
    description: "Complete dog care guide for Indian pet parents — diet, vaccination, grooming, training and finding trusted vets on Petosauras.",
    h1: "Dog Care Guide for Indian Pet Parents",
    breadcrumbLabel: "Dog Care",
    intro: "Everything you need to raise a happy, healthy dog in India — from puppy nutrition to vet visits and vaccination schedules.",
    sections: [
      { heading: "Diet & Nutrition", body: "Choose age-appropriate food, ensure clean water, and avoid common toxic foods like chocolate, grapes and onions. Consult a vet for breed-specific diets." },
      { heading: "Vaccination Schedule", body: "Core vaccines include DHPP, Rabies and Leptospirosis. Maintain digital vaccination records in the Pet DigiLocker so you never miss a booster." },
      { heading: "Grooming & Exercise", body: "Daily walks, regular brushing and monthly baths keep most Indian dog breeds healthy. Heat-sensitive breeds need indoor exercise during summer afternoons." },
      { heading: "Finding a Vet", body: "Use Vet Near Me on Petosauras to find verified veterinary clinics in your city for routine checkups and emergencies." },
    ],
  },
  "cat-care": {
    slug: "cat-care",
    title: "Cat Care Guide India | Petosauras",
    description: "Cat care guide for Indian pet parents — feeding, litter training, vaccinations, and finding cat-friendly vets on Petosauras.",
    h1: "Cat Care Guide for Indian Pet Parents",
    breadcrumbLabel: "Cat Care",
    intro: "Practical care tips for raising indoor and free-roaming cats in India, with vet-verified vaccination guidance.",
    sections: [
      { heading: "Feeding", body: "Cats are obligate carnivores. Feed high-protein wet or dry food and always provide fresh water. Avoid milk for adult cats." },
      { heading: "Litter Training", body: "Most kittens train themselves with a clean, accessible litter box. Scoop daily and change litter weekly." },
      { heading: "Vaccinations", body: "Core feline vaccines include FVRCP and Rabies. Store vaccination cards in the Pet DigiLocker." },
      { heading: "Health Checks", body: "Annual vet visits help catch issues early. Find cat-friendly vets through Vet Near Me." },
    ],
  },
  "fish-care": {
    slug: "fish-care",
    title: "Aquarium Fish Care Guide India | Petosauras",
    description: "Aquarium care guide for Indian fish keepers — tank cycling, water quality, feeding and species compatibility on Petosauras.",
    h1: "Aquarium Fish Care Guide",
    breadcrumbLabel: "Fish Care",
    intro: "Keep freshwater and tropical fish thriving with the right tank setup, filtration and feeding routine.",
    sections: [
      { heading: "Tank Setup", body: "Cycle a new tank for 4–6 weeks before adding fish. Maintain stable temperature, pH and ammonia levels." },
      { heading: "Feeding", body: "Feed small portions 1–2 times daily. Overfeeding pollutes water quickly." },
      { heading: "Species Compatibility", body: "Research community vs. solitary species. Bettas, for example, should not be housed with fin nippers." },
      { heading: "Health & Records", body: "Track water tests and treatments in the Pet DigiLocker for long-term tank health." },
    ],
  },
  "bird-care": {
    slug: "bird-care",
    title: "Bird Pet Care Guide India | Petosauras",
    description: "Bird care guide for Indian pet parents — diet, cage size, enrichment and avian vet checkups on Petosauras.",
    h1: "Bird Care Guide for Indian Pet Parents",
    breadcrumbLabel: "Bird Care",
    intro: "From budgies to cockatiels, give pet birds a safe, stimulating home with the right diet and routine vet care.",
    sections: [
      { heading: "Cage & Environment", body: "Provide the largest cage you can — birds need to fully extend their wings. Keep away from kitchen fumes and direct sun." },
      { heading: "Diet", body: "A pellet-based diet with fresh fruits and vegetables outperforms seed-only diets. Avoid avocado and chocolate." },
      { heading: "Enrichment", body: "Daily out-of-cage time, foraging toys and social interaction prevent stress behaviours." },
      { heading: "Vet Care", body: "Find avian-experienced vets via Vet Near Me on Petosauras." },
    ],
  },
  "reptile-care": {
    slug: "reptile-care",
    title: "Reptile Pet Care Guide India | Petosauras",
    description: "Reptile care guide — heat, humidity, UVB, feeding and exotic vet support for Indian reptile keepers on Petosauras.",
    h1: "Reptile Care Guide for Indian Pet Parents",
    breadcrumbLabel: "Reptile Care",
    intro: "Reptiles need precise temperature, humidity and lighting. Get the basics right for healthy turtles, geckos and more.",
    sections: [
      { heading: "Habitat", body: "Provide a temperature gradient with a basking spot and cooler zone. Use species-appropriate substrate." },
      { heading: "Lighting", body: "Most diurnal reptiles require UVB lighting for calcium metabolism. Replace UVB bulbs every 6–12 months." },
      { heading: "Diet", body: "Feed species-appropriate prey or greens. Dust with calcium and vitamin D3 as recommended." },
      { heading: "Vet Care", body: "Locate exotic-friendly vets through Vet Near Me on Petosauras." },
    ],
  },
};

export const CarePage = ({ slug }: { slug: keyof typeof CARE_PAGES }) => {
  const def = CARE_PAGES[slug];
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: def.h1,
    description: def.description,
    mainEntityOfPage: `https://petsocial.lovable.app/${def.slug}`,
    author: { "@type": "Organization", name: "Petosauras" },
    publisher: {
      "@type": "Organization",
      name: "Petosauras",
      logo: {
        "@type": "ImageObject",
        url: "https://petsocial.lovable.app/petosauras-logo-new.png",
      },
    },
    about: def.breadcrumbLabel,
  };
  return <PublicSeoPage {...def} jsonLd={articleJsonLd} />;
};

export default CarePage;
