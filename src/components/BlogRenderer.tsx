import { KBBlock } from "@/lib/knowledgeBase";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 64);

const calloutStyles: Record<string, string> = {
  info: "bg-blue-50 border-blue-300 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
  tip: "bg-emerald-50 border-emerald-300 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  warning: "bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  danger: "bg-rose-50 border-rose-300 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
};

interface Props {
  blocks: KBBlock[];
}

const BlogRenderer = ({ blocks }: Props) => {
  return (
    <div className="font-body text-foreground" style={{ lineHeight: 1.7 }}>
      {blocks.map((block, idx) => {
        const key = `b-${idx}`;
        switch (block.type) {
          case "heading": {
            const id = slugify(block.text);
            const baseCls = "font-heading font-bold text-foreground mt-8 mb-3 scroll-mt-20";
            if (block.level === 2)
              return (
                <h2 key={key} id={id} className={`${baseCls} text-2xl`}>
                  <a href={`#${id}`} className="no-underline hover:opacity-80">{block.text}</a>
                </h2>
              );
            if (block.level === 3)
              return (
                <h3 key={key} id={id} className={`${baseCls} text-xl`}>
                  <a href={`#${id}`} className="no-underline hover:opacity-80">{block.text}</a>
                </h3>
              );
            return <h4 key={key} className={`${baseCls} text-lg`}>{block.text}</h4>;
          }
          case "paragraph":
            return (
              <p key={key} className="my-4 text-[16px] md:text-[17px]" style={{ maxWidth: 720 }}>
                {block.text}
              </p>
            );
          case "list": {
            const cls = "my-4 pl-6 space-y-2 text-[16px] md:text-[17px]";
            const items = block.items.map((it, i) => <li key={i}>{it}</li>);
            return block.style === "ordered" ? (
              <ol key={key} className={`${cls} list-decimal`} style={{ maxWidth: 720 }}>{items}</ol>
            ) : (
              <ul key={key} className={`${cls} list-disc`} style={{ maxWidth: 720 }}>{items}</ul>
            );
          }
          case "callout": {
            const cls = calloutStyles[block.variant] || calloutStyles.info;
            return (
              <div key={key} className={`my-5 border-l-4 rounded-md p-4 ${cls}`} style={{ maxWidth: 720 }}>
                {block.title && <p className="font-bold mb-1">{block.title}</p>}
                <p className="text-[15px] leading-relaxed">{block.text}</p>
              </div>
            );
          }
          case "quote":
            return (
              <blockquote
                key={key}
                className="my-6 border-l-4 border-primary pl-4 italic text-muted-foreground"
                style={{ maxWidth: 720 }}
              >
                <p>"{block.text}"</p>
                {block.attribution && <footer className="mt-2 text-sm not-italic">— {block.attribution}</footer>}
              </blockquote>
            );
          case "image":
            return (
              <figure key={key} className="my-6" style={{ maxWidth: 720 }}>
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  loading="lazy"
                  className="w-full rounded-[14px] shadow-petosauras"
                />
                {block.caption && (
                  <figcaption className="mt-2 text-sm italic text-muted-foreground">{block.caption}</figcaption>
                )}
              </figure>
            );
          case "divider":
            return <hr key={key} className="my-8 border-border" style={{ maxWidth: 720 }} />;
          default:
            return null;
        }
      })}
    </div>
  );
};

export default BlogRenderer;
