"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/contexts/AuthContext";
import { toDateInputValue, fromDateInputToISO } from "@/app/lib/date";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function NewPostPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [contentMarkdown, setContentMarkdown] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("published");
  const [publishedAt, setPublishedAt] = useState(() => toDateInputValue(new Date().toISOString()));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slug: slug.trim() || title.toLowerCase().replace(/\s+/g, "-"),
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
        throw new Error(data.detail || "Failed to create post");
      }
      const post = await res.json();
      router.push(`/admin/posts/${post.slug}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/posts" className="text-slate-400 hover:text-slate-100">
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-slate-100">New Post</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-100">Slug</label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="my-post-slug"
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <p className="mt-1 text-xs text-slate-400">Leave empty to auto-generate from title</p>
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
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <p className="mt-1 text-xs text-slate-400">Date shown on the blog</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-100">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            {submitting ? "Creating..." : "Create post"}
          </button>
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
