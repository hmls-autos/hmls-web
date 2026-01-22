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
      <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center backdrop-blur-md border-b border-white/5 rounded-b-2xl relative">
        <Link
          href="/"
          className="text-2xl font-light tracking-tighter text-white"
        >
          hmls<span className="text-emerald-500">.</span>
        </Link>

        <div className="hidden md:flex gap-8 text-sm font-light text-gray-300 absolute left-1/2 -translate-x-1/2">
          <Link
            href="/"
            className={`hover:text-emerald-400 transition-colors ${isActive("/") ? "text-emerald-400" : ""}`}
          >
            Home
          </Link>
          <Link
            href="/contact"
            className={`hover:text-emerald-400 transition-colors ${isActive("/contact") ? "text-emerald-400" : ""}`}
          >
            Contact
          </Link>
          <Link
            href="/chat"
            className={`hover:text-emerald-400 transition-colors ${isActive("/chat") ? "text-emerald-400" : ""}`}
          >
            Chat
          </Link>
        </div>

        <div className="flex items-center gap-4">
          {isUserLoggedIn ? (
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              className="glass-button flex items-center gap-2 px-6 py-2 rounded-full text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
          {isUserLoggedIn && (
            <Link
              href="/contact"
              className="glass-button px-6 py-2 rounded-full text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Book Now
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
