import type { ComponentType } from "react";

import { Badge, Card, type BadgeTone } from "@/components/ui";

import { Barcode } from "./Barcode";
import { BagIcon, BottleIcon, CanIcon, CartonIcon } from "./ShelfProducts";

type Step = {
  n: number;
  badge: string;
  tone: BadgeTone;
  title: string;
  body: string;
  Icon: ComponentType<{ className?: string }>;
  iconClass: string;
};

const STEPS: readonly Step[] = [
  {
    n: 1,
    badge: "Top 1",
    tone: "success",
    title: "Arma tu casa",
    body: "Invitas a tu pareja o a tus roomies con un link. Ponen el presupuesto del mes y qué come cada uno.",
    Icon: CartonIcon,
    iconClass: "h-32",
  },
  {
    n: 2,
    badge: "New!",
    tone: "brand",
    title: "Agrega al carrito",
    body: "Buscas el producto y lo sueltas en el carrito. Aparece al toque en la pantalla del otro, sin recargar.",
    Icon: CanIcon,
    iconClass: "h-28",
  },
  {
    n: 3,
    badge: "Hot!",
    tone: "warning",
    title: "La IA reacciona en vivo",
    body: "En el mismo chat te pone la nota de salud, el precio más barato que encontró y cómo va el mes.",
    Icon: BottleIcon,
    iconClass: "h-36",
  },
  {
    n: 4,
    badge: "Best!",
    tone: "info",
    title: "Cocinas y ahorras",
    body: "Con lo que ya tienes en la despensa te propone qué cocinar hoy. Nada se queda pudriendo en la refri.",
    Icon: BagIcon,
    iconClass: "h-28",
  },
];

export function HowItWorks() {
  return (
    <section
      id="como-funciona"
      className="mx-auto w-full max-w-6xl scroll-mt-20 px-5 py-20 sm:px-8 lg:py-24"
    >
      <div className="max-w-2xl">
        <p className="text-brand-600 text-sm font-medium">Cómo funciona</p>
        <h2 className="text-ink mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Cuatro pasos, como recorrer un pasillo.
        </h2>
      </div>

      <div className="rounded-sheet border-border-subtle bg-lime-soft dark:bg-brand-900/25 mt-10 border px-4 pt-10 pb-8 sm:px-8 sm:pt-14">
        <ol className="grid grid-cols-1 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <li key={step.n} className="flex flex-col">
              {/* Repisa: el borde inferior de cada celda se une con el vecino. */}
              <div className="border-border-strong relative flex h-44 items-end justify-center border-b-4 px-4 pb-1">
                <span
                  aria-hidden="true"
                  className="bg-brand-900/15 absolute bottom-1.5 h-2 w-20 rounded-full blur-[3px]"
                />
                <step.Icon className={`relative w-auto ${step.iconClass}`} />
              </div>

              {/* Etiqueta de precio de góndola. */}
              <div className="px-3 pt-6">
                <Card className="h-full p-4">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-ink-faint text-xs font-medium tabular-nums">
                      Paso {step.n}
                    </span>
                    <Badge tone={step.tone} size="sm">
                      {step.badge}
                    </Badge>
                  </div>
                  <h3 className="text-ink mt-2 text-lg font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-ink-muted mt-1.5 text-sm leading-relaxed">
                    {step.body}
                  </p>
                  <Barcode className="mt-5" />
                </Card>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
