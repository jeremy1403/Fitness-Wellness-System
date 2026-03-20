import type { UserRole } from "@/types/auth";

export function resolvePrimaryRole(roles: UserRole[]): UserRole | null {
  // Priority: admin > trainer > member
  if (roles.includes("admin")) return "admin";
  if (roles.includes("trainer")) return "trainer";
  if (roles.includes("member")) return "member";
  return null;
}
