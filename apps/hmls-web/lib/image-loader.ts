"use client";

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

// Deno Deploy has no runtime image optimizer, so we pre-generate WebP
// variants for hot images and map srcset widths to the closest pre-generated
// size. Each entry lists the widths available on disk.
const PREGEN: Record<string, readonly number[]> = {
  "engine-bay-mercedes": [640, 960, 1280, 1920],
  "engine-bay": [640, 960, 1280],
};

export default function imageLoader({ src, width }: ImageLoaderParams): string {
  for (const [base, widths] of Object.entries(PREGEN)) {
    if (src.startsWith(`/images/${base}`)) {
      const chosen =
        widths.find((w) => w >= width) ?? widths[widths.length - 1];
      return `/images/${base}-${chosen}.webp`;
    }
  }
  return src;
}
