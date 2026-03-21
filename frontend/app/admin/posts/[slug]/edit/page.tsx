"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { toDateInputValue, fromDateInputToISO } from "@/app/lib/date";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

type Post = {
  slug: string;
  title: string;
  summary?: string;
  contentMarkdown?: string;
  tags?: string[];
  status?: string;
  publishedAt?: string;
  published_at?: string;
};

export default function EditPostPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("published");
  const [publishedAt, setPublishedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPost() {
      try {
        const res = await fetch(`${API_BASE}/posts/${slug}`);
        if (!res.ok) {
          if (res.status === 404) router.replace("/admin/posts");
          return;
        }
        const data = await res.json();
        setPost(data);
        setTitle(data.title || "");
        setSummary(data.summary || "");
        setContentMarkdown(data.contentMarkdown || data.content_markdown || "");
        setTags((data.tags || []).join(", "));
        setStatus(data.status || "published");
        setPublishedAt(toDateInputValue(data.publishedAt ?? data.published_at));
      } finally {
        setLoading(false);
      }
    }
    fetchPost();
  }, [slug, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/posts/${slug}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          summary: summary || undefined,
          contentMarkdown,
          tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
          status,
          publishedAt: fromDateInputToISO(publishedAt),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update post");
      }
      router.push("/admin/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update post");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !post) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="text-slate-400 hover:text-slate-100">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-slate-100">Edit: {post.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-100">Slug</label>
          <input
            type="text"
            value={slug}
            disabled
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-400"
          />
          <p className="mt-1 text-xs text-slate-400">Slug cannot be changed after creation</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-100">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-100">Summary</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-100">Content (Markdown)</label>
            <textarea
              value={contentMarkdown}
              onChange={(e) => setContentMarkdown(e.target.value)}
              rows={16}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 font-mono text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-100">Preview</label>
            <div className="min-h-[24rem] rounded-lg border border-slate-600 bg-slate-800 p-4">
              <article className="prose prose-invert prose-slate max-w-none">
                <h1 className="text-xl">{title || "Untitled"}</h1>
                <ReactMarkdown>{contentMarkdown || "*No content yet*"}</ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-100">Tags (comma-separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="tech, portfolio, ai"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-100">Published date</label>
            <input
              type="date"
              value={publishedAt}
              onChange={(e) => setPublishedAt(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-400">Date shown on the blog</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-100">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <Link
            href={`/blog/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-slate-600 px-4 py-2 text-slate-100 hover:bg-slate-800"
          >
            View post
          </Link>
          <Link
            href="/admin/posts"
            className="rounded-lg border border-slate-600 px-4 py-2 text-slate-100 hover:bg-slate-800"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
