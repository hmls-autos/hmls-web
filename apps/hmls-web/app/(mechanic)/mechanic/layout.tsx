"use client";

import { CalendarCheck, CalendarDays, CalendarOff } from "lucide-react";
import { DashboardLayout, type NavItem } from "@/components/DashboardLayout";
import Navbar from "@/components/Navbar";

const navItems: NavItem[] = [
  { href: "/mechanic", label: "My Bookings", icon: CalendarCheck },
  { href: "/mechanic/availability", label: "Weekly Hours", icon: CalendarDays },
  { href: "/mechanic/time-off", label: "Time Off", icon: CalendarOff },
];

export default function MechanicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      <DashboardLayout
        navItems={navItems}
        title="Mechanic"
        maxWidth="max-w-5xl"
        mechanicCheck
        adminPanelLabel="Mechanic Panel"
      >
        {children}
      </DashboardLayout>
    </>
  );
}
