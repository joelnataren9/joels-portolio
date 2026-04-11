import type { ReactNode } from "react";

type ProjectDetail = {
  slug: string;
  title: string;
  href: string;
  linkLabel: string;
  whyHeading?: string;
  whatHeading?: string;
  why: string;
  what: string;
  keyDecisions: string[];
  whatIdDoDifferently: string;
};

const projects: ProjectDetail[] = [
  {
    slug: "spartahack-9",
    title: "SpartaHack 9 (2024)",
    href: "https://2024.spartahack.com",
    linkLabel: "Visit site",
    whyHeading: "Why it mattered",
    whatHeading: "What we shipped",
    why:
      "Hackathons succeed when people trust that applications, schedules, and day-of details are accurate and easy to find. We wanted one place for SpartaHack 9 so attendees weren’t piecing things together from scattered emails and group chats—and so the community could form before anyone arrived on campus.",
    what:
      "I helped ship the public site for Michigan State’s annual hackathon: applications, updates in the weeks leading up to the event, the weekend schedule, tracks, FAQs, and sponsor visibility—all framed so first-timers and returning hackers alike knew what to expect.",
    keyDecisions: [
      "Led with a clear application path and obvious next steps so curiosity wasn’t lost to friction.",
      "Organized content around the timeline (before vs. during the weekend) so the site stayed useful after someone signed up.",
      "Made tracks, sponsors, and “what to expect” easy to scan so people could plan projects and feel included early.",
    ],
    whatIdDoDifferently:
      "I’d agree earlier on a lightweight content freeze and ownership for last-minute changes—schedule tweaks always happen, but a clearer process would have cut down churn for the org team.",
  },
  {
    slug: "budget-app",
    title: "Budget App",
    href: "https://joels-budget-app-frontend-egaxcfa6b7ghdtcn.centralus-01.azurewebsites.net/home",
    linkLabel: "Visit app",
    why:
      "I used to track spending in Notion and built an API that my iPhone automations could call to log each transaction—but capturing every purchase that way still took time, and I had to remember to do it right after I spent anything. I also tried a spreadsheet, where pulling in transactions meant copying them one by one. I wanted to get rid of that manual capture entirely and still get intelligent summaries without the overhead, so I built a system that pulls and categorizes for me automatically.",
    what:
      "A full-stack finance app that uses Plaid to pull transactions automatically, Playwright to handle sources Plaid couldn’t reach, and Azure OpenAI to categorize spending and surface insights — all without me touching a spreadsheet. Now used by 5+ friends and family.",
    keyDecisions: [
      "Chose Plaid over manual CSV imports for reliability, but added Playwright as a fallback for institutions Plaid doesn’t support.",
      "Used Azure OpenAI over rules-based categorization because spending patterns don’t fit neat buckets — the model handles edge cases much better.",
      "Kept the stack simple and self-hosted to avoid recurring infra costs for personal use.",
    ],
    whatIdDoDifferently:
      "I’d invest earlier in data normalization across sources — reconciling Plaid and Playwright outputs cleanly took more work than expected.",
  },
];

function Section({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {heading}
      </h3>
      <div className="text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="space-y-12">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
          Projects
        </h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Things I&apos;ve built or helped ship—side projects, hackathon work, and
          experiments. Each write-up is meant to explain the why, not just the
          what.
        </p>
      </div>

      <div className="space-y-10">
        {projects.map((project) => (
          <article
            id={project.slug}
            key={project.href}
            className="scroll-mt-8 rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
              <h2 className="text-lg font-semibold text-slate-800">
                {project.title}
              </h2>
              <a
                href={project.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 text-sm font-medium text-emerald-600 transition hover:text-emerald-500"
              >
                {project.linkLabel} →
              </a>
            </div>

            <div className="mt-6 max-w-3xl space-y-8">
              <Section heading={project.whyHeading ?? "Why I built it"}>
                <p>{project.why}</p>
              </Section>
              <Section heading={project.whatHeading ?? "What I built"}>
                <p>{project.what}</p>
              </Section>
              <Section heading="Key decisions">
                <ul className="list-disc space-y-2 pl-5 marker:text-slate-400">
                  {project.keyDecisions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Section>
              <Section heading="What I'd do differently">
                <p>{project.whatIdDoDifferently}</p>
              </Section>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
