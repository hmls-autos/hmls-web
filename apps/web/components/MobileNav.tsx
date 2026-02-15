"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-text"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-surface border-b border-border p-6 shadow-lg">
          <div className="flex flex-col gap-4">
            <Link
              href="#services"
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-text"
            >
              Services
            </Link>
            <Link
              href="#about"
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-text"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="text-text-secondary hover:text-text"
            >
              Contact
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <span className="text-sm text-text-secondary">Theme</span>
            </div>
            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 bg-red-primary text-white text-center rounded-lg font-medium"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
