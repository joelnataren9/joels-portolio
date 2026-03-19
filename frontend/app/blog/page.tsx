async function fetchPosts() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return [];
  }

  try {
    const res = await fetch(`${baseUrl}/posts`, { next: { revalidate: 60 } });
    if (!res.ok) {
      return [];
    }
    return (await res.json()) as {
      slug: string;
      title: string;
      summary?: string;
      publishedAt?: string;
      tags?: string[];
    }[];
  } catch {
    return [];
  }
}

export default async function BlogIndexPage() {
  const posts = await fetchPosts();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold tracking-tight">Blog</h1>
      {posts.length === 0 ? (
        <p className="text-sm text-slate-400">
          No posts yet, check back later!
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4"
            >
              <p className="text-sm font-medium text-slate-100">{post.title}</p>
              {post.summary && (
                <p className="mt-1 text-xs text-slate-400">{post.summary}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

