import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

/**
 * Redirects the user to the correct system once auth has loaded.
 * - "admin" system: non-admins are sent to /app
 * - "user"  system: admins are sent to /admin
 */
export function useRoleGuard(system: "admin" | "user") {
  const { primaryRole, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (system === "admin" && primaryRole !== "admin") {
      router.replace("/app");
    } else if (system === "user" && primaryRole === "admin") {
      router.replace("/admin");
    }
  }, [isLoading, primaryRole, system, router]);
}
