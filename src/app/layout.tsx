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

const SITE_NAME = "Candy Camera";
const OG_IMAGE = "/image/og-image.png";

export const metadata: Metadata = {
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "相模原祭2025宮治ゼミナールにて展示中。質問に答えて、あなただけのオリジナルのりんご飴を生み出そう！",
  icons: "/image/favicon.webp",
  openGraph: {
    title: SITE_NAME,
    description: "相模原祭2025宮治ゼミナールにて展示中。質問に答えて、あなただけのオリジナルのりんご飴を生み出そう！",
    url: "https://candy-camera.vercel.app/",
    siteName: SITE_NAME,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt:` ${SITE_NAME} OGP`
},],
    locale: "ja_JP",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "相模原祭2025宮治ゼミナールにて展示中。質問に答えて、あなただけのオリジナルのりんご飴を生み出そう！",
    images: [OG_IMAGE],
    creator: "@miyaji_lab",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates : {
    canonical: "https://candy-camera.vercel.app/",
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
