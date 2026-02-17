"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, close]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text"
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
            <Link
              href="#services"
              onClick={close}
              className="text-text-secondary hover:text-text transition-colors"
            >
              Services
            </Link>
            <Link
              href="#about"
              onClick={close}
              className="text-text-secondary hover:text-text transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={close}
              className="text-text-secondary hover:text-text transition-colors"
            >
              Contact
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-sm text-text-secondary">Theme</span>
            </div>
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
