import type { MetadataRoute } from "next";
import { BUSINESS } from "@/lib/business";
import { CITIES, SERVICES } from "@/lib/seo-content";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = BUSINESS.url;
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified, changeFrequency: "weekly", priority: 1.0 },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/areas`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/services`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const cityEntries: MetadataRoute.Sitemap = CITIES.map((c) => ({
    url: `${baseUrl}/areas/${c.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const serviceEntries: MetadataRoute.Sitemap = SERVICES.map((s) => ({
    url: `${baseUrl}/services/${s.slug}`,
    lastModified,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [...staticEntries, ...cityEntries, ...serviceEntries];
}
