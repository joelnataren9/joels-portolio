"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface TimelineEntry {
  date: string;
  title: string;
  description: string;
  dotColor: string;
}

const experiences: TimelineEntry[] = [
  {
    date: "Feb 2025 – Present · Redmond, WA",
    title: "Software Engineer · Microsoft · IDEAS",
    description:
      "Building and improving large-scale data platform tooling that helps leaders at Microsoft understand impact, reliability, and performance across petabytes of data.",
    dotColor: "bg-emerald-500",
  },
  {
    date: "May 2024 – Jul 2024 · Redmond, WA",
    title: "Software Engineer Intern · Microsoft",
    description:
      "Developed an AI-powered documentation assistant using RAG to automatically detect compliance issues and reduce manual review time; delivered a functional prototype for internal testing.",
    dotColor: "bg-emerald-400",
  },
  {
    date: "May 2023 – Aug 2023 · Redmond, WA",
    title: "Software Engineer Intern · Microsoft",
    description:
      "Built an AI-driven Q&A experience with LLMs, Angular, Node.js, and TypeScript to improve answer relevance for internal users and reduce search time.",
    dotColor: "bg-emerald-400",
  },
  {
    date: "May 2022 – Aug 2022 · Redmond, WA",
    title: "Explore Intern (SWE & PM) · Microsoft",
    description:
      "Researched market needs, designed a new feature with Figma, and implemented it with React and TypeScript in a pod of interns, collaborating with PMs and engineers.",
    dotColor: "bg-emerald-300",
  },
  {
    date: "2021 – 2024 · East Lansing, MI",
    title: "CoRe Peer Leader · Michigan State University",
    description:
      "Mentored first-year engineering students, organized events with companies and faculty, and led workshops to support student success.",
    dotColor: "bg-slate-400",
  },
];

function TimelineCard({
  entry,
  index,
}: {
  entry: TimelineEntry;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.85", "start 0.4"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 1], [-40, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.6, 1], [0.4, 1.1, 1]);

  return (
    <div ref={ref} className="relative pb-10 pl-8 last:pb-0">
      {/* Dot — scale driven by scroll */}
      <motion.div
        className={`absolute left-0 top-1 z-10 h-3.5 w-3.5 rounded-full border-2 border-white shadow ${entry.dotColor}`}
        style={{ scale }}
      />

      {/* Card — slides in from left */}
      <motion.div
        className="rounded-xl border border-slate-200 bg-white/90 p-4 shadow-sm"
        style={{ opacity, x }}
      >
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
          {entry.date}
        </p>
        <p className="mt-1 font-semibold text-slate-900">{entry.title}</p>
        <p className="mt-1.5 text-xs leading-relaxed text-slate-600">
          {entry.description}
        </p>
      </motion.div>
    </div>
  );
}

export default function Timeline() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.75", "end 0.6"],
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">Experience</h2>
        <p className="text-xs text-slate-500">
          Scroll down to reveal the timeline.
        </p>
      </div>

      <div ref={containerRef} className="relative ml-1.5">
        {/* Background track */}
        <div className="absolute left-[6px] top-0 h-full w-px bg-slate-200" />
        {/* Animated progress fill */}
        <motion.div
          className="absolute left-[6px] top-0 w-px origin-top bg-emerald-400"
          style={{ height: lineHeight }}
        />

        {experiences.map((entry, i) => (
          <TimelineCard key={i} entry={entry} index={i} />
        ))}
      </div>
    </section>
  );
}
