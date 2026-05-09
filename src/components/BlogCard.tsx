import { Link } from "react-router-dom";
import { Clock } from "lucide-react";
import { KBBlog, formatDate, getCategoryById } from "@/lib/knowledgeBase";

interface Props {
  blog: KBBlog;
  index?: number;
}

const BlogCard = ({ blog, index = 0 }: Props) => {
  const cat = getCategoryById(blog.category);
  return (
    <Link
      to={`/hub/learn/knowledge-base/${blog.slug}`}
      className="paw-card overflow-hidden block animate-fade-up hover:shadow-petosauras-md transition-shadow"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-video w-full overflow-hidden bg-muted">
        <img
          src={blog.featuredImage.url}
          alt={blog.featuredImage.alt || blog.title}
          loading="lazy"
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-primary-light text-primary-dark">
            {cat?.name || blog.category}
          </span>
          {blog.featured && (
            <span className="text-[10px] font-body font-bold px-2 py-0.5 rounded-full bg-secondary-light text-[#CC5500]">
              Featured
            </span>
          )}
        </div>
        <h3 className="text-[15px] font-heading font-bold leading-snug line-clamp-2">{blog.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 font-body line-clamp-3">{blog.excerpt}</p>
        <div className="flex items-center justify-between mt-3 text-[11px] text-muted-foreground font-body">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" strokeWidth={1.8} /> {blog.readingTimeMinutes} min read
          </span>
          <span>{formatDate(blog.publishedAt)}</span>
        </div>
      </div>
    </Link>
  );
};

export default BlogCard;
