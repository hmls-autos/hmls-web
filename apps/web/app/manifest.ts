import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HMLS Mobile Mechanic",
    short_name: "HMLS",
    description:
      "Expert mobile mechanic service in Orange County. We come to you.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#dc2626",
  };
}
