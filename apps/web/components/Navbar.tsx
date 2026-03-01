"use client";

import { LayoutDashboard, LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
  { href: "/chat", label: "Chat" },
];

const authLinks = [
  { href: "/portal", label: "My Portal" },
  { href: "/admin", label: "Admin", icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, supabase, isLoading } = useAuth();
  const isUserLoggedIn = !!user;
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  const isTransparent = isHome && !scrolled;

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        isTransparent
          ? "bg-transparent border-b border-transparent"
          : "bg-background/90 backdrop-blur-md border-b border-border"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className={`text-xl font-display font-bold tracking-tight transition-colors ${
            isTransparent ? "text-white" : "text-text"
          }`}
        >
          HMLS<span className="text-red-primary">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors rounded focus-visible:ring-2 focus-visible:ring-red-primary ${
                pathname === href
                  ? "text-red-400"
                  : isTransparent
                    ? "text-white/70 hover:text-white"
                    : "text-text-secondary hover:text-text"
              }`}
            >
              {label}
            </Link>
          ))}
          {isUserLoggedIn &&
            authLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`text-sm transition-colors rounded focus-visible:ring-2 focus-visible:ring-red-primary ${
                  pathname.startsWith(href)
                    ? "text-red-400"
                    : isTransparent
                      ? "text-white/70 hover:text-white"
                      : "text-text-secondary hover:text-text"
                }`}
              >
                {label}
              </Link>
            ))}
          <ThemeToggle />
          {!isLoading &&
            (isUserLoggedIn ? (
              <button
                type="button"
                onClick={() => supabase.auth.signOut()}
                className={`flex items-center gap-2 text-sm transition-colors rounded focus-visible:ring-2 focus-visible:ring-red-primary ${
                  isTransparent
                    ? "text-white/70 hover:text-white"
                    : "text-text-secondary hover:text-text"
                }`}
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  isTransparent
                    ? "border-white/30 text-white hover:border-white/60"
                    : "border-border text-text hover:border-red-500/50 hover:text-red-400"
                }`}
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            ))}
          <Link
            href="/chat"
            className="relative px-5 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors overflow-hidden group/quote"
          >
            <span
              className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/30 to-transparent opacity-0 group-hover/quote:opacity-100 transition-opacity duration-300 pointer-events-none"
              aria-hidden="true"
            />
            <span className="relative">Get a Quote</span>
          </Link>
        </div>

        {/* Mobile nav */}
        <MobileNav isTransparent={isTransparent} />
      </nav>

      {/* Machined groove accent line */}
      {!isTransparent && (
        <div
          className="absolute bottom-0 left-0 right-0 h-px machined-groove-horizontal"
          aria-hidden="true"
        />
      )}
    </header>
  );
}
