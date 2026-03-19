import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "Joel Natarén – AI Portfolio",
  description: "AI-futuristic personal portfolio for Joel Natarén.",
  icons: {
    icon: "/budget-app-logo.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-slate-800 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_70%_0%,rgba(59,130,246,0.1)_0%,transparent_55%),radial-gradient(ellipse_60%_40%_at_20%_100%,rgba(15,23,42,0.06)_0%,transparent_55%)] bg-drift" />
        <div className="relative flex min-h-screen flex-col">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-background/90 backdrop-blur">
            <nav className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/budget-app-logo.png"
                  alt="Joel Natarén"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-base font-semibold tracking-[0.2em] text-slate-600 uppercase md:text-lg">
                  Joel Natarén
                </span>
              </Link>
              <div className="flex gap-6 text-base text-slate-600 md:gap-8 md:text-[15px]">
                <a href="/" className="transition hover:text-emerald-600">
                  Home
                </a>
                <a href="/about" className="transition hover:text-emerald-600">
                  About
                </a>
                <a href="/projects" className="transition hover:text-emerald-600">
                  Projects
                </a>
                <a href="/blog" className="transition hover:text-emerald-600">
                  Blog
                </a>
                <a href="/contact" className="transition hover:text-emerald-600">
                  Contact
                </a>
              </div>
            </nav>
          </header>
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Joel Natarén. All rights reserved.
          </footer>
        </div>
      </body>
    </html>
  );
}

