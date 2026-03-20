"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import { userNav } from "@/lib/navigation";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarShell
      title="User System"
      subtitle="Member and trainer experience"
      nav={userNav}
      variant="user"
    >
      {children}
    </SidebarShell>
  );
}
