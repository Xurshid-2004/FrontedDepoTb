import type { Metadata, Viewport } from "next";
import "./globals.css";
import CursorTubes from "@/components/CursorTubes";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "TB tizimi — Buxoro lokomotiv deposi (TCH-6)",
  description:
    "Texnika xavfsizligi va omborxona boshqaruvining raqamli tizimi. TEMIRYOʻLINFRATUZILMA AJ, Buxoro lokomotiv deposi filiali.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "TB tizimi" },
};

export const viewport: Viewport = {
  themeColor: "#05090f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
