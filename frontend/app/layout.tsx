import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MonEpice&Riz - Votre épicerie en ligne à Abidjan | Spécialités Escargots & Crabes",
  description: "Commandez vos produits d'épicerie en ligne et recevez-les en 3h à Abidjan. Magasins à Cocody et Koumassi. Spécialistes des escargots et crabes de qualité.",
  keywords: "épicerie, Abidjan, livraison, Cocody, Koumassi, courses en ligne, MonEpice&Riz, escargots, crabes, poissonnerie, San Pedro",
  openGraph: {
    title: "MonEpice&Riz - Votre épicerie en ligne à Abidjan | Spécialités Escargots & Crabes",
    description: "Commandez vos produits d'épicerie en ligne et recevez-les en 3h à Abidjan. Magasins à Cocody et Koumassi. Spécialistes des escargots et crabes.",
    type: "website",
    locale: "fr_CI",
    url: "https://monepiceriz.ci",
    siteName: "MonEpice&Riz",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow pb-20 md:pb-0">
            {children}
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
