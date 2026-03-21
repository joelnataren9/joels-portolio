import type { ReactNode } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";
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
      <body className="min-h-screen overflow-x-hidden bg-background text-slate-800 antialiased">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_80%_50%_at_70%_0%,rgba(59,130,246,0.1)_0%,transparent_55%),radial-gradient(ellipse_60%_40%_at_20%_100%,rgba(15,23,42,0.06)_0%,transparent_55%)] bg-drift" />
        <div className="relative flex min-h-screen flex-col">
          <Navbar />
          <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
          <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500 sm:px-6">
            © {new Date().getFullYear()} Joel Natarén. All rights reserved.{" "}
            <a href="/admin" className="text-slate-400 hover:text-slate-600">
              Admin
            </a>
          </footer>
        </div>
      </body>
    </html>
  );
}

