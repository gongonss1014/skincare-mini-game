import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Skincare Playground",
  description: "Playable nostalgic skincare mini-game prototype",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
