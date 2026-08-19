import type { Metadata, Viewport } from "next";
import "./globals.css";
import CursorTubes from "@/components/CursorTubes";
import { StoreProvider } from "@/lib/store";
import { ASOS_URL } from "@/lib/sayt";

export const metadata: Metadata = {
  // Nisbiy manzillar (sitemap, canonical, og:image) shu asosga nisbatan
  // toʻliq URL'ga aylanadi. Boʻlmasa Next.js localhost'ni qoʻyadi.
  metadataBase: new URL(ASOS_URL),
  // Apex `www` ga yoʻnaltiriladi — kanonik manzil ham oʻsha boʻlsin.
  alternates: { canonical: "/" },
  title: "TB tizimi — Buxoro lokomotiv deposi (TCH-6)",
  description:
    "Texnika xavfsizligi va omborxona boshqaruvining raqamli tizimi. TEMIRYOʻLINFRATUZILMA AJ, Buxoro lokomotiv deposi filiali.",
  applicationName: "TB tizimi",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "TB tizimi" },

  // Bosh ekranga qoʻshilganda tizim shu ikonkalarni oladi. iOS SVG'ni
  // qabul qilmaydi — u yerda PNG boʻlmasa, yorliq oʻrniga sahifaning
  // surati chiqib qoladi.
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },

  // Tabel raqamlari (masalan 10427) iOS'da avtomatik telefon havolasiga
  // aylanib, koʻk rangda chizilib ketardi va bosilganda qoʻngʻiroq
  // oynasini ochardi. Bu yerda raqamlar — hujjat maʼlumoti, telefon emas.
  formatDetection: { telephone: false, date: false, address: false },
};

export const viewport: Viewport = {
  // Ilova rejimida holat qatori shu rang bilan boʻyaladi. Ilovaning
  // sarlavhasi oq — shuning uchun oq: chegara koʻrinmaydi va yagona
  // yaxlit sirt hosil boʻladi.
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  // Ekran chetlarigacha — «qulogʻi» bor telefonlarda mazmun butun ekranga
  // yoyiladi, xavfsiz zonalar esa CSS'dagi --safe-* orqali hisobga olinadi.
  viewportFit: "cover",
  // Klaviatura ochilganda maket qayta oʻlchanadi: shunda 100dvh haqiqiy
  // boʻsh joyni bildiradi va kirish kartasi klaviatura ostida qolmaydi.
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className="noise antialiased">
        <StoreProvider>
          <CursorTubes />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
