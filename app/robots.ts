import type { MetadataRoute } from "next";

import { ASOS_URL } from "@/lib/sayt";

// Ochiq sahifa bitta — kirish oynasi (`/`). Qolgan hamma narsa tabel
// raqami ortida: xodimlar maʼlumoti, ombor qoldigʻi, hujjatlar. Ular
// qidiruvga tushmasligi kerak, shuning uchun bu yerda ataylab roʻyxat
// bilan yopiladi — «login talab qilinadi» degan gap qidiruv robotini
// toʻxtatmaydi, u sahifa manzilini baribir indeksga qoʻyadi.
const YOPIQ = [
  "/api/",
  "/lab",
  "/verify/",
  "/admin",
  "/arizalar",
  "/arxiv",
  "/dash",
  "/hisobot",
  "/hujjatlar",
  "/ishchi",
  "/kartochka/",
  "/kip",
  "/ombor",
  "/talon",
  "/tb",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/$", disallow: YOPIQ }],
    sitemap: `${ASOS_URL}/sitemap.xml`,
    host: ASOS_URL,
  };
}
