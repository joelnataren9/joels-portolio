import type { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata = {
  title: "Admin – Joel Natarén",
  description: "Admin dashboard for blog management",
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-slate-950">
        <header className="border-b border-slate-800 bg-slate-900">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
            <Link href="/admin" className="font-semibold text-slate-100">
              Admin
            </Link>
            <Link href="/" className="text-sm text-slate-400 hover:text-slate-100">
              ← Back to site
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-4xl px-6 py-8">{children}</main>
      </div>
    </AuthProvider>
  );
}
