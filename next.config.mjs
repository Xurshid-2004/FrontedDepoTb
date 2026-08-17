/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `standalone` — Docker uchun ixcham build (server.js bilan).
  // Vercel oʻz build tizimini ishlatadi va bu rejim u yerda keraksiz,
  // shuning uchun Vercel'da (VERCEL=1) oʻchiriladi.
  output: process.env.VERCEL ? undefined : "standalone",
  outputFileTracingIncludes: {
    "/api/documents/**": ["./assets/fonts/**"],
  },
  serverExternalPackages: ["pdf-lib", "@pdf-lib/fontkit"],

  // Vercel'da API manzili panel oʻzgaruvchisidan EMAS, quyidagi rewrite
  // orqali aniqlanadi.
  //
  // Sabab: panelda NEXT_PUBLIC_API_BASE eski servis manziliga sozlangan
  // qolib ketgan edi (tb-api-production-a420) — u endi oʻchirilgan va
  // 503/429 qaytaradi. Brauzer soʻrovlari oʻsha yerga ketgani uchun
  // kirish ishlamasdi. Panel oʻzgaruvchisi build'ga yozilib qolgani
  // uchun rewrite ham chetlab oʻtilardi: lib/api.ts manzil boʻsh
  // boʻlmasa toʻliq URL ishlatadi.
  //
  // Bu bayroq lib/api.ts ga manzilni boʻsh qoldirishni aytadi: soʻrov
  // shu domendan ketadi va rewrite uni Django'ga uzatadi. Backend
  // manzilini oʻzgartirish kerak boʻlsa — BACKEND_URL (rewrite manbasi).
  env: {
    NEXT_PUBLIC_API_PROXY: process.env.VERCEL ? "1" : "",
  },

  // Vercel'da frontend va Django alohida domenlarda turadi. Brauzer
  // soʻrovni shu domenga yuboradi, Vercel esa uni Django'ga uzatadi —
  // shunda NEXT_PUBLIC_API_BASE ni sozlash shart emas (u build vaqtida
  // kodga yoziladigan oʻzgaruvchi: sozlamani oʻzgartirgach har safar
  // qayta build qilish kerak boʻlardi) va CORS ham oʻrtaga tushmaydi.
  //
  // Docker/Caddy oʻrnatmasida rewrite kerak emas: u yerda Caddy bitta
  // domendan /api ni proxy qiladi. Shuning uchun faqat Vercel muhitida
  // yoqiladi; BACKEND_URL bilan har qanday muhitda bekor qilish mumkin.
  //
  // Faqat /api/v1/* uzatiladi — /api/documents/* Next.js'ning oʻz
  // marshruti (PDF yigʻadi) va u joyida qolishi kerak.
  // Zaxira manzil — Vercel panelida BACKEND_URL sozlanmagan boʻlsa ishlatiladi.
  // Backend DigitalOcean Droplet'da (Frankfurt), Postgres va HTTPS shu
  // serverning oʻzida. sslip.io IP'ni domenga aylantiradi — shuning uchun
  // Let's Encrypt sertifikat bera oladi va domen sotib olish shart emas.
  //
  // Bu qiymat app/api/documents/[turi]/[id]/route.ts dagi zaxira bilan
  // BIR XIL boʻlishi kerak — sahifalar va hujjat generatori ayni bitta
  // backend'ga murojaat qilishi uchun.
  async rewrites() {
    const backend =
      process.env.BACKEND_URL ||
      (process.env.VERCEL ? "https://164.92.205.84.sslip.io" : "");

    if (!backend) return [];

    return [
      {
        source: "/api/v1/:path*",
        destination: `${backend.replace(/\/$/, "")}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
