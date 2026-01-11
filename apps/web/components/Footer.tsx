import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/5 py-12 bg-black z-10 relative">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-gray-600 text-sm font-light">
        <div>
          <span className="text-white text-lg font-medium mr-2">hmls.</span>
          &copy; {new Date().getFullYear()} Mobile Mechanic
        </div>
        <div className="flex gap-6">
          <Link
            href="/privacy"
            className="hover:text-emerald-500 transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="hover:text-emerald-500 transition-colors"
          >
            Terms
          </Link>
          <Link
            href="/contact"
            className="hover:text-emerald-500 transition-colors"
          >
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
