import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Dumbbell,
  CalendarDays,
  BookOpen,
  CreditCard,
  UserCircle,
  Users,
  Shield,
  UserCog,
  ClipboardList,
  BarChart3,
  Settings,
  BadgeDollarSign,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  description?: string;
  icon: LucideIcon;
};

export const userNav: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Overview and quick actions.",
    icon: LayoutDashboard,
  },
  {
    href: "/app/classes",
    label: "Classes",
    shortLabel: "Class",
    description: "Browse available classes.",
    icon: Dumbbell,
  },
  {
    href: "/app/schedules",
    label: "Schedules",
    shortLabel: "Sched",
    description: "Upcoming class schedules.",
    icon: CalendarDays,
  },
  {
    href: "/app/bookings",
    label: "Bookings",
    shortLabel: "Book",
    description: "Book or cancel sessions.",
    icon: BookOpen,
  },
  {
    href: "/app/membership",
    label: "Membership",
    shortLabel: "Member",
    description: "Plan details and benefits.",
    icon: BadgeDollarSign,
  },
  {
    href: "/app/payments",
    label: "Payments",
    shortLabel: "Pay",
    description: "Payment history and invoices.",
    icon: CreditCard,
  },
  {
    href: "/app/profile",
    label: "Profile Settings",
    shortLabel: "Profile",
    description: "Basic personal information.",
    icon: UserCircle,
  },
];

export const adminNav: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Admin overview and alerts.",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/users",
    label: "Users",
    shortLabel: "Users",
    description: "Manage members and trainers.",
    icon: Users,
  },
  {
    href: "/admin/roles",
    label: "Roles",
    shortLabel: "Roles",
    description: "Role assignment controls.",
    icon: Shield,
  },
  {
    href: "/admin/trainers",
    label: "Trainers",
    shortLabel: "Coach",
    description: "Trainer directory.",
    icon: UserCog,
  },
  {
    href: "/admin/classes",
    label: "Classes",
    shortLabel: "Class",
    description: "Manage fitness classes.",
    icon: Dumbbell,
  },
  {
    href: "/admin/schedules",
    label: "Schedules",
    shortLabel: "Sched",
    description: "Assign trainers and times.",
    icon: CalendarDays,
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    shortLabel: "Book",
    description: "Booking oversight.",
    icon: ClipboardList,
  },
  {
    href: "/admin/memberships",
    label: "Memberships",
    shortLabel: "Member",
    description: "Plans and subscriptions.",
    icon: BadgeDollarSign,
  },
  {
    href: "/admin/payments",
    label: "Payments",
    shortLabel: "Pay",
    description: "Payment monitoring.",
    icon: CreditCard,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    shortLabel: "Rpt",
    description: "Revenue and member reports.",
    icon: BarChart3,
  },
  {
    href: "/admin/settings",
    label: "Admin Settings",
    shortLabel: "Set",
    description: "Admin profile and preferences.",
    icon: Settings,
  },
];

export const filterNav = (items: NavItem[], currentHref: string) =>
  items.filter((item) => item.href !== currentHref);
