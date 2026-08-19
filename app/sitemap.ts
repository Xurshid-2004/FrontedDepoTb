import type { MetadataRoute } from "next";

import { ASOS_URL } from "@/lib/sayt";

// Faqat kirish sahifasi. Ichki sahifalarni bu yerga qoʻshib boʻlmaydi:
// ular autentifikatsiya ortida va Google ularni ochib ham koʻra olmaydi.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: ASOS_URL,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
