import PublicSeoPage from "@/components/seo/PublicSeoPage";

export const VetNearMeLanding = () => (
  <PublicSeoPage
    slug="vet-near-me"
    title="Vet Near Me | Find Veterinary Clinics on Petosauras"
    description="Find trusted veterinary clinics near you in India. Petosauras helps pet parents discover vets for routine care, vaccinations and emergencies."
    h1="Find a Vet Near Me"
    breadcrumbLabel="Vet Near Me"
    intro="Discover verified veterinary clinics across Indian cities. Filter by specialisation, distance and availability to find the right vet for your pet."
    sections={[
      { heading: "Why use Petosauras Vet Near Me", body: "Browse vet listings with reviews, contact details and clinic timings — all in one place." },
      { heading: "Emergency vets", body: "When time matters, quickly locate the nearest open clinic and call them directly from the app." },
      { heading: "Routine care", body: "Schedule annual checkups and store every visit in the Pet DigiLocker for a complete health history." },
    ]}
  />
);

export const PetDigiLockerLanding = () => (
  <PublicSeoPage
    slug="pet-digilocker"
    title="Pet DigiLocker | Store Pet Vaccination Cards & Health Records"
    description="Securely store your pet's vaccination cards, prescriptions and health records in Petosauras Pet DigiLocker. Access them anytime, anywhere."
    h1="Pet DigiLocker — Vaccination Cards & Health Records"
    breadcrumbLabel="Pet DigiLocker"
    intro="A secure digital vault for every document your pet needs — vaccinations, prescriptions, microchip certificates and more."
    sections={[
      { heading: "Never lose a vaccination card", body: "Upload, organise and share vaccination cards instantly with vets, boarders or travel authorities." },
      { heading: "All records, one place", body: "Health logs, lab reports and vet visit summaries — searchable and synced across devices." },
      { heading: "Privacy first", body: "Documents are private by default. You decide what to share and with whom." },
    ]}
  />
);

export const BudgetLanding = () => (
  <PublicSeoPage
    slug="pet-budget-calculator"
    title="Pet Budget Calculator India | Estimate Monthly Pet Costs"
    description="Estimate the monthly and yearly cost of raising a pet in India — food, vet visits, grooming and more — with the Petosauras Pet Budget Calculator."
    h1="Pet Budget Calculator for India"
    breadcrumbLabel="Pet Budget Calculator"
    intro="Plan responsibly. Estimate realistic monthly and yearly costs for dogs, cats and other pets across Indian cities."
    sections={[
      { heading: "What it covers", body: "Food, treats, vet visits, vaccinations, grooming, accessories and emergencies." },
      { heading: "City-aware estimates", body: "Costs vary across Indian cities. The calculator adjusts for typical price ranges in metros and tier-2 cities." },
      { heading: "Why it matters", body: "Knowing the true cost upfront helps you commit confidently and avoid surprises later." },
    ]}
  />
);

export const CommunityLanding = () => (
  <PublicSeoPage
    slug="community"
    title="Pet Community India | Connect with Pet Parents on Petosauras"
    description="Join India's friendliest pet community. Share moments, ask questions and meet dog, cat, bird, fish and reptile parents on Petosauras."
    h1="The Petosauras Pet Community"
    breadcrumbLabel="Community"
    intro="A safe space for Indian pet parents to share, learn and connect — across every species."
    sections={[
      { heading: "Share moments", body: "Post photos and short videos of your pets. Get likes, comments and follow other pet parents." },
      { heading: "Ask anything", body: "From feeding doubts to behaviour tips, ask the community and learn from real-life pet parents." },
      { heading: "Find your tribe", body: "Connect with parents of the same breed, species or city." },
    ]}
  />
);

export const PetFactsLanding = () => (
  <PublicSeoPage
    slug="pet-facts"
    title="Pet Facts | Fun & Useful Facts About Pets on Petosauras"
    description="Discover surprising and useful pet facts on Petosauras — covering dogs, cats, fish, birds and reptiles."
    h1="Pet Facts"
    breadcrumbLabel="Pet Facts"
    intro="Bite-sized, vet-checked facts to help you understand your pet better — from sleep cycles to senses."
    sections={[
      { heading: "Dogs", body: "Dogs can learn over 150 words and have a sense of smell up to 100,000 times more powerful than humans." },
      { heading: "Cats", body: "Cats spend 70% of their lives sleeping and use over 100 different vocal sounds." },
      { heading: "Fish, birds & reptiles", body: "Aquatic and exotic pets have unique needs — explore species-specific facts in our care guides." },
    ]}
  />
);

export const FaqLanding = () => {
  const faqs = [
    { q: "Is Petosauras free to use?", a: "Yes. Creating an account, sharing posts and using core features like Vet Near Me and Pet DigiLocker are free." },
    { q: "Which pets does Petosauras support?", a: "Dogs, cats, fish, birds, reptiles and small pets like rabbits and guinea pigs." },
    { q: "How do I find a vet near me?", a: "Open the Vet Near Me page and allow location access to see verified clinics around you." },
    { q: "Where do I store vaccination cards?", a: "Use the Pet DigiLocker to securely upload and organise vaccination cards and health records." },
    { q: "Is my pet's data private?", a: "Yes. You control what you share publicly. Health records in the DigiLocker remain private to you." },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <PublicSeoPage
      slug="faq"
      title="FAQ | Petosauras"
      description="Answers to common questions about Petosauras — pricing, supported pets, vet listings, DigiLocker and privacy."
      h1="Frequently Asked Questions"
      breadcrumbLabel="FAQ"
      intro="Everything pet parents commonly ask about Petosauras."
      sections={faqs.map((f) => ({ heading: f.q, body: f.a }))}
    />
  );
};

export const AboutLanding = () => (
  <PublicSeoPage
    slug="about-us"
    title="About Petosauras | India's All-in-One Pet App"
    description="Petosauras is built for Indian pet parents — connecting community, vets, health records and pet care in one app."
    h1="About Petosauras"
    breadcrumbLabel="About Us"
    intro="Petosauras was founded to make pet parenting easier, kinder and more connected across India."
    sections={[
      { heading: "Our mission", body: "Empower every pet parent in India with the tools, community and care their pet deserves." },
      { heading: "What we offer", body: "Community feed, Vet Near Me, Pet DigiLocker, Budget Calculator and species-specific care guides." },
      { heading: "Built in India", body: "Designed and built by pet lovers for the realities of Indian cities and homes." },
    ]}
  />
);

export const ContactLanding = () => (
  <PublicSeoPage
    slug="contact-us"
    title="Contact Petosauras | Support & Partnerships"
    description="Get in touch with Petosauras for support, partnerships, vet onboarding or media enquiries."
    h1="Contact Petosauras"
    breadcrumbLabel="Contact Us"
    intro="We'd love to hear from you. Reach out for support, partnerships or vet onboarding."
    sections={[
      { heading: "Support", body: "Email support@petosauras.com for help with your account or app issues." },
      { heading: "Vet onboarding", body: "Are you a clinic? Email vets@petosauras.com to get listed on Vet Near Me." },
      { heading: "Partnerships & media", body: "Email hello@petosauras.com for partnerships and press." },
    ]}
  />
);

export const PrivacyLanding = () => (
  <PublicSeoPage
    slug="privacy-policy"
    title="Privacy Policy | Petosauras"
    description="How Petosauras collects, uses and protects your personal and pet data."
    h1="Privacy Policy"
    breadcrumbLabel="Privacy Policy"
    intro="Your privacy matters. This policy explains what we collect, how we use it and the choices you have."
    sections={[
      { heading: "Information we collect", body: "Account details, content you post, and basic device/usage analytics." },
      { heading: "How we use it", body: "To provide the service, personalise your feed, secure your account and improve the product." },
      { heading: "Your choices", body: "You can edit your profile, delete posts and request account deletion at any time." },
    ]}
  />
);

export const TermsLanding = () => (
  <PublicSeoPage
    slug="terms-of-service"
    title="Terms of Service | Petosauras"
    description="The terms governing your use of Petosauras."
    h1="Terms of Service"
    breadcrumbLabel="Terms of Service"
    intro="By using Petosauras you agree to the following terms. Please read them carefully."
    sections={[
      { heading: "Use of the service", body: "Use Petosauras lawfully and respectfully. Don't post harmful, illegal or abusive content." },
      { heading: "Content ownership", body: "You own the content you post. You grant Petosauras a licence to display it within the app." },
      { heading: "Liability", body: "Petosauras provides information and tools, not professional veterinary advice. Always consult a vet." },
    ]}
  />
);
