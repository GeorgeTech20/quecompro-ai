const FEATURES = [
  {
    glyph: "A",
    sub: "–D",
    label: "Salud",
    title: "Una nota, no un sermón",
    body: "Cada producto que entra recibe A, B, C o D según lo procesado que sea, el azúcar y el sodio. Sin discursos: una letra y una razón en una línea.",
    tint: "bg-brand-50 dark:bg-brand-900/35",
    glyphTint: "text-brand-600 dark:text-brand-300",
  },
  {
    glyph: "S/",
    sub: "",
    label: "Ahorro",
    title: "El mismo producto, más barato",
    body: "Compara lo que agregaste contra otras tiendas y te dice dónde cuesta menos y cuánto te ahorras si cambias. Tú decides si cambias o no.",
    tint: "bg-lime-soft dark:bg-lime-accent/10",
    glyphTint: "text-brand-700 dark:text-lime-accent",
  },
  {
    glyph: "2",
    sub: "+",
    label: "Presencia",
    title: "Ves quién está comprando",
    body: "El carrito es uno solo y se actualiza mientras el otro camina por el pasillo. Nadie compra el arroz dos veces.",
    tint: "bg-grade-c/10 dark:bg-grade-c/15",
    glyphTint: "text-grade-c",
  },
  {
    glyph: "+51",
    sub: "",
    label: "WhatsApp",
    title: "También desde el chat de siempre",
    body: "Mandas lo que compraste por WhatsApp y entra al mismo carrito. Modo demostración: el puente está para que lo veas funcionando.",
    tint: "bg-surface-sunken dark:bg-surface",
    glyphTint: "text-ink-muted",
  },
] as const;

export function Features() {
  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 lg:py-24">
      <div className="max-w-2xl">
        <p className="text-brand-600 text-sm font-medium">Qué hace la IA</p>
        <h2 className="text-ink mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Cuatro cosas, bien hechas.
        </h2>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2">
        {FEATURES.map((feature) => (
          <li
            key={feature.label}
            className={`rounded-sheet border-border-subtle border p-6 sm:p-8 ${feature.tint}`}
          >
            <p className="text-ink-muted text-xs font-medium tracking-wide uppercase">
              {feature.label}
            </p>
            <p
              aria-hidden="true"
              className={`mt-2 flex items-baseline gap-1 text-7xl leading-none font-semibold tracking-tighter ${feature.glyphTint}`}
            >
              {feature.glyph}
              {feature.sub && (
                <span className="text-2xl tracking-normal opacity-60">
                  {feature.sub}
                </span>
              )}
            </p>
            <h3 className="text-ink mt-6 text-lg font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="text-ink-muted mt-2 max-w-md text-sm leading-relaxed">
              {feature.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
