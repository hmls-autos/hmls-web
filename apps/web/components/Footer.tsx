import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t-4 tread-border bg-text py-12 z-10 relative">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-neutral-400 text-sm">
        <div>
          <span className="text-white text-lg font-display font-bold mr-2">
            HMLS.
          </span>
          &copy; {new Date().getFullYear()} Mobile Mechanic
        </div>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="hover:text-red-primary transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-red-primary transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="hover:text-red-primary transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
