"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed top-0 w-full max-w-7xl px-6 py-6 flex justify-between items-center z-50 backdrop-blur-md border-b border-white/5 left-1/2 -translate-x-1/2 rounded-b-2xl">
      <Link
        href="/"
        className="text-2xl font-light tracking-tighter text-white"
      >
        hmls<span className="text-emerald-500">.</span>
      </Link>

      <div className="hidden md:flex gap-8 text-sm font-light text-gray-300">
        <Link
          href="/"
          className={`hover:text-emerald-400 transition-colors ${isActive("/") ? "text-emerald-400" : ""}`}
        >
          Home
        </Link>
        <Link
          href="/about"
          className={`hover:text-emerald-400 transition-colors ${isActive("/about") ? "text-emerald-400" : ""}`}
        >
          About
        </Link>
        <Link
          href="/services"
          className={`hover:text-emerald-400 transition-colors ${isActive("/services") ? "text-emerald-400" : ""}`}
        >
          Services
        </Link>
        <Link
          href="/chat"
          className={`hover:text-emerald-400 transition-colors ${isActive("/chat") ? "text-emerald-400" : ""}`}
        >
          Chat
        </Link>
        <Link
          href="/contact"
          className={`hover:text-emerald-400 transition-colors ${isActive("/contact") ? "text-emerald-400" : ""}`}
        >
          Contact
        </Link>
      </div>

      <Link
        href="/contact"
        className="glass-button px-6 py-2 rounded-full text-sm font-medium text-emerald-400 hover:text-emerald-300"
      >
        Book Now
      </Link>
    </nav>
  );
}
