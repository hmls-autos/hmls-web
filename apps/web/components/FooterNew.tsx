import Link from "next/link";

export default function FooterNew() {
  return (
    <footer className="w-full border-t-4 tread-border bg-footer-bg">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="text-lg font-display font-bold text-footer-text">
              HMLS Mobile Mechanic
            </div>
            <div className="text-sm text-footer-muted">Orange County, CA</div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-footer-muted">
            <Link
              href="#services"
              className="hover:text-red-primary transition-colors"
            >
              Services
            </Link>
            <Link
              href="#about"
              className="hover:text-red-primary transition-colors"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:text-red-primary transition-colors"
            >
              Contact
            </Link>
            <Link
              href="/terms"
              className="hover:text-red-primary transition-colors"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-red-primary transition-colors"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-footer-border text-sm text-footer-dim">
          <span suppressHydrationWarning>
            &copy; {new Date().getFullYear()} HMLS. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
