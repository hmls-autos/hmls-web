"use client";

interface ImageLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

const HERO_WIDTHS = [640, 960, 1280, 1920] as const;

export default function imageLoader({ src, width }: ImageLoaderParams): string {
  // Deno Deploy has no runtime image optimizer, so we pre-generate variants
  // for hot images and map srcset widths to the closest pre-generated size.
  if (src.startsWith("/images/engine-bay-mercedes")) {
    const chosen =
      HERO_WIDTHS.find((w) => w >= width) ??
      HERO_WIDTHS[HERO_WIDTHS.length - 1];
    return `/images/engine-bay-mercedes-${chosen}.webp`;
  }
  return src;
}
