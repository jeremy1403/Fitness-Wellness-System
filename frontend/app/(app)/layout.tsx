import type { ReactNode } from "react";
import { SmoothScrollProvider } from "@/components/motion/SmoothScrollProvider";

export default function AuthenticatedGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SmoothScrollProvider>{children}</SmoothScrollProvider>;
}
