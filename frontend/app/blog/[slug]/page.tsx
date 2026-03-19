import ReactMarkdown from "react-markdown";

type Post = {
  slug: string;
  title: string;
  contentMarkdown: string;
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
        <h1 className="text-2xl font-semibold tracking-tight">Post not found</h1>
        <p className="text-sm text-slate-400">
          Once the backend is configured and content is synced, posts will be
          available here.
        </p>
      </div>
    );
  }

  return (
    <article className="prose-dark">
      <h1>{post.title}</h1>
      <ReactMarkdown>{post.contentMarkdown}</ReactMarkdown>
    </article>
  );
}

