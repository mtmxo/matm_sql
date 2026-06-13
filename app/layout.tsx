import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "sql-trainer - esercizi SQL",
  description: "Allenati con le query SQL su tabelle di esempio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
