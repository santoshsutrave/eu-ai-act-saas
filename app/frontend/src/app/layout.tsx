import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EU AI Act Compliance Platform",
  description: "AI system registration and risk classification under the EU AI Act",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
