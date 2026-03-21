import Link from "next/link";
import { Mail, Linkedin, Github } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-800 sm:text-3xl">
        Contact
      </h1>
      <p className="max-w-2xl text-slate-600">
        Feel free to reach out—I&apos;m happy to connect.
      </p>

      <div className="flex flex-col gap-6">
        <a
          href="mailto:joelnataren9@hotmail.com"
          className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-5 text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 sm:px-8 sm:py-6"
        >
          <Mail className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          <span className="min-w-0 break-all text-sm text-slate-600 sm:text-base">
            joelnataren9@hotmail.com
          </span>
        </a>
        <Link
          href="https://www.linkedin.com/in/joel-nataren/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-5 text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 sm:px-8 sm:py-6"
        >
          <Linkedin className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          <span className="min-w-0 break-all text-sm text-slate-600 sm:text-base">
            linkedin.com/in/joel-nataren
          </span>
        </Link>
        <Link
          href="https://github.com/joelnataren9"
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-4 py-5 text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600 sm:px-8 sm:py-6"
        >
          <Github className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          <span className="min-w-0 break-all text-sm text-slate-600 sm:text-base">
            github.com/joelnataren9
          </span>
        </Link>
      </div>
    </div>
  );
}
