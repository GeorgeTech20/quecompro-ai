import { ClerkProvider } from "@clerk/nextjs";
import { esES } from "@clerk/localizations";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "QueCompro.ai — la despensa viva de tu casa",
    template: "%s · QueCompro.ai",
  },
  description:
    "Carrito de compras compartido en vivo con una IA que puntúa la salud de lo que agregas, busca el precio más barato y cuida el presupuesto del mes.",
  openGraph: {
    title: "QueCompro.ai — la despensa viva de tu casa",
    description:
      "Tu pareja, tus roomies y una IA de cocina llenan el mercado contigo, en vivo, antes de que gastes de más.",
    type: "website",
    locale: "es_PE",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider localization={esES}>
      <html lang="es-PE" className={`${inter.variable} h-full antialiased`}>
        <body className="bg-canvas text-ink flex min-h-full flex-col">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
