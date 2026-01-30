import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { AppProvider } from "@/context/AppContext";
import { ThemeProvider } from "@/context/ThemeContext";
import Navigation from "@/components/Navigation";
import KeyboardShortcutsProvider from "@/components/KeyboardShortcutsProvider";

export const metadata: Metadata = {
  title: "FitTracker - Gestion de séances de sport",
  description: "Application de suivi et gestion de vos entraînements sportifs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitTracker",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="touch-manipulation">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>
            <AppProvider>
              <KeyboardShortcutsProvider>
                {/* Full screen background layer */}
                <div className="app-bg" />

                {/* Main app container */}
                <div className="app-container">
                  {/* Scrollable content */}
                  <main className="app-main">
                    <div className="app-content">
                      {children}
                    </div>
                  </main>

                  {/* Navigation at bottom (mobile) or top (desktop) */}
                  <Navigation />
                </div>
              </KeyboardShortcutsProvider>
            </AppProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
