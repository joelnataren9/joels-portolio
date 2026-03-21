"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/admin");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center py-12">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
