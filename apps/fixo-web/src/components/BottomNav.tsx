"use client";

import { Car, Clock, MessageSquare, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat", icon: MessageSquare },
  { href: "/history", label: "History", icon: Clock },
  { href: "/vehicles", label: "Vehicles", icon: Car },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center gap-1 px-4 py-2.5 text-[11px] font-medium tracking-tight transition-colors ${
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon
                className="h-[18px] w-[18px]"
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span>{label}</span>
              {isActive && (
                <span
                  aria-hidden
                  className="absolute -top-px left-1/2 h-[2px] w-8 -translate-x-1/2 rounded-full bg-accent"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
