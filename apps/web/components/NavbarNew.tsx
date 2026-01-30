import Link from "next/link";
import MobileNav from "./MobileNav";

export default function NavbarNew() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream-50/80 backdrop-blur-md border-b border-cream-200">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-serif text-charcoal">
          HMLS
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#services"
            className="text-sm text-charcoal-light hover:text-charcoal transition-colors"
          >
            Services
          </Link>
          <Link
            href="#about"
            className="text-sm text-charcoal-light hover:text-charcoal transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-charcoal-light hover:text-charcoal transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/chat"
            className="px-4 py-2 bg-charcoal-dark text-cream-50 text-sm rounded-lg hover:bg-charcoal transition-colors"
          >
            Get a Quote
          </Link>
        </div>

        {/* Mobile nav toggle */}
        <MobileNav />
      </nav>
    </header>
  );
}
