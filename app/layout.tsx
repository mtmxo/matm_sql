import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "matm_sql - esercizi SQL",
  description: "Allenati con le query SQL su tabelle di esempio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
