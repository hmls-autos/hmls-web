import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/chat", "/login", "/auth/"],
    },
    sitemap: "https://hmls.autos/sitemap.xml",
  };
}
