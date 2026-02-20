"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import { adminNav } from "@/lib/navigation";

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarShell
      title="Admin System"
      subtitle="Admin-only controls"
      nav={adminNav}
      variant="admin"
    >
      {children}
    </SidebarShell>
  );
}
