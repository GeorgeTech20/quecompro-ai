"use client";

import { useEffect, useRef } from "react";

import { formatPEN } from "@/components/ui";

import { squarify, type Rect } from "./treemap";

/* --------------------------------------------------------------------------
   Hero: carrito visto en picado. Los productos caen dentro de la canasta y se
   acomodan solos como bloques de un treemap, cada uno con su etiqueta de
   precio de góndola. Todo se dibuja con paths: cero imágenes, cero librerías.

   Es decorativo a propósito: el <canvas> va aria-hidden y el mensaje real vive
   en el <h1> de al lado.
-------------------------------------------------------------------------- */

type Product = { name: string; price: number };

/** Precios aproximados de mercado peruano. Son datos de demostración. */
const PRODUCTS: readonly Product[] = [
  { name: "Pollo entero", price: 12.9 },
  { name: "Arroz 5 kg", price: 24.5 },
  { name: "Huevos 15 u", price: 11.5 },
  { name: "Aceite 1 L", price: 8.9 },
  { name: "Leche x6", price: 21.9 },
  { name: "Palta fuerte", price: 9.9 },
  { name: "Papa amarilla", price: 4.9 },
  { name: "Queso fresco", price: 14.9 },
  { name: "Lentejas", price: 6.2 },
  { name: "Fideos", price: 3.6 },
  { name: "Tomate", price: 5.5 },
  { name: "Atún en agua", price: 5.4 },
  { name: "Plátano seda", price: 4.2 },
  { name: "Pan francés", price: 3.5 },
];

/* --- Geometría del carrito, en un espacio de diseño fijo ------------------ */

const DESIGN_W = 520;
const DESIGN_H = 600;

const BASKET: Rect = { x: 36, y: 62, w: 448, h: 400 };
const BASKET_R = 20;
/** La canasta se abre hacia el manubrio: eso es lo que la hace un carrito. */
const TAPER = 26;
const INNER_PAD = 14;
/** Sitio del asiento abatible, al fondo, junto al manubrio. */
const SEAT_H = 34;

const INNER: Rect = {
  x: BASKET.x + TAPER + INNER_PAD,
  y: BASKET.y + INNER_PAD,
  w: BASKET.w - (TAPER + INNER_PAD) * 2,
  h: BASKET.h - INNER_PAD * 2 - SEAT_H - 8,
};

/** Borde izquierdo/derecho del trapecio a una altura relativa (0 = frente). */
const edgeX = (t: number, right: boolean): number =>
  right ? BASKET.x + BASKET.w - TAPER * (1 - t) : BASKET.x + TAPER * (1 - t);

const SPAWN_MS = 1500;
const MOVE_MS = 620;
const EXIT_MS = 380;

/** Tinta fija sobre los bloques: el papel de góndola no cambia con el tema. */
const BLOCK_INK = "#14261f";
const BLOCK_INK_SOFT = "#4b6357";
const BLOCK_HAIRLINE = "rgba(20, 38, 31, 0.14)";
const TAG_PAPER = "#ffffff";

/* --- Utilidades ----------------------------------------------------------- */

function rr(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.arcTo(x + w, y, x + w, y + rad, rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.arcTo(x + w, y + h, x + w - rad, y + h, rad);
  ctx.lineTo(x + rad, y + h);
  ctx.arcTo(x, y + h, x, y + h - rad, rad);
  ctx.lineTo(x, y + rad);
  ctx.arcTo(x, y, x + rad, y, rad);
  ctx.closePath();
}

/** Polígono con las esquinas redondeadas: la canasta no es un rectángulo. */
function roundPoly(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyArray<readonly [number, number]>,
  r: number,
): void {
  const n = points.length;
  const midX = (i: number, j: number): number => (points[i][0] + points[j][0]) / 2;
  const midY = (i: number, j: number): number => (points[i][1] + points[j][1]) / 2;

  ctx.beginPath();
  ctx.moveTo(midX(0, 1), midY(0, 1));
  for (let i = 1; i <= n; i++) {
    const corner = points[i % n];
    const next = (i + 1) % n;
    ctx.arcTo(corner[0], corner[1], midX(i % n, next), midY(i % n, next), r);
  }
  ctx.closePath();
}

const easeOut = (t: number): number => 1 - Math.pow(1 - t, 3);
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

function lerpRect(a: Rect, b: Rect, t: number): Rect {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    w: lerp(a.w, b.w, t),
    h: lerp(a.h, b.h, t),
  };
}

/** Rectángulo encogido sobre su propio centro (entrada y salida de bloques). */
function shrink(r: Rect, k: number): Rect {
  return {
    x: r.x + (r.w * (1 - k)) / 2,
    y: r.y + (r.h * (1 - k)) / 2,
    w: r.w * k,
    h: r.h * k,
  };
}

/** Mismo formateador de soles que el resto de la app. */
const soles = (v: number): string => formatPEN(v);

function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > max) {
    cut = cut.slice(0, -1);
  }
  return `${cut}…`;
}

/* --- Paleta: se lee de los tokens CSS, así el dark mode sale gratis ------- */

type Palette = {
  ink: string;
  inkMuted: string;
  surface: string;
  borderStrong: string;
  brand: string;
  blocks: string[];
  font: string;
};

function readVar(styles: CSSStyleDeclaration, name: string, fallback: string): string {
  const value = styles.getPropertyValue(name).trim();
  return value.length > 0 ? value : fallback;
}

function readPalette(): Palette {
  const root = getComputedStyle(document.documentElement);
  return {
    ink: readVar(root, "--color-ink", "#1b1f2a"),
    inkMuted: readVar(root, "--color-ink-muted", "#5c6273"),
    surface: readVar(root, "--color-surface", "#ffffff"),
    borderStrong: readVar(root, "--color-border-strong", "#d2d2c9"),
    brand: readVar(root, "--color-brand-600", "#059669"),
    // Los bloques son superficie propia (papel de góndola): mismos verdes en
    // claro y en oscuro, siempre con tinta oscura encima.
    blocks: [
      readVar(root, "--color-brand-200", "#a7f3d0"),
      readVar(root, "--color-lime-soft", "#ecfccb"),
      readVar(root, "--color-brand-300", "#6ee7b7"),
      readVar(root, "--color-brand-100", "#d1fae5"),
      readVar(root, "--color-lime-accent", "#a3e635"),
      readVar(root, "--color-brand-400", "#34d399"),
    ],
    font: readVar(
      getComputedStyle(document.body),
      "font-family",
      "Inter, ui-sans-serif, system-ui, sans-serif",
    ),
  };
}

/* --- Estado animado ------------------------------------------------------- */

type Block = {
  name: string;
  price: number;
  color: string;
  seed: number;
  from: Rect;
  to: Rect;
  cur: Rect;
  alphaFrom: number;
  alphaTo: number;
  alpha: number;
  t0: number;
  dur: number;
  leaving: boolean;
};

export function HeroCanvas() {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!hostRef.current || !canvasRef.current) return;
    const rawCtx = canvasRef.current.getContext("2d");
    if (!rawCtx) return;

    // Alias con tipo no nulo: las funciones de dibujo de abajo son hoisted y
    // TypeScript no arrastra el narrowing hasta ellas.
    const host: HTMLDivElement = hostRef.current;
    const canvasEl: HTMLCanvasElement = canvasRef.current;
    const ctx: CanvasRenderingContext2D = rawCtx;

    let palette = readPalette();
    let cssW = 1;
    let cssH = 1;
    let maxBlocks = 9;

    const blocks: Block[] = [];
    let nextProduct = 0;
    let shownTotal = 0;
    let raf = 0;
    let running = false;
    let visible = false;
    let clock = 0; // reloj virtual: no avanza mientras el hero está pausado
    let lastFrame = 0;
    let nextSpawn = SPAWN_MS;

    const reduceQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let reduced = reduceQuery.matches;

    const dpr = (): number => Math.min(window.devicePixelRatio || 1, 2);
    const live = (): Block[] => blocks.filter((b) => !b.leaving);
    const sumLive = (): number => live().reduce((acc, b) => acc + b.price, 0);
    const font = (size: number, weight: number): string =>
      `${weight} ${size}px ${palette.font}`;

    /* --- layout ---------------------------------------------------------- */

    function relayout(now: number, animate: boolean): void {
      const current = live();
      if (current.length === 0) return;
      // El treemap squarified asume orden descendente: los caros arriba a la
      // izquierda. Reordenar en cada alta es justo lo que hace que la canasta
      // se reacomode sola.
      const order = [...current].sort((a, b) => b.price - a.price);
      const rects = squarify(
        order.map((b) => b.price),
        INNER,
      );
      order.forEach((block, i) => {
        const target = rects[i];
        if (!animate) {
          block.from = target;
          block.to = target;
          block.cur = target;
          block.alpha = 1;
          block.alphaFrom = 1;
          block.alphaTo = 1;
          block.t0 = now;
          block.dur = 1;
          return;
        }
        // Nunca saltamos: interpolamos posición y tamaño desde donde estaba.
        block.from = block.alpha === 0 ? shrink(target, 0.35) : block.cur;
        block.to = target;
        block.alphaFrom = block.alpha;
        block.alphaTo = 1;
        block.t0 = now;
        block.dur = MOVE_MS;
      });
    }

    function pushProduct(now: number, animate: boolean): void {
      const product = PRODUCTS[nextProduct % PRODUCTS.length];
      nextProduct += 1;

      const current = live();
      if (current.length >= maxBlocks) {
        const oldest = current[0];
        oldest.leaving = true;
        oldest.from = oldest.cur;
        oldest.to = shrink(oldest.cur, 0.55);
        oldest.alphaFrom = oldest.alpha;
        oldest.alphaTo = 0;
        oldest.t0 = now;
        oldest.dur = animate ? EXIT_MS : 1;
      }

      blocks.push({
        name: product.name,
        price: product.price,
        color: palette.blocks[(nextProduct - 1) % palette.blocks.length],
        seed: (nextProduct * 2654435761) >>> 0,
        from: INNER,
        to: INNER,
        cur: INNER,
        alpha: 0,
        alphaFrom: 0,
        alphaTo: 1,
        t0: now,
        dur: animate ? MOVE_MS : 1,
        leaving: false,
      });
      relayout(now, animate);
    }

    /* --- dibujo ---------------------------------------------------------- */

    function drawCart(): void {
      // Ruedas giratorias vistas desde arriba: asoman por debajo de la canasta.
      ctx.fillStyle = palette.ink;
      const wheelTs = [46 / BASKET.h, (BASKET.h - 46) / BASKET.h];
      for (const t of wheelTs) {
        for (const right of [false, true]) {
          const cx = edgeX(t, right);
          const cy = BASKET.y + t * BASKET.h;
          rr(ctx, cx - 10, cy - 17, 20, 34, 10);
          ctx.fill();
        }
      }

      // Manubrio y sus dos brazos.
      ctx.strokeStyle = palette.ink;
      ctx.fillStyle = palette.surface;
      ctx.lineWidth = 2.6;
      const armY = BASKET.y + BASKET.h - 8;
      for (const ax of [BASKET.x + 52, BASKET.x + BASKET.w - 66]) {
        rr(ctx, ax, armY, 14, 54, 7);
        ctx.fill();
        ctx.stroke();
      }
      rr(ctx, BASKET.x + 38, armY + 42, BASKET.w - 76, 24, 12);
      ctx.fill();
      ctx.stroke();

      // Canasta: trapecio, más ancha del lado del manubrio.
      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.ink;
      ctx.lineWidth = 3;
      roundPoly(
        ctx,
        [
          [BASKET.x + TAPER, BASKET.y],
          [BASKET.x + BASKET.w - TAPER, BASKET.y],
          [BASKET.x + BASKET.w, BASKET.y + BASKET.h],
          [BASKET.x, BASKET.y + BASKET.h],
        ],
        BASKET_R,
      );
      ctx.fill();
      ctx.stroke();
    }

    /** Asiento abatible del fondo: la pieza que delata que es un carrito. */
    function drawSeat(): void {
      const y = INNER.y + INNER.h + 12;
      const t = (y - BASKET.y) / BASKET.h;
      const x = edgeX(t, false) + INNER_PAD;
      const w = edgeX(t, true) - INNER_PAD - x;

      ctx.fillStyle = palette.surface;
      ctx.strokeStyle = palette.ink;
      ctx.lineWidth = 2.2;
      rr(ctx, x, y, w, SEAT_H - 6, 8);
      ctx.fill();
      ctx.stroke();

      // Las dos aberturas por donde van las piernas del niño.
      ctx.lineWidth = 2;
      for (const slot of [0.3, 0.7]) {
        rr(ctx, x + w * slot - 24, y + 6, 48, SEAT_H - 18, 6);
        ctx.stroke();
      }
    }

    function drawMesh(): void {
      ctx.strokeStyle = palette.borderStrong;
      ctx.globalAlpha = 0.5;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = INNER.x + 26; x < INNER.x + INNER.w; x += 26) {
        ctx.moveTo(x, INNER.y);
        ctx.lineTo(x, INNER.y + INNER.h);
      }
      for (let y = INNER.y + 26; y < INNER.y + INNER.h; y += 26) {
        ctx.moveTo(INNER.x, y);
        ctx.lineTo(INNER.x + INNER.w, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    function drawBarcode(x: number, y: number, w: number, h: number, seed: number): void {
      let s = seed >>> 0;
      const rand = (): number => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      ctx.fillStyle = BLOCK_INK;
      const keep = ctx.globalAlpha;
      ctx.globalAlpha = keep * 0.72;
      let cx = x;
      while (cx < x + w - 1) {
        const bw = rand() < 0.32 ? 2 : 1;
        if (cx + bw > x + w) break;
        ctx.fillRect(cx, y, bw, h);
        cx += bw + (rand() < 0.4 ? 2 : 1.6);
      }
      ctx.globalAlpha = keep;
    }

    function drawTag(block: Block): void {
      const { x, y, w, h } = block.cur;

      // Bloques chicos: solo el precio, la etiqueta no entraría legible.
      if (w < 92 || h < 78) {
        if (w < 46 || h < 32) return;
        ctx.fillStyle = BLOCK_INK;
        ctx.font = font(Math.min(14, w / 5.2), 600);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(soles(block.price), x + w / 2, y + h / 2);
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        return;
      }

      const tagW = Math.min(w - 20, 128);
      const tagH = 58;
      const tx = x + 10;
      const ty = y + h - tagH - 10;

      rr(ctx, tx, ty, tagW, tagH, 6);
      ctx.fillStyle = TAG_PAPER;
      ctx.fill();
      ctx.strokeStyle = BLOCK_HAIRLINE;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = font(9, 600);
      ctx.fillStyle = BLOCK_INK_SOFT;
      ctx.fillText(fit(ctx, block.name.toUpperCase(), tagW - 16), tx + 8, ty + 17);

      ctx.font = font(18, 600);
      ctx.fillStyle = BLOCK_INK;
      ctx.fillText(soles(block.price), tx + 8, ty + 38);

      drawBarcode(tx + 8, ty + 44, tagW - 16, 8, block.seed);
    }

    function drawBlocks(): void {
      for (const block of blocks) {
        if (block.alpha <= 0.01 || block.cur.w < 3 || block.cur.h < 3) continue;
        ctx.globalAlpha = block.alpha;
        rr(ctx, block.cur.x + 2, block.cur.y + 2, block.cur.w - 4, block.cur.h - 4, 8);
        ctx.fillStyle = block.color;
        ctx.fill();
        ctx.strokeStyle = BLOCK_INK;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        drawTag(block);
      }
      ctx.globalAlpha = 1;
    }

    function drawTotal(): void {
      const w = 214;
      const h = 40;
      const x = DESIGN_W / 2 - w / 2;
      const y = 6;

      rr(ctx, x, y, w, h, 10);
      ctx.fillStyle = palette.surface;
      ctx.fill();
      ctx.strokeStyle = palette.borderStrong;
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      ctx.font = font(10, 600);
      ctx.fillStyle = palette.inkMuted;
      ctx.fillText("TOTAL DEL CARRITO", x + 14, y + h / 2 + 1);

      ctx.textAlign = "right";
      ctx.font = font(18, 600);
      ctx.fillStyle = palette.brand;
      ctx.fillText(soles(shownTotal), x + w - 14, y + h / 2 + 1);

      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
    }

    function draw(): void {
      const ratio = dpr();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

      const scale = Math.min(cssW / DESIGN_W, cssH / DESIGN_H);
      ctx.save();
      ctx.translate((cssW - DESIGN_W * scale) / 2, (cssH - DESIGN_H * scale) / 2);
      ctx.scale(scale, scale);
      ctx.lineJoin = "round";
      ctx.lineCap = "round";

      drawCart();
      ctx.save();
      rr(ctx, INNER.x, INNER.y, INNER.w, INNER.h, 10);
      ctx.clip();
      drawMesh();
      drawBlocks();
      ctx.restore();
      drawSeat();
      drawTotal();
      ctx.restore();
    }

    /* --- bucle ----------------------------------------------------------- */

    function step(dt: number): void {
      clock += dt;
      if (clock >= nextSpawn) {
        pushProduct(clock, true);
        nextSpawn = clock + SPAWN_MS;
      }
      for (let i = blocks.length - 1; i >= 0; i--) {
        const block = blocks[i];
        const p = Math.min(1, (clock - block.t0) / block.dur);
        const e = easeOut(p);
        block.cur = lerpRect(block.from, block.to, e);
        block.alpha = lerp(block.alphaFrom, block.alphaTo, e);
        if (block.leaving && p >= 1) blocks.splice(i, 1);
      }
      const target = sumLive();
      shownTotal += (target - shownTotal) * (1 - Math.exp(-dt / 140));
    }

    function frame(now: number): void {
      raf = window.requestAnimationFrame(frame);
      // Si la pestaña estuvo dormida, el delta se acota: nada de saltos feos.
      const dt = lastFrame === 0 ? 16 : Math.min(64, now - lastFrame);
      lastFrame = now;
      step(dt);
      draw();
    }

    function start(): void {
      if (running || reduced) return;
      running = true;
      lastFrame = 0;
      raf = window.requestAnimationFrame(frame);
    }

    function stop(): void {
      if (!running) return;
      running = false;
      window.cancelAnimationFrame(raf);
    }

    /** Fuera del viewport o pestaña oculta = ni un frame. */
    function sync(): void {
      if (visible && !document.hidden && !reduced) start();
      else stop();
    }

    /** `prefers-reduced-motion: reduce` → composición final, sin animación. */
    function buildStatic(): void {
      blocks.length = 0;
      nextProduct = 0;
      clock = 0;
      for (let i = 0; i < maxBlocks; i++) pushProduct(0, false);
      shownTotal = sumLive();
      draw();
    }

    function seedAnimated(): void {
      blocks.length = 0;
      nextProduct = 0;
      clock = 0;
      // Arrancamos con algo dentro: la canasta nunca se ve vacía.
      for (let i = 0; i < 3; i++) pushProduct(0, false);
      shownTotal = sumLive();
      nextSpawn = SPAWN_MS;
    }

    function resize(): void {
      const rect = host.getBoundingClientRect();
      cssW = Math.max(1, Math.round(rect.width));
      cssH = Math.max(1, Math.round(rect.height));
      const ratio = dpr();
      canvasEl.width = Math.round(cssW * ratio);
      canvasEl.height = Math.round(cssH * ratio);
      canvasEl.style.width = `${cssW}px`;
      canvasEl.style.height = `${cssH}px`;

      // En móvil entran menos bloques para que las etiquetas sigan legibles.
      const next = cssW < 420 ? 6 : 9;
      if (next !== maxBlocks) {
        maxBlocks = next;
        if (reduced) buildStatic();
        else relayout(clock, false);
      }
      draw();
    }

    if (reduced) buildStatic();
    else seedAnimated();

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);
    resize();

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        sync();
      },
      { threshold: 0.05 },
    );
    io.observe(host);

    const onVisibility = (): void => sync();
    document.addEventListener("visibilitychange", onVisibility);

    const onMotionChange = (): void => {
      reduced = reduceQuery.matches;
      stop();
      if (reduced) {
        buildStatic();
      } else {
        seedAnimated();
        sync();
      }
    };
    reduceQuery.addEventListener("change", onMotionChange);

    // El tema vive en la clase de <html>: si cambia, releemos los tokens.
    const themeObserver = new MutationObserver(() => {
      palette = readPalette();
      blocks.forEach((block, i) => {
        block.color = palette.blocks[i % palette.blocks.length];
      });
      draw();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      reduceQuery.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div ref={hostRef} aria-hidden="true" className="relative aspect-[13/15] w-full">
      <canvas ref={canvasRef} aria-hidden="true" className="block h-full w-full" />
    </div>
  );
}
