import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Map Studio - Spatial Data Editor",
  description: "Web-based spatial data editor like QGIS/Felt.com",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}