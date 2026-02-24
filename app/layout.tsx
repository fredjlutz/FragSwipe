import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "FragSwipe - Marine Life Marketplace",
  description: "A mobile-optimised web marketplace for buying and selling corals and marine life in South Africa.",
  metadataBase: new URL('https://fragswipe.co.za'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'FragSwipe - Marine Life Marketplace',
    description: 'The preferred way to trade corals and marine life in South Africa.',
    url: 'https://fragswipe.co.za',
    siteName: 'FragSwipe',
    locale: 'en_ZA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FragSwipe - Marine Life Marketplace',
    description: 'The preferred way to trade corals and marine life in South Africa.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
