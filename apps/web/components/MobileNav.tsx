"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-charcoal"
        aria-label="Toggle menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-cream-50 border-b border-cream-200 p-6">
          <div className="flex flex-col gap-4">
            <Link
              href="#services"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-light hover:text-charcoal"
            >
              Services
            </Link>
            <Link
              href="#about"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-light hover:text-charcoal"
            >
              About
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="text-charcoal-light hover:text-charcoal"
            >
              Contact
            </Link>
            <Link
              href="/chat"
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 bg-charcoal-dark text-cream-50 text-center rounded-lg"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
