import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import BackgroundWrapper from "@/components/BackgroundWrapper";
import { ChatWidget } from "@/components/ChatWidget";
import { JsonLd } from "@/components/JsonLd";
import Navbar from "@/components/Navbar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-barlow",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hmls.autos"),
  title: {
    default: "HMLS Mobile Mechanic - Orange County",
    template: "%s | HMLS Mobile Mechanic",
  },
  description:
    "Expert mobile mechanic service in Orange County. We come to you for oil changes, brake repair, diagnostics & more.",
  keywords: [
    "mobile mechanic",
    "Orange County",
    "auto repair",
    "car mechanic near me",
    "mobile car repair",
    "mobile mechanic Orange County",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "HMLS Mobile Mechanic",
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <meta
          name="theme-color"
          content="#fafafa"
          media="(prefers-color-scheme: light)"
        />
        <meta
          name="theme-color"
          content="#1c1917"
          media="(prefers-color-scheme: dark)"
        />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body
        className={`${inter.variable} ${barlow.variable} font-sans antialiased bg-background text-text min-h-dvh flex flex-col`}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-red-primary focus:text-white focus:rounded-lg focus:text-sm focus:font-medium"
        >
          Skip to content
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "HMLS Mobile Mechanic",
            url: "https://hmls.autos",
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <BackgroundWrapper />
          <AuthProvider>
            <Navbar />
            <div id="main-content" className="flex-1 flex flex-col">
              {children}
              <ChatWidget />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
