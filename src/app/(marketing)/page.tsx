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
 *
 * Ojo con `openGraph` y `alternates`: Next los reemplaza enteros, no los
 * fusiona campo por campo. Declararlos acá borra los del layout raíz, imagen
 * incluida — por eso `opengraph-image.jpg` vive también en este segmento y no
 * solo en `app/`.
 */
export const metadata: Metadata = {
  title: {
    absolute: "QuéComproo | Lista de compras compartida con IA",
  },
  description:
    "Lista de compras compartida en tiempo real con precios de supermercados, presupuesto, planificación de comidas y recomendaciones de compra con IA.",
  // `alternates` también se reemplaza entero, no se fusiona con el del layout:
  // si acá solo va el canonical, los hreflang del raíz desaparecen.
  alternates: {
    canonical: "/",
    languages: { "es-PE": "/", "x-default": "/" },
  },
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
 * inventarlas es exactamente el tipo de cosa que no hacemos. Tampoco hay
 * `FAQPage`: marcar preguntas que no están visibles en la página va contra las
 * reglas de Google y se penaliza.
 *
 * El grafo dice tres cosas: qué sitio es, quién lo hace y qué es el producto.
 * Un motor generativo que resume "apps para organizar compras en Perú" saca de
 * acá el país, el idioma, la moneda y el precio sin tener que deducirlos.
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
      publisher: { "@id": absoluteUrl("/#org") },
      description:
        "Carrito de compras compartido para organizar el mercado del hogar en tiempo real.",
    },
    {
      "@type": "Organization",
      "@id": absoluteUrl("/#org"),
      name: "QuéComproo",
      url: absoluteUrl("/"),
      logo: absoluteUrl("/icon.svg"),
      areaServed: { "@type": "Country", name: "Perú" },
    },
    {
      "@type": "SoftwareApplication",
      "@id": absoluteUrl("/#app"),
      name: "QuéComproo",
      url: absoluteUrl("/"),
      image: absoluteUrl("/opengraph-image.jpg"),
      applicationCategory: "ShoppingApplication",
      applicationSubCategory: "Lista de compras compartida",
      operatingSystem: "Web",
      browserRequirements: "Requiere JavaScript y un navegador moderno.",
      inLanguage: "es-PE",
      isAccessibleForFree: true,
      publisher: { "@id": absoluteUrl("/#org") },
      countriesSupported: "PE",
      audience: {
        "@type": "Audience",
        audienceType: "Parejas, familias y roomies que comparten los gastos del mercado",
        geographicArea: { "@type": "Country", name: "Perú" },
      },
      description:
        "Carrito de compras compartido en vivo con tu pareja o roomies. Una IA te ayuda a decidir qué comprar según tu presupuesto y tu salud.",
      featureList: [
        "Lista de compras compartida en tiempo real",
        "Comparación de precios de supermercados peruanos",
        "Nota de salud de la A a la D por producto",
        "Control del presupuesto mensual con proyección de fin de mes",
        "Historial de gasto por día",
        "Modo compra a pantalla completa para el supermercado",
        "Planificación de desayuno, almuerzo y cena",
        "Racha de comidas balanceadas con evidencia",
        "Recomendaciones de compra y recetas con IA",
      ],
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "PEN",
        availability: "https://schema.org/InStock",
        eligibleRegion: { "@type": "Country", name: "Perú" },
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
