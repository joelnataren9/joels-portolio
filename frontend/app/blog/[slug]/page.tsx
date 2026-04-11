import ReactMarkdown from "react-markdown";
import { formatDate } from "../../lib/date";

type Post = {
  slug: string;
  title: string;
  contentMarkdown: string;
  publishedAt?: string;
  published_at?: string;
};

async function fetchPost(slug: string): Promise<Post | null> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) return null;
  try {
    const res = await fetch(`${baseUrl}/posts/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Post;
  } catch {
    return null;
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string };
}) {
  const post = await fetchPost(params.slug);

  if (!post) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Post not found</h1>
        <p className="text-sm text-slate-600">
          Once the backend is configured and content is synced, posts will be
          available here.
        </p>
      </div>
    );
  }

  const formattedDate = formatDate(post.publishedAt ?? post.published_at);

  return (
    <article className="prose prose-slate max-w-none prose-p:leading-relaxed prose-pre:max-w-full prose-pre:overflow-x-auto prose-img:max-w-full">
      <h1 className="text-slate-900">{post.title}</h1>
      {formattedDate && (
        <p className="text-sm text-slate-500 -mt-2 mb-6">{formattedDate}</p>
      )}
      <ReactMarkdown>{post.contentMarkdown}</ReactMarkdown>
    </article>
  );
}

