import Link from "next/link";
import MobileNav from "./MobileNav";
import ThemeToggle from "./ThemeToggle";

export default function NavbarNew() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/80 backdrop-blur-md border-b border-border">
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-display font-bold tracking-tight text-text"
        >
          HMLS<span className="text-red-primary">.</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#services"
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            Services
          </Link>
          <Link
            href="#about"
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-sm text-text-secondary hover:text-text transition-colors"
          >
            Contact
          </Link>
          <ThemeToggle />
          <Link
            href="/chat"
            className="px-5 py-2 bg-red-primary text-white text-sm font-medium rounded-lg hover:bg-red-dark transition-colors"
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
