import { Link } from "react-router-dom";
import SEO, { SITE } from "@/components/SEO";
import { trackCta, type CtaName } from "@/lib/analytics";

export interface SeoLandingProps {
  slug: string; // path without leading slash
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: { heading: string; body: string }[];
  breadcrumbLabel: string;
}

const RELATED: { to: string; label: string; cta?: CtaName }[] = [
  { to: "/vet-near-me", label: "Find a Vet Near Me", cta: "find_vet_near_me" },
  { to: "/pet-digilocker", label: "Open Pet DigiLocker", cta: "open_digilocker" },
  { to: "/pet-budget-calculator", label: "Calculate Pet Budget", cta: "calculate_budget" },
  { to: "/community", label: "Join the Pet Community", cta: "join_community" },
  { to: "/dog-care", label: "Dog Care Guide" },
  { to: "/cat-care", label: "Cat Care Guide" },
  { to: "/fish-care", label: "Fish Care Guide" },
  { to: "/bird-care", label: "Bird Care Guide" },
  { to: "/reptile-care", label: "Reptile Care Guide" },
];

const PublicSeoPage = ({
  slug,
  title,
  description,
  h1,
  intro,
  sections,
  breadcrumbLabel,
}: SeoLandingProps) => {
  const url = `${SITE}/${slug}`;
  const related = RELATED.filter((r) => r.to !== `/${slug}`).slice(0, 5);

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE + "/" },
      { "@type": "ListItem", position: 2, name: breadcrumbLabel, item: url },
    ],
  };

  return (
    <>
      <SEO
        title={title}
        description={description}
        canonical={`/${slug}`}
        jsonLd={breadcrumb}
      />
      <main className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border">
          <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
            <Link to="/" className="font-heading font-bold text-primary text-lg">
              Petosauras
            </Link>
            <Link
              to="/feeds"
              onClick={() => trackCta("join_petosauras", { from: slug })}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
            >
              Join Petosauras
            </Link>
          </div>
        </header>

        <article className="max-w-3xl mx-auto px-5 py-8">
          <nav aria-label="Breadcrumb" className="text-sm text-muted-foreground mb-3">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <span>{breadcrumbLabel}</span>
          </nav>

          <h1 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">
            {h1}
          </h1>
          <p className="text-base md:text-lg text-foreground/80 mb-8">{intro}</p>

          {sections.map((s) => (
            <section key={s.heading} className="mb-6">
              <h2 className="text-xl md:text-2xl font-heading font-semibold mb-2">
                {s.heading}
              </h2>
              <p className="text-foreground/80 whitespace-pre-line">{s.body}</p>
            </section>
          ))}

          <section className="mt-10 p-5 rounded-2xl bg-card border border-border">
            <h2 className="text-lg font-heading font-semibold mb-3">
              Explore more on Petosauras
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {related.map((r) => (
                <li key={r.to}>
                  <Link
                    to={r.to}
                    onClick={() => r.cta && trackCta(r.cta, { from: slug })}
                    className="block px-4 py-2 rounded-lg bg-background hover:bg-muted text-primary font-medium"
                  >
                    {r.label} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <div className="mt-10 text-center">
            <Link
              to="/feeds"
              onClick={() => trackCta("join_petosauras", { from: slug })}
              className="inline-block px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold"
            >
              Join Petosauras free
            </Link>
          </div>
        </article>

        <footer className="border-t border-border mt-10">
          <div className="max-w-3xl mx-auto px-5 py-6 text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2">
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

export default PublicSeoPage;
