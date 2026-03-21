import Image from "next/image";

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
        About me
      </h1>

      <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_1fr] md:items-start">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Image
            src="/joel-beach.png"
            alt="Joel at the beach"
            width={280}
            height={420}
            className="aspect-[2/3] w-full object-cover"
            sizes="(max-width: 768px) 100vw, 280px"
          />
        </div>
        <div className="max-w-2xl space-y-6 text-slate-600">
        <p className="leading-relaxed">
          I&apos;m originally from El Salvador—born and raised there. Growing up,
          I always wanted to study abroad, and I was blessed with the
          opportunity to come to the United States for my bachelor&apos;s degree.
        </p>
        <p className="leading-relaxed">
          I studied Computer Science with a minor in Business, which gave me
          both the technical foundation and the business perspective to build
          products that matter. During college, I was fortunate to land an
          internship at Microsoft—and ended up doing three internships there,
          each one deepening my experience in software engineering, AI, and
          product development.
        </p>
        <p className="leading-relaxed">
          Today I work full time as a Software Engineer at Microsoft on IDEAS,
          one of the largest data platform teams in the world. I&apos;m grateful
          for the journey from El Salvador to where I am now, and I&apos;m
          excited to keep building and learning.
        </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Image
            src="/joel-graduation.png"
            alt="Joel at his Michigan State University graduation, holding the flag of El Salvador"
            width={400}
            height={500}
            className="aspect-[4/5] w-full object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <Image
            src="/joel-waterfall.png"
            alt="Joel at a waterfall"
            width={400}
            height={500}
            className="aspect-[4/5] w-full object-cover"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
        </div>
      </div>
    </div>
  );
}
