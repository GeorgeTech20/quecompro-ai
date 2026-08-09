import { Fraunces } from "next/font/google";

import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";
import { SECTIONS_CSS } from "@/components/landing/sections/theme";

/**
 * Serif editorial solo para titulares de la landing (referencia r6). El cuerpo
 * sigue en Inter, como toda la app: se carga acá y no en el layout raíz para
 * que la zona privada no pague una fuente que no usa.
 */
const serif = Fraunces({
  variable: "--font-qc-serif",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT"],
});

/** Zona pública: barra pegajosa arriba, pie abajo, contenido al medio. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className={`qc-world flex min-h-full flex-1 flex-col ${serif.variable}`}>
      {/* Paleta y movimiento del mundo de secciones. Vive acá y no en
          `globals.css`: son reglas de una composición, no tokens del sistema. */}
      <style>{SECTIONS_CSS}</style>
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
