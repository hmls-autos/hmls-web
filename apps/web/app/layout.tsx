import type { Metadata } from "next";
import { Barlow, Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${barlow.variable} font-sans antialiased bg-background text-text h-screen overflow-hidden flex flex-col`}
      >
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "HMLS Mobile Mechanic",
            url: "https://hmls.autos",
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthProvider>
            <Navbar />
            <div className="flex-1 overflow-y-auto">
              {children}
              <ChatWidget />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
