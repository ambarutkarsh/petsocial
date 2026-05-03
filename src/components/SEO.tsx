import { useEffect } from "react";

interface SEOProps {
  title: string;
  description: string;
  canonical?: string;
  image?: string;
  jsonLd?: object | object[];
}

const SITE = "https://petosauras.com";
const DEFAULT_IMAGE = `${SITE}/petosauras-logo-new.png`;

const setMeta = (selector: string, attr: string, value: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    const [k, v] = selector.replace(/[\[\]"]/g, "").split("=");
    el.setAttribute(k, v);
    document.head.appendChild(el);
  }
  el.setAttribute(attr, value);
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

const SEO = ({ title, description, canonical, image, jsonLd }: SEOProps) => {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "content", description);
    const url = canonical
      ? canonical.startsWith("http")
        ? canonical
        : `${SITE}${canonical}`
      : window.location.href;
    setLink("canonical", url);

    const img = image || DEFAULT_IMAGE;
    setMeta('meta[property="og:title"]', "content", title);
    setMeta('meta[property="og:description"]', "content", description);
    setMeta('meta[property="og:url"]', "content", url);
    setMeta('meta[property="og:image"]', "content", img);
    setMeta('meta[name="twitter:title"]', "content", title);
    setMeta('meta[name="twitter:description"]', "content", description);
    setMeta('meta[name="twitter:image"]', "content", img);

    // JSON-LD: managed via tagged script
    document.head
      .querySelectorAll('script[data-seo-jsonld="true"]')
      .forEach((n) => n.remove());
    if (jsonLd) {
      const arr = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
      arr.forEach((obj) => {
        const s = document.createElement("script");
        s.type = "application/ld+json";
        s.dataset.seoJsonld = "true";
        s.textContent = JSON.stringify(obj);
        document.head.appendChild(s);
      });
    }
  }, [title, description, canonical, image, JSON.stringify(jsonLd)]);

  return null;
};

export default SEO;
export { SITE };
