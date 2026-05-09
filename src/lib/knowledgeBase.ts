import kbData from "@/data/knowledgeBase.json";

export type KBBlock =
  | { type: "heading"; level: 2 | 3 | 4; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; style: "unordered" | "ordered"; items: string[] }
  | { type: "callout"; variant: "info" | "warning" | "tip" | "danger"; title?: string; text: string }
  | { type: "quote"; text: string; attribution?: string }
  | { type: "image"; url: string; alt?: string; caption?: string }
  | { type: "divider" };

export interface KBBlog {
  id: string;
  slug: string;
  title: string;
  category: string;
  tags: string[];
  author: { name: string; role?: string };
  publishedAt: string;
  updatedAt?: string;
  readingTimeMinutes: number;
  status: "published" | "draft";
  featured?: boolean;
  featuredImage: { url: string; alt?: string; caption?: string };
  excerpt: string;
  seo: { metaTitle: string; metaDescription: string; keywords: string[] };
  content: KBBlock[];
}

export interface KBCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon?: string;
  order: number;
}

const data = kbData as { categories: KBCategory[]; tags: string[]; blogs: KBBlog[] };

export const categories: KBCategory[] = [...data.categories].sort((a, b) => a.order - b.order);
export const allBlogs: KBBlog[] = data.blogs.filter((b) => b.status === "published");

export const sortedBlogs = (blogs: KBBlog[]) =>
  [...blogs].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

export const getBlogsByCategory = (categoryId: string): KBBlog[] =>
  sortedBlogs(categoryId === "all" ? allBlogs : allBlogs.filter((b) => b.category === categoryId));

export const getBlogBySlug = (slug: string): KBBlog | undefined =>
  allBlogs.find((b) => b.slug === slug);

export const getRelatedBlogs = (blog: KBBlog, limit = 3): KBBlog[] =>
  allBlogs.filter((b) => b.category === blog.category && b.id !== blog.id).slice(0, limit);

export const getCategoryById = (id: string) => categories.find((c) => c.id === id);

export const getFeaturedBlogs = (): KBBlog[] => sortedBlogs(allBlogs.filter((b) => b.featured));

export const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
};
