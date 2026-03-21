"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Post = {
  slug: string;
  title: string;
  summary?: string;
  publishedAt?: string;
  tags?: string[];
};

export default function AdminPostsPage() {
  const { user, getToken, signOut } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await fetch(`${API_BASE}/posts?include_drafts=true`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  async function handleDelete(slug: string) {
    if (!confirm(`Delete "${slug}"?`)) return;
    setDeleting(slug);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/posts/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setPosts((p) => p.filter((x) => x.slug !== slug));
      } else {
        alert("Failed to delete");
      }
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-100">Blog Posts</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">{user?.email}</span>
          <button
            onClick={() => signOut()}
            className="text-sm text-slate-400 hover:text-slate-100"
          >
            Sign out
          </button>
          <Link
            href="/admin/posts/new"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            New post
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-slate-400">Loading posts...</p>
      ) : posts.length === 0 ? (
        <p className="text-slate-400">No posts yet.</p>
      ) : (
        <ul className="divide-y divide-slate-700 rounded-lg border border-slate-700 bg-slate-900">
          {posts.map((post) => (
            <li
              key={post.slug}
              className="flex items-center justify-between px-4 py-3"
            >
              <div>
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="font-medium text-slate-100 hover:text-emerald-400"
                >
                  {post.title}
                </Link>
                {post.summary && (
                  <p className="text-sm text-slate-400">{post.summary}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/posts/${post.slug}/edit`}
                  className="rounded bg-emerald-900/50 px-2 py-1 text-sm font-medium text-emerald-400 hover:bg-emerald-800/50"
                >
                  Edit
                </Link>
                <Link
                  href={`/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-slate-100"
                >
                  View
                </Link>
                <button
                  onClick={() => handleDelete(post.slug)}
                  disabled={deleting === post.slug}
                  className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                >
                  {deleting === post.slug ? "Deleting..." : "Delete"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
