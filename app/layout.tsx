import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { StoreProvider } from "@/providers/StoreProvider";
import StoreBanner from "@/components/store/StoreBanner";
import { ErrorBoundary } from "@sentry/nextjs";
import { env } from "@/lib/config/environment";

// Import Sentry client configuration
import "@/sentry.client.config";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: `${env.app.name} - Votre épicerie en ligne à Abidjan | Spécialités Escargots & Crabes`,
  description: "Commandez vos produits d'épicerie en ligne et recevez-les en 3h à Abidjan. Magasins à Cocody et Koumassi. Spécialistes des escargots et crabes de qualité.",
  keywords: "épicerie, Abidjan, livraison, Cocody, Koumassi, courses en ligne, MonEpice&Riz, escargots, crabes, poissonnerie, San Pedro",
  authors: [{ name: "MonEpice&Riz Team" }],
  creator: "MonEpice&Riz",
  publisher: "MonEpice&Riz",
  formatDetection: {
    email: false,
    address: false,
    telephone: true,
  },
  openGraph: {
    title: `${env.app.name} - Votre épicerie en ligne à Abidjan | Spécialités Escargots & Crabes`,
    description: "Commandez vos produits d'épicerie en ligne et recevez-les en 3h à Abidjan. Magasins à Cocody et Koumassi. Spécialistes des escargots et crabes.",
    type: "website",
    locale: "fr_CI",
    url: env.app.url,
    siteName: env.app.name,
    images: [
      {
        url: `${env.app.url}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: `${env.app.name} - Épicerie en ligne à Abidjan`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${env.app.name} - Votre épicerie en ligne à Abidjan`,
    description: "Spécialistes des escargots et crabes de qualité. Livraison en 3h à Abidjan.",
    images: [`${env.app.url}/og-image.jpg`],
  },
  robots: {
    index: env.app.nodeEnv === 'production',
    follow: env.app.nodeEnv === 'production',
    googleBot: {
      index: env.app.nodeEnv === 'production',
      follow: env.app.nodeEnv === 'production',
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add Google Search Console verification when available
    // google: 'your-google-verification-code',
  },
};

/**
 * Custom Error Fallback Component for Sentry ErrorBoundary
 */
function ErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
        <div className="mb-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <svg
              className="h-6 w-6 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Oups ! Une erreur s'est produite
        </h1>
        <p className="text-sm text-gray-600 mb-6">
          Nous avons été informés du problème et travaillons à le résoudre.
        </p>
        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors"
          >
            Réessayer
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ErrorBoundary
          fallback={ErrorFallback}
          beforeCapture={(scope) => {
            scope.setTag("location", "root_layout");
          }}
        >
          <QueryProvider>
            <StoreProvider>
              <AuthProvider>
                <div className="min-h-screen flex flex-col">
                  <Header />
                  <StoreBanner variant="compact" isDismissible />
                  <main className="flex-grow pb-20 md:pb-0">
                    {children}
                  </main>
                  <Footer />
                </div>
              </AuthProvider>
            </StoreProvider>
          </QueryProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
