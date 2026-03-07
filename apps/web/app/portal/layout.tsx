"use client";

import {
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Receipt,
  User,
} from "lucide-react";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";

const navItems: NavItem[] = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/orders", label: "My Orders", icon: ClipboardList },
  { href: "/portal/bookings", label: "Bookings", icon: Calendar },
  { href: "/portal/estimates", label: "Estimates", icon: FileText },
  { href: "/portal/quotes", label: "Quotes", icon: Receipt },
  { href: "/portal/profile", label: "Profile", icon: User },
];

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout navItems={navItems} title="Menu">
      {children}
    </DashboardLayout>
  );
}
