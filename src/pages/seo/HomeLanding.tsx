import { Link } from "react-router-dom";
import SEO, { SITE } from "@/components/SEO";
import { trackCta } from "@/lib/analytics";

const HomeLanding = () => {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: "Petosauras",
      url: SITE + "/",
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Petosauras",
      url: SITE + "/",
      logo: SITE + "/petosauras-logo-new.png",
    },
  ];

  const ctas: { to: string; label: string; cta: any }[] = [
    { to: "/feeds", label: "Join Petosauras", cta: "join_petosauras" },
    { to: "/vet-near-me", label: "Find Vet Near Me", cta: "find_vet_near_me" },
    { to: "/pet-digilocker", label: "Open Pet DigiLocker", cta: "open_digilocker" },
    { to: "/pet-budget-calculator", label: "Calculate Pet Budget", cta: "calculate_budget" },
    { to: "/community", label: "Join Community", cta: "join_community" },
  ];

  const guides = [
    { to: "/dog-care", label: "Dog Care" },
    { to: "/cat-care", label: "Cat Care" },
    { to: "/fish-care", label: "Fish Care" },
    { to: "/bird-care", label: "Bird Care" },
    { to: "/reptile-care", label: "Reptile Care" },
  ];

  return (
    <>
      <SEO
        title="Petosauras | All-in-One Pet App for Pet Parents in India"
        description="India's all-in-one pet app — share pet moments, track health records, find vets, store vaccination cards, and join the pet community."
        canonical="/"
        jsonLd={jsonLd}
      />
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link to="/" className="font-heading font-bold text-primary text-lg">
              Petosauras
            </Link>
            <Link
              to="/feeds"
              onClick={() => trackCta("join_petosauras", { from: "home" })}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              Open App
            </Link>
          </div>
        </header>

        <section className="max-w-4xl mx-auto px-5 py-10 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-primary mb-4">
            For Every Pet. For Every Moment.
          </h1>
          <p className="text-base md:text-lg text-foreground/80 max-w-2xl mx-auto mb-8">
            India's all-in-one app for pet parents — share moments, track health,
            find vets, store vaccination cards, and join a thriving community of
            dog, cat, fish, bird and reptile lovers.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {ctas.map((c) => (
              <Link
                key={c.to}
                to={c.to}
                onClick={() => trackCta(c.cta, { from: "home_hero" })}
                className="px-5 py-3 rounded-full bg-primary text-primary-foreground font-semibold"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-5 py-6">
          <h2 className="text-2xl font-heading font-semibold mb-4">Pet care guides</h2>
          <ul className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {guides.map((g) => (
              <li key={g.to}>
                <Link
                  to={g.to}
                  className="block p-4 rounded-2xl bg-card border border-border hover:bg-muted text-primary font-medium"
                >
                  {g.label} →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <footer className="border-t border-border mt-10">
          <div className="max-w-4xl mx-auto px-5 py-6 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/about-us" className="hover:underline">About</Link>
            <Link to="/contact-us" className="hover:underline">Contact</Link>
            <Link to="/faq" className="hover:underline">FAQ</Link>
            <Link to="/privacy-policy" className="hover:underline">Privacy</Link>
            <Link to="/terms-of-service" className="hover:underline">Terms</Link>
            <span className="ml-auto">© Petosauras</span>
          </div>
        </footer>
      </main>
    </>
  );
};

export default HomeLanding;
