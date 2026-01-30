import Link from "next/link";

export default function FooterNew() {
  return (
    <footer className="w-full border-t border-cream-200 bg-cream-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="text-lg font-serif text-charcoal mb-1">
              HMLS Mobile Mechanic
            </div>
            <div className="text-sm text-charcoal-light">Orange County, CA</div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-charcoal-light">
            <Link
              href="#services"
              className="hover:text-charcoal transition-colors"
            >
              Services
            </Link>
            <Link
              href="#about"
              className="hover:text-charcoal transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:text-charcoal transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/terms"
              className="hover:text-charcoal transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-charcoal transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-cream-200 text-sm text-charcoal-light">
          © {new Date().getFullYear()} HMLS. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
