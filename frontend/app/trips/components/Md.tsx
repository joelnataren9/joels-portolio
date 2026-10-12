import ReactMarkdown, { type Components } from "react-markdown";

const linkClass =
  "text-trip-ocean underline decoration-trip-ocean/40 underline-offset-2 hover:decoration-trip-ocean";

const link: Components["a"] = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
    {children}
  </a>
);

const inlineComponents: Components = { a: link, p: ({ children }) => <>{children}</> };

/**
 * Trip text is markdown (bold, links, line breaks). react-markdown never renders raw
 * HTML and strips javascript: URLs, so stored text can't inject script.
 * `inline` drops the paragraph wrapper for use inside a line of text.
 */
export function Md({
  children,
  inline = false,
  className = "",
}: {
  children?: string | null;
  inline?: boolean;
  className?: string;
}) {
  if (!children) return null;
  if (inline) {
    return <ReactMarkdown components={inlineComponents}>{children}</ReactMarkdown>;
  }
  return (
    <div
      className={`prose prose-sm prose-stone max-w-none prose-headings:text-trip-ink prose-p:my-2 prose-ul:my-2 prose-li:my-0.5 ${className}`}
    >
      <ReactMarkdown components={{ a: link }}>{children}</ReactMarkdown>
    </div>
  );
}

/** Markdown reduced to plain text, for aria-labels. */
export function plainText(md: string): string {
  return md.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_~`]/g, "").trim();
}
