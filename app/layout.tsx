import type { Metadata, Viewport } from "next";
import "./globals.css";
import CursorTubes from "@/components/CursorTubes";

export const metadata: Metadata = {
  title: "TB tizimi — Buxoro lokomotiv deposi (TCH-6)",
  description:
    "Texnika xavfsizligi va omborxona boshqaruvining raqamli tizimi. Effektlar prototipi.",
};

export const viewport: Viewport = {
  themeColor: "#05090f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body className="noise antialiased">
        <CursorTubes />
        {children}
      </body>
    </html>
  );
}
