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
    { q: "What is Petosauras?", a: "A social platform for pet lovers to share moments, discover pet-friendly places, and connect with other pet parents." },
    { q: "Is Petosauras free to use?", a: "Yes, core features are free. Premium features may be introduced later." },
    { q: "Can I list my pet-friendly business?", a: "Yes, businesses can onboard and showcase their services." },
    { q: "What type of content can I post?", a: "Photos, videos, reels of pets, experiences, and recommendations." },
    { q: "Is my data safe?", a: "User data is protected and not shared without consent." },
    { q: "Can I report inappropriate content?", a: "Yes, reporting tools are available on each post." },
    { q: "Does Petosauras support adoption?", a: "Yes." },
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
    description="Petosauras is a passion-driven initiative by Ambar Utkarsh — a unified platform where pet parents share moments, discover pet-friendly places and build community."
    h1="About Petosauras"
    breadcrumbLabel="About Us"
    intro="Petosauras is a passion-driven initiative by Ambar Utkarsh, a seasoned product leader with over a decade of experience building scalable digital platforms."
    sections={[
      { heading: "The story", body: "As a pet parent himself, Ambar noticed the lack of a unified platform where pet lovers could share experiences, discover pet-friendly places, and build a community." },
      { heading: "Our vision", body: "Petosauras aims to bridge that gap by combining social interaction, discovery, and utility into a single ecosystem for pet owners." },
      { heading: "Why we build", body: "This project also serves as a hands-on exploration of modern product building, full-stack development, and user-centric design." },
    ]}
  />
);

export const ContactLanding = () => (
  <PublicSeoPage
    slug="contact-us"
    title="Contact Petosauras | Get in Touch"
    description="Contact Petosauras for support, partnerships or feedback. Email petosauras@gmail.com."
    h1="Contact Us"
    breadcrumbLabel="Contact Us"
    intro="We'd love to hear from you."
    sections={[
      { heading: "Email", body: "petosauras@gmail.com" },
    ]}
  />
);

export const PrivacyLanding = () => (
  <PublicSeoPage
    slug="privacy-policy"
    title="Privacy Policy | Petosauras"
    description="How Petosauras handles advertising, sponsored listings and user data."
    h1="Privacy Policy"
    breadcrumbLabel="Privacy Policy"
    intro="Your privacy matters. This policy explains how advertising and data are handled on Petosauras."
    sections={[
      { heading: "Advertising", body: "Petosauras may display advertisements and sponsored listings." },
      { heading: "Sponsored visibility", body: "Businesses may pay for enhanced visibility on the platform." },
      { heading: "Your data", body: "We do not sell personal user data to advertisers." },
    ]}
  />
);

export const TermsLanding = () => (
  <PublicSeoPage
    slug="terms-of-service"
    title="Terms of Service | Petosauras"
    description="The terms governing your use of Petosauras — eligibility, content, pet records, discovery, AI features, liability and more."
    h1="Terms of Service"
    breadcrumbLabel="Terms of Service"
    intro={`Effective Date: 3 May 2026\nWebsite: https://petosauras.com\nContact: petosauras@gmail.com\n\nWelcome to Petosauras. These Terms of Service govern your access to and use of the Petosauras website, mobile web experience, features, content, community tools, pet records, discovery services, and related services. By accessing or using Petosauras, you agree to these Terms. If you do not agree, please do not use the platform.`}
    sections={[
      { heading: "1. About Petosauras", body: "Petosauras is a digital platform created for pet parents and pet lovers. The platform may allow users to:\n• Create user and pet profiles.\n• Share photos, videos, stories, posts, comments, and community updates.\n• Store and manage pet-related records such as vaccination cards, prescriptions, bills, and health logs.\n• Discover pet-related services such as veterinary clinics, groomers, walkers, pet cafés, parks, adoption posts, and other pet-care resources.\n• Access pet-related information, interesting facts, news, budget estimates, and care-related suggestions.\n\nPetosauras is intended to support pet owners with community, information, and convenience tools. It is not a substitute for professional veterinary, legal, medical, financial, or emergency advice." },
      { heading: "2. Eligibility", body: "You must be at least 18 years old to create an account on Petosauras. By using Petosauras, you confirm that you are legally capable of entering into these Terms, the information you provide is accurate, you will use the platform only for lawful and responsible purposes, and you are responsible for activity under your account. If a minor accesses Petosauras, it must be under the supervision of a parent or legal guardian." },
      { heading: "3. User Account and Registration", body: "To access certain features, you may need to register using email, Google login, or another supported login method. You agree to provide accurate registration information, keep your login credentials secure, not create fake or impersonating accounts, and notify us if you suspect unauthorized use of your account. Petosauras may suspend or restrict your account if it has been misused, compromised, or used in violation of these Terms." },
      { heading: "4. User Profiles and Pet Profiles", body: "Petosauras may allow you to create profiles for yourself and your pets, including pet name, species, breed, age, health records, photos, vaccination information, food and weight logs and other related information. You are responsible for ensuring that the information you upload is accurate, lawful, and does not infringe anyone else's rights. Petosauras does not independently verify every pet profile, document, post, image, service listing, or user-submitted claim." },
      { heading: "5. User-Generated Content", body: "You retain ownership of the content you create and upload. By posting content on Petosauras, you grant Petosauras a worldwide, non-exclusive, royalty-free, transferable, sublicensable license to host, store, display, reproduce, modify, adapt, publish, distribute, and use such content for operating, improving, promoting, and displaying the platform. This license ends when your content is deleted, except where continued use is necessary for backups, legal compliance, safety, dispute resolution, or where content has already been shared, cached, or used in aggregated form." },
      { heading: "6. Content Rules", body: "You agree not to post content that is illegal, abusive, harassing, defamatory, obscene or hateful; promotes animal cruelty, abuse, neglect, illegal breeding, illegal animal trade or harm to animals; contains graphic violence or explicit material; infringes copyrights, trademarks or privacy rights; contains spam, scams or fraudulent offers; contains malware or harmful code; misrepresents your identity or qualifications; shares another person's private information without consent; or provides unsafe pet-care advice. Petosauras may remove, restrict, or moderate content at its discretion." },
      { heading: "7. Pet Health, Veterinary, and Care Information", body: "Petosauras may provide pet-care content, health tracking tools, vaccination reminders, budget estimates, pet facts, AI-generated suggestions and community discussions. This information is provided for general awareness only and should not be treated as professional veterinary advice. Always consult a qualified veterinarian for diagnosis, treatment, vaccination schedules, medicines, diet, emergencies, behavioural concerns or legal questions involving animals. Petosauras is not responsible for harm caused by reliance on general or community content." },
      { heading: "8. Emergency Disclaimer", body: "Petosauras is not an emergency veterinary service. If your pet is injured, poisoned, unwell, bleeding, unconscious, unable to breathe, showing seizures, or facing any urgent medical condition, contact a qualified veterinarian or emergency pet clinic immediately. Do not rely on Petosauras, community posts, comments, AI suggestions, or online information during emergencies." },
      { heading: "9. Pet DigiLocker and Document Uploads", body: "Petosauras may allow users to upload and store pet-related documents such as vaccination cards, prescriptions, hospital bills, insurance documents and lab reports. You are responsible for uploading correct and lawful documents, ensuring you have the right to store and share them, avoiding unnecessary sensitive personal information, and maintaining your own backup copies. Petosauras does not guarantee that uploaded documents will be accepted by vets, insurers, government bodies, housing societies or travel authorities. File type, size, storage and retention limits may apply." },
      { heading: "10. Vet Near Me, Groomer, Walker, Breeder, and Third-Party Discovery", body: "Petosauras may help users discover nearby veterinarians, clinics, walkers, groomers, breeders, pet shops, cafés, parks, adoption posts, NGOs and other third-party services. These results may be based on user inputs, location, third-party APIs or public data. Petosauras does not guarantee accuracy of listings, availability, pricing, qualifications, quality, safety, reviews or legitimacy of providers. Verify any service provider independently. Any transaction, appointment, visit, consultation, adoption, mating, purchase or service engagement between you and a third party is solely between you and that third party." },
      { heading: "11. Community Posts and Service Requests", body: "Petosauras may allow users to post requirements for walkers, groomers, vets, adoption, mating, pet services, urgent concerns or general discussions. You agree to post accurate and lawful information and not use the platform for illegal animal trade, unethical breeding, cruelty or prohibited activities. You will not mislead users regarding identity, services, pricing, location or qualifications. Use caution before meeting or transacting with any user. Petosauras is not responsible for disputes, payments, losses, fraud, injury or damages arising between users." },
      { heading: "12. AI-Generated Content and Automated Features", body: "Petosauras may use AI or automated tools for image validation, pet facts, budget estimates, pet-care suggestions, content moderation, breed/species validation or recommendations. AI-generated outputs may be incomplete, inaccurate, outdated or unsuitable for your specific situation and should not be relied on as professional advice. Petosauras may modify, disable or improve AI-based features at any time." },
      { heading: "13. Location-Based Features", body: "Some features may request access to your device location to show nearby vets, pet cafés, parks, services or local information. You may decline location access; some features may not work fully and you may need to manually enter your city, state or PIN code. Location-based results may not always be accurate or complete." },
      { heading: "14. Prohibited Uses", body: "You must not use Petosauras to violate any law or third-party right; promote animal cruelty, illegal breeding or wildlife trade; harass, abuse, impersonate, threaten or defame another user; upload fake or stolen content; scrape, crawl, copy, reverse engineer or misuse the platform; attempt unauthorized access; upload viruses, malware or spam; run commercial promotions without permission; collect user data without consent; or misuse Petosauras for fraud, scams or phishing." },
      { heading: "15. Intellectual Property", body: "The Petosauras name, logo, design, user interface, features, software, content structure, branding, graphics and platform elements are owned by Petosauras or its licensors. You may not copy, reproduce, modify, distribute, sell, lease or exploit Petosauras intellectual property without written permission. User-generated content remains owned by the respective user, subject to the licence granted under these Terms." },
      { heading: "16. Third-Party Links and Services", body: "Petosauras may include links, embeds, APIs, maps, search results, videos, articles, service listings, payment links or external websites operated by third parties. We are not responsible for third-party websites, services, content, policies, pricing, availability or actions. Your use of third-party services may be governed by their own terms and privacy policies." },
      { heading: "17. Privacy", body: "Your use of Petosauras is also governed by our Privacy Policy, which explains how we collect, use, store and protect your information. Please read the Privacy Policy before using the platform." },
      { heading: "18. Account Suspension or Termination", body: "Petosauras may suspend, restrict or terminate your account if you violate these Terms, misuse the platform, post harmful content, create risk for users, pets, third parties or Petosauras, or where we are required to do so by law. You may stop using Petosauras at any time." },
      { heading: "19. Platform Availability", body: "Petosauras is provided on an 'as is' and 'as available' basis. We do not guarantee that the platform will always be available, that features will be error-free, that content will always be accurate, that data will never be lost, that third-party APIs will always work, or that the platform will meet every user's expectations. We may modify, suspend, discontinue or restrict any feature at any time." },
      { heading: "20. Limitation of Liability", body: "To the maximum extent permitted by law, Petosauras and its owners, operators, affiliates, partners and service providers will not be liable for any indirect, incidental, special, consequential, punitive or exemplary damages arising from your use of the platform. This includes loss of data or content, loss of business, pet injury or illness, reliance on health, care, AI or community information, third-party service disputes, user interactions, inaccurate listings, unauthorized account access, or platform downtime. Your use of Petosauras is at your own risk." },
      { heading: "21. Indemnity", body: "You agree to indemnify and hold harmless Petosauras, its owners, operators, affiliates and service providers from any claims, losses, damages, liabilities, costs or expenses arising from your use of the platform, your content, your violation of these Terms or any law or third-party right, your interactions or transactions with other users or third parties, or any harm caused by information, documents, posts or services you provide through Petosauras." },
      { heading: "22. Changes to These Terms", body: "We may update these Terms from time to time. When we do, we may update the 'Effective Date' at the top of this page. Continued use of Petosauras after changes are posted means you accept the updated Terms." },
      { heading: "23. Governing Law and Jurisdiction", body: "These Terms shall be governed by the laws of India. Any disputes arising from or relating to these Terms or the use of Petosauras shall be subject to the jurisdiction of the courts located in Chennai, Tamil Nadu, India, unless applicable law requires otherwise." },
      { heading: "24. Contact Us", body: "For questions, concerns, support or legal notices, contact:\nPetosauras\nEmail: petosauras@gmail.com\nWebsite: https://petosauras.com" },
    ]}
  />
);

export const FeaturesLanding = () => (
  <PublicSeoPage
    slug="features"
    title="Petosauras Features | Feed, Discovery, Profiles & More"
    description="Explore Petosauras features — social feed, reels, pet-friendly discovery, profiles, business listings, engagement tools and what's coming next."
    h1="Detailed Features"
    breadcrumbLabel="Features"
    intro="A complete overview of what you can do on Petosauras today, and what's coming next."
    sections={[
      { heading: "1. Feed / Social", body: "• Post photos and videos\n• Reel-style fullscreen viewer\n• Like, comment and share" },
      { heading: "2. Discovery", body: "• Pet-friendly places\n• Filters: location, pet menu, off-leash, ratings" },
      { heading: "3. Profile", body: "• Pet and owner identity\n• Activity history" },
      { heading: "4. Business Listings (planned)", body: "• Restaurants and cafés\n• Pet services" },
      { heading: "5. Engagement Layer", body: "• Likes\n• Comments\n• Shares" },
      { heading: "6. Future Scope", body: "• Adoption marketplace\n• Vet consultations\n• Pet products" },
    ]}
  />
);
