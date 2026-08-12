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
  async rewrites() {
    const backend =
      process.env.BACKEND_URL ||
      (process.env.VERCEL ? "https://bacenddepotb-production.up.railway.app" : "");

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
