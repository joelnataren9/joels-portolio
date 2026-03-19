"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Timeline from "./components/Timeline";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 120, damping: 20, mass: 0.8 },
  },
};

const interestPills = [
  "AI & ML",
  "Data platforms",
  "Building things",
  "Music & church",
  "Gym & sports",
  "Food & family",
];

export default function HomePage() {
  return (
    <div className="space-y-20">
      {/* Hero — your intro + portrait */}
      <motion.section
        className="mt-6 grid items-start gap-10 md:grid-cols-[1fr,auto] md:gap-12"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <div className="min-w-0">
        <motion.p
          variants={item}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600"
        >
          Hey!
        </motion.p>
        <motion.h1
          variants={item}
          className="mt-4 text-4xl font-semibold tracking-tight text-slate-800 md:text-5xl"
        >
          I&apos;m{" "}
          <span
            className="gradient-text-animate inline-block bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 bg-[length:200%_auto] bg-clip-text text-transparent"
            style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
          >
            Joel Nataren
          </span>
        </motion.h1>
        <motion.p variants={item} className="mt-6 text-slate-600 leading-relaxed">
          I&apos;m a Software Engineer at Microsoft within IDEAS, one of the
          largest data platform teams in the world processing petabytes of data.
          Besides work, I like exploring and keeping up to date with AI and AI
          technologies, and building and creating things. Welcome to my personal
          website—here you can learn more about me, my work and experience, and
          read any blogs or posts I put here.
        </motion.p>
        <motion.p variants={item} className="mt-4 text-slate-600 leading-relaxed">
          Besides tech, I love playing musical instruments and serving at church
          with them, going to the gym and staying active with sports and
          activities, and trying new food with my girlfriend, family and friends.
        </motion.p>

        {/* Interactive interest pills */}
        <motion.div variants={item} className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Interests
          </p>
          <div className="flex flex-wrap gap-2">
          {interestPills.map((label, i) => (
            <motion.span
              key={label}
              className="cursor-default rounded-full border border-slate-300 bg-white/80 px-4 py-2 text-xs text-slate-600 shadow-sm transition-colors hover:border-emerald-400 hover:bg-emerald-50/80 hover:text-emerald-700"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {label}
            </motion.span>
          ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="mt-10 flex flex-wrap gap-4 text-sm">
          <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/projects"
              className="inline-block rounded-full bg-emerald-600 px-5 py-2.5 font-medium text-white shadow-lg shadow-emerald-500/30 transition hover:bg-emerald-500 hover:shadow-emerald-500/40"
            >
              View projects
            </Link>
          </motion.span>
          <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/blog"
              className="inline-block rounded-full border border-slate-300 px-5 py-2.5 text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
            >
              Read the blog
            </Link>
          </motion.span>
          <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/about"
              className="inline-block rounded-full border border-slate-300 px-5 py-2.5 text-slate-700 transition hover:border-emerald-500 hover:text-emerald-600"
            >
              About me
            </Link>
          </motion.span>
        </motion.div>
        </div>

        {/* Portrait — gentle float + glow */}
        <motion.div
          variants={item}
          className="relative shrink-0 md:max-w-[280px]"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <motion.div
            className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-lg shadow-slate-200/80 ring-1 ring-slate-100"
            whileHover={{ scale: 1.02, boxShadow: "0 20px 50px -12px rgba(15,23,42,0.15), 0 0 0 1px rgba(16,185,129,0.2)" }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Image
              src="/joel-portrait.png"
              alt="Joel Nataren"
              width={280}
              height={360}
              className="relative aspect-[3/4] w-full object-cover"
              priority
              sizes="(max-width: 768px) 100vw, 280px"
            />
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-slate-900/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>
      </motion.section>

      {/* Skills overview */}
      <motion.section
        className="space-y-4"
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 90, damping: 18 }}
      >
        <div className="flex flex-col gap-2 md:flex-row md:items-baseline md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Skills</h2>
            <p className="text-xs text-slate-500">
              A snapshot of tools and technologies I use most.
            </p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Data & Platforms
            </p>
            <p className="mt-2 text-xs text-slate-600">
              C#, .NET, KQL, SQL, Power BI, Azure data tooling, dashboards, monitoring.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Web & AI
            </p>
            <p className="mt-2 text-xs text-slate-600">
              TypeScript, JavaScript, React, Angular, Node.js, Python, RAG, LLM‑driven experiences.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-700 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Systems & Tools
            </p>
            <p className="mt-2 text-xs text-slate-600">
              C++, Git/GitHub, Firebase, Linux/Unix, HTML/CSS/SASS, Visual Studio Code.
            </p>
          </div>
        </div>
      </motion.section>

      {/* Experience timeline — scroll-driven */}
      <Timeline />

      {/* Featured projects — interactive cards */}
      <motion.section
        className="space-y-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">
            Featured projects
          </h2>
          <Link
            href="/projects"
            className="text-xs text-slate-500 transition hover:text-emerald-600"
          >
            View all projects
          </Link>
        </div>
        <div className="grid gap-4 md:max-w-xl">
          <motion.a
            href="https://joels-budget-app-frontend-egaxcfa6b7ghdtcn.centralus-01.azurewebsites.net/home"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-2xl border border-slate-200 bg-white/90 p-5 text-sm text-slate-700 shadow-sm transition-colors hover:text-slate-900"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ type: "spring", stiffness: 100, damping: 18 }}
            whileHover={{ y: -6, scale: 1.02, borderColor: "rgba(16,185,129,0.4)", boxShadow: "0 12px 40px -12px rgba(15,23,42,0.12)" }}
          >
            <p className="font-medium text-slate-800">Budget App</p>
            <p className="mt-1 text-xs text-slate-500">
              I worked on creating an app that leverages Plaid and AI to track my
              expenses, categorize them, and help me track my budget and my friends and family's budgets.
            </p>
            <p className="mt-2 text-xs font-medium text-emerald-600">
              Visit app →
            </p>
          </motion.a>
        </div>
      </motion.section>

      {/* Recent writing */}
      <motion.section
        className="space-y-4"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ type: "spring", stiffness: 80, damping: 20 }}
      >
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-800">Recent writing</h2>
          <Link
            href="/blog"
            className="text-xs text-slate-500 transition hover:text-emerald-600"
          >
            View all posts
          </Link>
        </div>
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 p-6 text-sm text-slate-500">
          Blog posts will appear here once there are any posts.
        </div>
      </motion.section>
    </div>
  );
}
