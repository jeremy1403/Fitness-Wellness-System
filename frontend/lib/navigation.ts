export type NavItem = {
  href: string;
  label: string;
  shortLabel?: string;
  description?: string;
};

export const userNav: NavItem[] = [
  {
    href: "/app",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Overview and quick actions.",
  },
  {
    href: "/app/classes",
    label: "Classes",
    shortLabel: "Class",
    description: "Browse available classes.",
  },
  {
    href: "/app/schedules",
    label: "Schedules",
    shortLabel: "Sched",
    description: "Upcoming class schedules.",
  },
  {
    href: "/app/bookings",
    label: "Bookings",
    shortLabel: "Book",
    description: "Book or cancel sessions.",
  },
  {
    href: "/app/membership",
    label: "Membership",
    shortLabel: "Member",
    description: "Plan details and benefits.",
  },
  {
    href: "/app/payments",
    label: "Payments",
    shortLabel: "Pay",
    description: "Payment history and invoices.",
  },
  {
    href: "/app/profile",
    label: "Profile Settings",
    shortLabel: "Profile",
    description: "Basic personal information.",
  },
];

export const adminNav: NavItem[] = [
  {
    href: "/admin",
    label: "Dashboard",
    shortLabel: "Home",
    description: "Admin overview and alerts.",
  },
  {
    href: "/admin/users",
    label: "Users",
    shortLabel: "Users",
    description: "Manage members and trainers.",
  },
  {
    href: "/admin/roles",
    label: "Roles",
    shortLabel: "Roles",
    description: "Role assignment controls.",
  },
  {
    href: "/admin/trainers",
    label: "Trainers",
    shortLabel: "Coach",
    description: "Trainer directory.",
  },
  {
    href: "/admin/classes",
    label: "Classes",
    shortLabel: "Class",
    description: "Manage fitness classes.",
  },
  {
    href: "/admin/schedules",
    label: "Schedules",
    shortLabel: "Sched",
    description: "Assign trainers and times.",
  },
  {
    href: "/admin/bookings",
    label: "Bookings",
    shortLabel: "Book",
    description: "Booking oversight.",
  },
  {
    href: "/admin/memberships",
    label: "Memberships",
    shortLabel: "Member",
    description: "Plans and subscriptions.",
  },
  {
    href: "/admin/payments",
    label: "Payments",
    shortLabel: "Pay",
    description: "Payment monitoring.",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    shortLabel: "Rpt",
    description: "Revenue and member reports.",
  },
  {
    href: "/admin/settings",
    label: "Admin Settings",
    shortLabel: "Set",
    description: "Admin profile and preferences.",
  },
];

export const filterNav = (items: NavItem[], currentHref: string) =>
  items.filter((item) => item.href !== currentHref);
