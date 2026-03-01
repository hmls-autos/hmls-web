"use client";

import {
  Calendar,
  FileText,
  LayoutDashboard,
  Receipt,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const navItems = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
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
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/login");
    }
  }, [isLoading, session, router]);

  // Close sidebar on route change (mobile)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally close sidebar when pathname changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!session) return null;

  return (
    <div className="flex flex-1 min-h-0">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/40 md:hidden appearance-none border-none cursor-default"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-16 z-50 md:z-auto h-[calc(100dvh-4rem)] w-60 bg-surface border-r border-border flex flex-col py-4 transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 mb-2 md:hidden">
          <span className="text-sm font-medium text-text-secondary">Menu</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-surface-alt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/portal"
                ? pathname === "/portal"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-red-light text-red-primary"
                    : "text-text-secondary hover:text-text hover:bg-surface-alt"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <div className="p-4 md:p-8 max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
