import type { ReactNode } from "react";
import { AdminGuard } from "@/app/components/AdminGuard";

export const metadata = {
  title: "Trips – Joel Natarén",
  robots: { index: false, follow: false },
};

// Pages render client-side only, with the admin token; no trip data is in the HTML.
export default function TripsLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
