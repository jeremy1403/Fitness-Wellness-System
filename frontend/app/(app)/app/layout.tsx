"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { userNav } from "@/lib/navigation";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  useRoleGuard("user");

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
