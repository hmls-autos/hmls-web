"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/contact", label: "Contact" },
  { href: "/chat", label: "Chat" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, supabase, isLoading } = useAuth();
  const isUserLoggedIn = !!user;

  // Hide navbar on login page
  if (pathname === "/login") return null;

  return (
    <header className="relative shrink-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-display font-bold tracking-tight text-text"
        >
          HMLS<span className="text-red-primary">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? "text-red-primary"
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
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-border text-text hover:border-red-primary hover:text-red-primary transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            ))}
          <Link
            href="/chat"
            className="px-5 py-2 bg-red-primary text-white text-sm font-medium rounded-lg hover:bg-red-dark transition-colors"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile nav */}
        <MobileNav />
      </nav>
    </header>
  );
}
