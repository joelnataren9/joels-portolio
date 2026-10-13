import type { ReactNode } from "react";
import { AdminGuard } from "@/app/components/AdminGuard";

export default function AdminPostsLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
