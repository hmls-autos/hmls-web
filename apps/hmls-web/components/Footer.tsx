import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-neutral-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div>
            <div className="text-xl font-display font-bold text-white">
              HMLS<span className="text-red-500">.</span>
            </div>
            <div className="text-sm text-white/40 mt-1">
              Mobile Mechanic &bull; Orange County, CA
            </div>
          </div>

          <div className="flex flex-wrap gap-8 text-sm text-white/40">
            <Link
              href="#services"
              className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-primary rounded"
            >
              Services
            </Link>
            <Link
              href="#about"
              className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-primary rounded"
            >
              About
            </Link>
            <Link
              href="/contact"
              className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-primary rounded"
            >
              Contact
            </Link>
            <Link
              href="/terms"
              className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-primary rounded"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="hover:text-white transition-colors focus-visible:ring-2 focus-visible:ring-red-primary rounded"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 text-sm text-white/30">
          <span suppressHydrationWarning>
            &copy; {new Date().getFullYear()} HMLS. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}
