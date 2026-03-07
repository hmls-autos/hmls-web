"use client";

import {
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Receipt,
  Users,
} from "lucide-react";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/estimates", label: "Estimates", icon: FileText },
  { href: "/admin/quotes", label: "Quotes", icon: Receipt },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout
      navItems={navItems}
      title="Admin"
      maxWidth="max-w-6xl"
      adminCheck
      adminPanelLabel="Admin Panel"
    >
      {children}
    </DashboardLayout>
  );
}
