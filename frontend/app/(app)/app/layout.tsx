"use client";

import type { ReactNode } from "react";
import SidebarShell from "@/components/layout/SidebarShell";
import { useRoleGuard } from "@/hooks/use-role-guard";
import { userNav } from "@/lib/navigation";
import { useAuth } from "@/lib/auth/context";

export default function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  useRoleGuard("user");
  const { user } = useAuth();

  // Hide Membership route from Trainers
  const isTrainer = user?.roles?.includes("trainer");
  const filteredNav = userNav.filter((item) => {
    if (isTrainer && item.href === "/app/membership") return false;
    return true;
  });

  return (
    <SidebarShell
      title="User System"
      subtitle="Member and trainer experience"
      nav={filteredNav}
      variant="user"
    >
      {children}
    </SidebarShell>
  );
}
