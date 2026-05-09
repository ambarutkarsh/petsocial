import { useParams, Link, Navigate } from "react-router-dom";
import HubSubLayout from "@/components/HubSubLayout";
import SEO, { SITE } from "@/components/SEO";
import BlogRenderer from "@/components/BlogRenderer";
import BlogCard from "@/components/BlogCard";
import { Clock } from "lucide-react";
import { getBlogBySlug, getCategoryById, getRelatedBlogs, formatDate } from "@/lib/knowledgeBase";

const KnowledgeBlogScreen = () => {
  const { slug } = useParams<{ slug: string }>();
  const blog = slug ? getBlogBySlug(slug) : undefined;

  if (!blog) return <Navigate to="/hub/learn/knowledge-base" replace />;

  const cat = getCategoryById(blog.category);
  const related = getRelatedBlogs(blog, 3);
  const articleBody = blog.content
    .map((b) => ("text" in b ? b.text : "items" in b ? b.items.join(" ") : ""))
    .join("\n\n");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.title,
    description: blog.excerpt,
    image: blog.featuredImage.url,
    datePublished: blog.publishedAt,
    dateModified: blog.updatedAt || blog.publishedAt,
    author: { "@type": "Person", name: blog.author.name },
    publisher: { "@type": "Organization", name: "Petosauras", logo: { "@type": "ImageObject", url: `${SITE}/petosauras-logo-new.png` } },
    mainEntityOfPage: `${SITE}/hub/learn/knowledge-base/${blog.slug}`,
    keywords: blog.seo.keywords?.join(", "),
    articleBody,
  };

  return (
    <HubSubLayout title={blog.title} backFallback="/hub/learn/knowledge-base">
      <SEO
        title={blog.seo.metaTitle || blog.title}
        description={blog.seo.metaDescription || blog.excerpt}
        canonical={`/hub/learn/knowledge-base/${blog.slug}`}
        image={blog.featuredImage.url}
        jsonLd={jsonLd}
      />

      <article>
        <figure className="-mx-1 mb-5 rounded-[18px] overflow-hidden">
          <img
            src={blog.featuredImage.url}
            alt={blog.featuredImage.alt || blog.title}
            className="w-full aspect-video object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
            }}
          />
        </figure>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Link
            to={`/hub/learn/knowledge-base?category=${blog.category}`}
            className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary-dark"
          >
            {cat?.name || blog.category}
          </Link>
          {blog.tags?.slice(0, 4).map((t) => (
            <span key={t} className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              #{t}
            </span>
          ))}
        </div>

        <h1 className="font-heading font-bold text-2xl md:text-3xl leading-tight mb-2">{blog.title}</h1>
        <p className="text-[15px] text-muted-foreground font-body mb-3" style={{ maxWidth: 720 }}>
          {blog.excerpt}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground font-body mb-6">
          <span>By {blog.author.name}</span>
          <span>·</span>
          <span>{formatDate(blog.publishedAt)}</span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.8} /> {blog.readingTimeMinutes} min read
          </span>
        </div>

        <BlogRenderer blocks={blog.content} />
      </article>

      {related.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading font-bold text-lg mb-3">Related articles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((b, i) => (
              <BlogCard key={b.id} blog={b} index={i} />
            ))}
          </div>
        </section>
      )}
    </HubSubLayout>
  );
};

export default KnowledgeBlogScreen;
