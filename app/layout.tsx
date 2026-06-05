import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PlaceShelf",
  description: "Listas inteligentes de sitios, listas propias y enlaces oficiales a Google Maps."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
