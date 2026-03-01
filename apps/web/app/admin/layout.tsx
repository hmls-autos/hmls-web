"use client";

import {
  BarChart3,
  Calendar,
  FileText,
  LayoutDashboard,
  Menu,
  Receipt,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/AuthProvider";
import { fetcher } from "@/lib/fetcher";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
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
  const { session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check admin role by hitting the dashboard endpoint
  const { error: adminError, isLoading: adminLoading } = useSWR(
    session ? "/api/admin/dashboard" : null,
    fetcher,
  );

  useEffect(() => {
    if (!authLoading && !session) {
      router.push("/login");
    }
  }, [authLoading, session, router]);

  // Close sidebar on route change (mobile)
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally close sidebar when pathname changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (authLoading || adminLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="w-6 h-6 border-2 border-red-primary border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!session) return null;

  if (adminError) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-10 h-10 text-text-secondary mx-auto mb-3" />
          <h1 className="text-lg font-display font-bold text-text mb-1">
            Access Denied
          </h1>
          <p className="text-sm text-text-secondary">
            You don&apos;t have admin access.
          </p>
        </div>
      </main>
    );
  }

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
          <span className="text-sm font-medium text-text-secondary">Admin</span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-surface-alt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-4 mb-4 hidden md:block">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
            Admin Panel
          </span>
        </div>
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/admin"
                ? pathname === "/admin"
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
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-surface-alt"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-text-secondary">
            {navItems.find((n) =>
              n.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(n.href),
            )?.label ?? "Admin"}
          </span>
        </div>
        <div className="p-4 md:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
