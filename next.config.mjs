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
};

export default nextConfig;
