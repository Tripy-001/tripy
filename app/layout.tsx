import type { Metadata } from "next";
import { Geist, Geist_Mono, Lexend } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Navigation from "@/components/Navigation";
import { Toaster } from "@/components/ui/sonner";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const lexend = Lexend({
  variable: "--font-lexend",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tripy - AI-Powered Trip Suggestions",
  description: "Discover your next adventure with AI-powered trip suggestions tailored to your preferences",
  other: {
    'preload-logo': '/images/tripy-app-logo.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" as="image" href="/images/tripy-app-logo.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${lexend.variable} antialiased`}
      >
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme') || 'light';
                  var themeColor = localStorage.getItem('theme-color') || 'default';
                  
                  // Apply mode (light/dark)
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  
                  // Apply color variant
                  if (themeColor && themeColor !== 'default') {
                    document.documentElement.setAttribute('data-theme', themeColor);
                  } else {
                    document.documentElement.removeAttribute('data-theme');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <AuthProvider>
          <Toaster />
          <Navigation />
          <main>
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
