import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-inter",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-playfair",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Doris — 2019 Citroën Jumper H2L2 Motorhome For Sale",
  description:
    "Fully converted 2019 Citroën Jumper H2L2 motorhome for sale in Santiago, Chile. Premium finishes, LiFePO4 + Victron electrical system, 130L fresh water, marble-finish shower with gold fittings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-body antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
