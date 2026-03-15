"use client";

import dynamic from "next/dynamic";

const RealMap = dynamic(() => import("@/components/ui/RealMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-surface-alt animate-pulse rounded-xl" />
  ),
});

export default function LazyMap({ className }: { className?: string }) {
  return <RealMap className={className} />;
}
