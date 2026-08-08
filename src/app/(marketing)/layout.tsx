import { Footer } from "@/components/landing/Footer";
import { Nav } from "@/components/landing/Nav";

/** Zona pública: barra sticky arriba, pie abajo, contenido al medio. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Nav />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
