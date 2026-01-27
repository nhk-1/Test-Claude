import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "FitTracker - Gestion de séances de sport",
  description: "Application de suivi et gestion de vos entraînements sportifs",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "FitTracker",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className="font-sans antialiased bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100"
      >
        <AppProvider>
          <Navigation />
          <main className="pb-20 md:pb-4 md:pt-20 min-h-screen">
            <div className="max-w-4xl mx-auto px-4 py-6">
              {children}
            </div>
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
