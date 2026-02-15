"use client";

import { LogIn, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export default function Navbar() {
  const pathname = usePathname();
  const { user, supabase } = useAuth();
  const isUserLoggedIn = !!user;

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex justify-between items-center bg-white/80 backdrop-blur-md border-b border-border">
        <Link
          href="/"
          className="text-xl font-display font-bold tracking-tight text-text"
        >
          HMLS<span className="text-red-primary">.</span>
        </Link>

        <div className="hidden md:flex gap-8 text-sm text-text-secondary absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className={`hover:text-red-primary transition-colors ${
              isActive("/") ? "text-red-primary" : ""
            }`}
          >
            Home
          </Link>
          <Link
            href="/contact"
            className={`hover:text-red-primary transition-colors ${
              isActive("/contact") ? "text-red-primary" : ""
            }`}
          >
            Contact
          </Link>
          <Link
            href="/chat"
            className={`hover:text-red-primary transition-colors ${
              isActive("/chat") ? "text-red-primary" : ""
            }`}
          >
            Chat
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isUserLoggedIn ? (
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium border border-border text-text hover:border-red-primary hover:text-red-primary transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
          {isUserLoggedIn && (
            <Link
              href="/contact"
              className="px-5 py-2 rounded-lg text-sm font-medium bg-red-primary text-white hover:bg-red-dark transition-colors"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
