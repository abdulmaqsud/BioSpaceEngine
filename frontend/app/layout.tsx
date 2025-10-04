import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BioSpace Knowledge Engine",
  description: "AI-powered exploration of NASA Space Biology research",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-transparent text-slate-100`}
        suppressHydrationWarning
      >
        <div className="relative min-h-screen">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(15,155,255,0.15),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(148,78,255,0.12),transparent_60%),radial-gradient(circle_at_50%_90%,rgba(16,88,216,0.12),transparent_55%)]" aria-hidden />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(3,7,18,0.85),rgba(12,10,35,0.92))] backdrop-blur-sm" aria-hidden />
          <div className="relative">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
