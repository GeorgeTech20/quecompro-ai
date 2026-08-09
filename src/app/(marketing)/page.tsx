import type { Metadata } from "next";

import { Features } from "@/components/landing/Features";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { LiveDemo } from "@/components/landing/LiveDemo";
import { ReceiptToPhone } from "@/components/landing/ReceiptToPhone";
import { absoluteUrl } from "@/lib/site";

/**
 * SEO de la portada, tal como lo fija `docs/COPY.md`.
 *
 * `title.absolute` salta la plantilla del layout raíz: el titular de la home
 * ya lleva la marca y no tiene que repetirla.
 */
export const metadata: Metadata = {
  title: {
    absolute: "QuéComproo | Lista de compras compartida con IA",
  },
  description:
    "Lista de compras compartida en tiempo real con precios de supermercados, presupuesto, planificación de comidas y recomendaciones de compra con IA.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "QuéComproo | Compra mejor en una lista compartida",
    description:
      "Organiza el mercado, compara precios y decide qué cocinar con tu casa en tiempo real.",
    type: "website",
    locale: "es_PE",
    siteName: "QuéComproo",
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: "QuéComproo | Compra mejor en una lista compartida",
    description:
      "Organiza el mercado, compara precios y decide qué cocinar con tu casa en tiempo real.",
  },
};

/**
 * Datos estructurados. Sin `aggregateRating`: no hay reseñas reales y
 * inventarlas es exactamente el tipo de cosa que no hacemos.
 */
const JSON_LD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      url: absoluteUrl("/"),
      name: "QuéComproo",
      inLanguage: "es-PE",
      description:
        "Carrito de compras compartido para organizar el mercado del hogar en tiempo real.",
    },
    {
      "@type": "SoftwareApplication",
      "@id": absoluteUrl("/#app"),
      name: "QuéComproo",
      url: absoluteUrl("/"),
      image: absoluteUrl("/opengraph-image"),
      applicationCategory: "ShoppingApplication",
      operatingSystem: "Web",
      inLanguage: "es-PE",
      isAccessibleForFree: true,
      description:
        "Carrito de compras compartido en vivo con tu pareja o roomies. Una IA te ayuda a decidir qué comprar según tu presupuesto y tu salud.",
      featureList: [
        "Lista de compras compartida en tiempo real",
        "Comparación de precios de supermercados",
        "Control del presupuesto mensual",
        "Planificación de desayuno, almuerzo y cena",
        "Racha de comidas balanceadas con evidencia",
        "Recomendaciones de compra y recetas con IA",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PEN",
      },
    },
  ],
} as const;

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // El objeto es literal y nuestro: no hay entrada de usuario que escapar.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(JSON_LD).replace(/</g, "\\u003c"),
        }}
      />
      <Hero />
      <ReceiptToPhone />
      <HowItWorks />
      <LiveDemo />
      <Features />
    </>
  );
}
