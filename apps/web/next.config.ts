import { resolve } from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: resolve(import.meta.dirname || __dirname),
  },
};

export default nextConfig;
