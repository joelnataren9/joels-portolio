import Link from "next/link";
import { Mail, Linkedin, Github } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-semibold tracking-tight text-slate-800">
        Contact
      </h1>
      <p className="max-w-2xl text-slate-600">
        Feel free to reach out—I&apos;m happy to connect.
      </p>

      <div className="flex flex-col gap-6">
        <a
          href="mailto:joelnataren9@hotmail.com"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-8 py-6 text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600"
        >
          <Mail className="h-10 w-10 shrink-0" />
          <span className="text-base text-slate-600">joelnataren9@hotmail.com</span>
        </a>
        <Link
          href="https://www.linkedin.com/in/joel-nataren/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-8 py-6 text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600"
        >
          <Linkedin className="h-10 w-10 shrink-0" />
          <span className="text-base text-slate-600">linkedin.com/in/joel-nataren</span>
        </Link>
        <Link
          href="https://github.com/joelnataren9"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/90 px-8 py-6 text-slate-700 shadow-sm transition hover:border-emerald-400 hover:text-emerald-600"
        >
          <Github className="h-10 w-10 shrink-0" />
          <span className="text-base text-slate-600">github.com/joelnataren9</span>
        </Link>
      </div>
    </div>
  );
}
