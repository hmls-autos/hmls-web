"use client";

import {
  Calendar,
  FileText,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  Receipt,
  User,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
  { href: "/chat", label: "Chat" },
];

const authLinks = [
  { href: "/portal", label: "My Portal" },
  { href: "/admin", label: "Admin" },
];

const portalSubNav = [
  { href: "/portal", label: "Dashboard", icon: LayoutDashboard },
  { href: "/portal/bookings", label: "Bookings", icon: Calendar },
  { href: "/portal/estimates", label: "Estimates", icon: FileText },
  { href: "/portal/quotes", label: "Quotes", icon: Receipt },
  { href: "/portal/profile", label: "Profile", icon: User },
];

const adminSubNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/bookings", label: "Bookings", icon: Calendar },
  { href: "/admin/estimates", label: "Estimates", icon: FileText },
  { href: "/admin/quotes", label: "Quotes", icon: Receipt },
];

export default function MobileNav({
  isTransparent = false,
}: {
  isTransparent?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, supabase, isLoading } = useAuth();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  // Close mobile nav on route change
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional trigger on pathname change
  useEffect(() => {
    close();
  }, [pathname, close]);

  const isOnPortal = pathname.startsWith("/portal");
  const isOnAdmin = pathname.startsWith("/admin");
  const subNav = isOnPortal ? portalSubNav : isOnAdmin ? adminSubNav : null;

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 focus-visible:ring-2 focus-visible:ring-red-primary rounded-lg transition-colors ${
          isTransparent && !isOpen ? "text-white" : "text-text"
        }`}
        aria-label="Toggle menu"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <nav
          aria-label="Mobile navigation"
          className="absolute top-16 left-0 right-0 bg-surface border-b border-border p-6 shadow-lg"
        >
          <div className="flex flex-col gap-4">
            {/* Sub-nav for portal/admin pages */}
            {subNav && (
              <>
                <div className="flex flex-col gap-1">
                  {subNav.map(({ href, label, icon: Icon }) => {
                    const isActive =
                      href === "/portal" || href === "/admin"
                        ? pathname === href
                        : pathname.startsWith(href);
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={close}
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
                </div>
                <div className="border-t border-border" />
              </>
            )}

            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={close}
                className={`text-sm transition-colors ${
                  pathname === href
                    ? "text-red-400 font-medium"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                {label}
              </Link>
            ))}
            {user &&
              authLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={close}
                  className={`text-sm transition-colors ${
                    pathname.startsWith(href)
                      ? "text-red-400 font-medium"
                      : "text-text-secondary hover:text-text"
                  }`}
                >
                  {label}
                </Link>
              ))}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-sm text-text-secondary">Theme</span>
            </div>
            {!isLoading &&
              (user ? (
                <button
                  type="button"
                  onClick={() => {
                    supabase.auth.signOut();
                    close();
                  }}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={close}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
              ))}
            <Link
              href="/chat"
              onClick={close}
              className="px-4 py-3 bg-red-primary text-white text-center rounded-lg font-medium hover:bg-red-dark transition-colors"
            >
              Get a Quote
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
