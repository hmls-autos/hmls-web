"use client";

import { usePathname } from "next/navigation";

/**
 * Wraps the route subtree with the main-content anchor + a fade-in animation
 * that replays on every route change. Using `usePathname` as a React key
 * forces a remount, which re-triggers the CSS `page-enter` animation.
 * Keeping this in a single client component avoids the layout/template
 * hydration mismatch we used to hit in Next.js 16 Turbopack.
 */
export function PageEnter({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      id="main-content"
      className="flex-1 flex flex-col page-enter"
    >
      {children}
    </div>
  );
}
