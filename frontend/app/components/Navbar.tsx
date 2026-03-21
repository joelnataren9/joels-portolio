"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/projects", label: "Projects" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-background/90 backdrop-blur">
      <nav
        className="relative z-30 mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5"
        aria-label="Main"
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/budget-app-logo.png"
            alt="Joel Natarén"
            width={32}
            height={32}
            className="shrink-0 rounded-lg"
          />
          <span className="truncate text-sm font-semibold uppercase tracking-[0.15em] text-slate-600 sm:tracking-[0.2em] md:text-lg">
            Joel Natarén
          </span>
        </Link>

        <div className="hidden items-center gap-6 text-[15px] text-slate-600 md:flex md:gap-8">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition hover:text-emerald-600 ${
                pathname === href ? "font-medium text-emerald-700" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-700 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {menuOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 bg-slate-900/20 md:hidden"
            aria-label="Close menu"
            tabIndex={-1}
            onClick={() => setMenuOpen(false)}
          />
          <div
            id="mobile-nav"
            className="relative z-20 border-t border-slate-200 bg-background/95 shadow-lg shadow-slate-900/5 backdrop-blur md:hidden"
          >
            <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3 sm:px-6">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`rounded-lg px-3 py-3 text-base text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 ${
                    pathname === href ? "bg-emerald-50 font-medium text-emerald-800" : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </header>
  );
}
