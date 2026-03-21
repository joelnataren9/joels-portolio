import Link from "next/link";
import { formatDate } from "../lib/date";
import { fetchPosts } from "../lib/posts";

export default async function BlogIndexPage() {
  const posts = await fetchPosts();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Blog
      </h1>
      {posts.length === 0 ? (
        <p className="text-sm text-slate-600">
          No posts yet, check back later!
        </p>
      ) : (
        <ul className="space-y-4">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs text-slate-500">
                {formatDate(post.publishedAt ?? post.published_at) ?? "—"}
              </p>
              <Link href={`/blog/${post.slug}`} className="mt-0.5 block font-medium text-slate-900 hover:text-emerald-600">
                {post.title}
              </Link>
              {post.summary && (
                <p className="mt-1 text-sm text-slate-600">{post.summary}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

