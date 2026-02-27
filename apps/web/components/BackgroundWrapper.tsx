"use client";

import dynamic from "next/dynamic";

const FluidBackground = dynamic(() => import("./FluidBackground"), {
  ssr: false,
});

export default function BackgroundWrapper() {
  return <FluidBackground />;
}
