"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDate } from "../lib/date";
import type { PostPreview } from "../lib/posts";

export default function RecentPosts({ posts }: { posts: PostPreview[] }) {
  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
        Blog posts will appear here once there are any posts.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post, i) => {
        const formattedDate = formatDate(post.publishedAt ?? post.published_at);
        return (
          <motion.div
            key={post.slug}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 100, damping: 18, delay: i * 0.05 }}
          >
            <Link
              href={`/blog/${post.slug}`}
              className="block rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-700 shadow-sm transition-colors hover:border-emerald-400/60 hover:bg-white hover:text-slate-900"
            >
              <p className="font-medium text-slate-800">{post.title}</p>
              {formattedDate && (
                <p className="mt-1 text-xs text-slate-500">{formattedDate}</p>
              )}
              {post.summary && (
                <p className="mt-2 text-xs text-slate-600 line-clamp-2">{post.summary}</p>
              )}
              <p className="mt-2 text-xs font-medium text-emerald-600">Read more →</p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
