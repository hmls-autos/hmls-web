"use client";

import { BarChart3, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { useAuth } from "@/components/AuthProvider";
import { Spinner } from "@/components/ui/Spinner";
import { fetcher } from "@/lib/fetcher";

export interface NavItem {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export function DashboardLayout({
  navItems,
  title,
  maxWidth = "max-w-5xl",
  adminCheck,
  adminPanelLabel,
  children,
}: {
  navItems: NavItem[];
  title: string;
  maxWidth?: string;
  adminCheck?: boolean;
  adminPanelLabel?: string;
  children: React.ReactNode;
}) {
  const { session, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { error: adminError, isLoading: adminLoading } = useSWR(
    adminCheck && session ? "/api/admin/dashboard" : null,
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

  const isLoading = authLoading || (adminCheck && adminLoading);

  if (isLoading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Spinner />
      </main>
    );
  }

  if (!session) return null;

  if (adminCheck && adminError) {
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

  const basePath = navItems[0]?.href?.replace(/\/[^/]*$/, "") ?? "/";

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
          <span className="text-sm font-medium text-text-secondary">
            {title}
          </span>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded hover:bg-surface-alt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {adminPanelLabel && (
          <div className="px-4 mb-4 hidden md:block">
            <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
              {adminPanelLabel}
            </span>
          </div>
        )}
        <nav className="flex flex-col gap-1 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === basePath
                ? pathname === basePath
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
        <div className={`p-4 md:p-8 ${maxWidth} mx-auto`}>{children}</div>
      </main>
    </div>
  );
}
