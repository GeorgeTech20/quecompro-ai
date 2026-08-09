import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { SITE_NAME, SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const clerkLocalization = {
  ...esES,
  signIn: {
    ...esES.signIn,
    start: {
      ...esES.signIn?.start,
      subtitle: "para continuar a QuéComproo",
    },
  },
  signUp: {
    ...esES.signUp,
    start: {
      ...esES.signUp?.start,
      subtitle: "para crear tu cuenta en QuéComproo",
    },
  },
};

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  applicationName: SITE_NAME,
  title: {
    default: "QuéComproo — la despensa viva de tu casa",
    template: "%s · QuéComproo",
  },
  description:
    "Carrito de compras compartido en vivo con una IA que puntúa la salud de lo que agregas, busca el precio más barato y cuida el presupuesto del mes.",
  keywords: [
    "lista de compras compartida",
    "carrito de compras compartido",
    "comparar precios de supermercados en Perú",
    "control de presupuesto del hogar",
    "despensa digital",
    "asistente de compras con IA",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "shopping",
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    title: "QuéComproo — la despensa viva de tu casa",
    description:
      "Tu pareja, tus roomies y una IA de cocina llenan el mercado contigo, en vivo, antes de que gastes de más.",
    type: "website",
    locale: "es_PE",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary_large_image",
    title: "QuéComproo, tu carrito de compras compartido",
    description:
      "Compra con tu casa en tiempo real, compara precios y cuida el presupuesto con ayuda de IA.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang="es-PE" className={`${inter.variable} h-full antialiased`}>
        <body className="bg-canvas text-ink flex min-h-full flex-col">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
