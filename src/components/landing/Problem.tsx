const PROBLEMS = [
  {
    n: "01",
    title: "Se pierde la boleta",
    body: "Compraste, pagaste y a los tres días nadie sabe cuánto fue. El mes se arma solo, sin que nadie lo mire.",
    tint: "bg-brand-50 dark:bg-brand-900/35",
    number: "text-brand-600/25 dark:text-brand-300/25",
  },
  {
    n: "02",
    title: "Compran dos veces lo mismo",
    body: "Tú traes el arroz, tu roomie trae el arroz. Ahora hay diez kilos de arroz y falta el aceite.",
    tint: "bg-lime-soft dark:bg-lime-accent/10",
    number: "text-brand-700/25 dark:text-lime-accent/25",
  },
  {
    n: "03",
    title: "El mes se va sin saber en qué",
    body: "No fue un gasto grande: fueron treinta chiquitos. Para cuando te das cuenta ya no queda nada.",
    tint: "bg-grade-c/10 dark:bg-grade-c/15",
    number: "text-grade-c/35",
  },
  {
    n: "04",
    title: "Nadie coordina con el roomie",
    body: "La lista está en un chat, en un papel de la refri y en la cabeza de alguien. Nunca en el mismo sitio.",
    tint: "bg-surface-sunken dark:bg-surface",
    number: "text-ink-faint/30",
  },
] as const;

export function Problem() {
  return (
    <section
      id="problema"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-brand-600 text-sm font-medium">El problema</p>
        <h2 className="text-ink mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Vivir con alguien no complica la comida. Complica la plata.
        </h2>
        <p className="text-ink-muted mt-4 text-base leading-relaxed">
          Cuatro cosas que pasan en toda casa compartida del Perú, todos los
          meses, sin falta.
        </p>
      </div>

      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PROBLEMS.map((item) => (
          <li
            key={item.n}
            className={`rounded-sheet border-border-subtle relative flex min-h-56 flex-col justify-end overflow-hidden border p-6 ${item.tint}`}
          >
            <span
              aria-hidden="true"
              className={`absolute -top-3 right-3 text-8xl leading-none font-semibold tracking-tighter ${item.number}`}
            >
              {item.n}
            </span>
            <h3 className="text-ink relative text-lg font-semibold tracking-tight">
              {item.title}
            </h3>
            <p className="text-ink-muted relative mt-2 text-sm leading-relaxed">
              {item.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
