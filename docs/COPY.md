# QuéCompro.app — copy y SEO

Fuente de verdad de todo el texto de cara al usuario. Si un componente dice
algo distinto, gana este archivo.

> **Marca**: `QuéCompro.app` — con tilde en la é y con `.app`. Nunca `.ai`.
> En el logotipo, `QuéCompro` en tinta y `.app` en el verde de marca.

## 1. Posicionamiento

**Problema.** Los jóvenes que viven solos o en pareja en Perú se olvidan qué
comer y qué comprar, pierden la boleta, no saben cuánto llevan gastado del mes,
compran caro y poco sano, y no coordinan la compra con su pareja o su roomie.

**Solución.** Un carrito compartido en vivo con una IA que te dice qué comprar y
qué comer según tu presupuesto y tu salud, con precios de tiendas peruanas
(Tottus, PlazaVea, Metro, Wong) y recetas fáciles con lo que ya tienes.

**En una frase.** La despensa viva de tu casa.

**Lo que NO somos.** No somos una lista de compras. No somos un delivery. No
somos un contador de calorías. Somos el lugar donde la compra de una casa se
decide entre varios, en el momento en que está pasando.

## 2. Reglas de voz

- Español peruano, de tú. Directo, corto, sin adornos.
- Frases que alguien diría en voz alta. Si suena a folleto, se reescribe.
- Cero verbos de marketing: nada de *revoluciona*, *potencia*, *maximiza*,
  *transforma tu forma de*. Cero signos de exclamación en titulares.
- Nombrar plata en soles y siempre concreta: "S/ 4.50", no "ahorra dinero".
- Honestidad total: sin testimonios, sin logos de clientes, sin cifras de
  usuarios, sin "usado por miles de familias". Es un proyecto de hackathon y se
  dice.
- Los precios del catálogo son **datos de demostración** y eso aparece a la
  vista, no escondido en el pie.

## 3. Titulares por sección

**Hero**
- H1: `¿Qué compro?`
- Bajada: `La despensa viva de tu casa. El carrito que llenas con tu pareja o
  tus roomies, y una IA que responde en el mismo canal.`
- CTA primario: `Empezar gratis` · secundario: `Ver cómo funciona`

**Problema** — *Vivir con alguien no complica la comida. Complica la plata.*
Cuatro tarjetas:
1. **Se pierde la boleta.** Compraste, pagaste, y a los tres días nadie sabe
   cuánto fue. El mes se arma solo, sin que nadie lo mire.
2. **Compran dos veces lo mismo.** Tú traes el arroz, tu roomie trae el arroz.
   Ahora hay diez kilos de arroz y falta el aceite.
3. **El mes se va sin saber en qué.** No fue un gasto grande: fueron treinta
   chiquitos. Para cuando te das cuenta, ya no queda nada.
4. **Nadie coordina.** La lista está en un chat, en un papel de la refri y en la
   cabeza de alguien. Nunca en el mismo sitio.

**Cómo funciona** — *Cuatro pasos, como recorrer un pasillo.*
1. **Arma tu casa.** Invitas a tu pareja o a tus roomies con un link. Ponen el
   presupuesto del mes y qué come cada uno.
2. **Agrega al carrito.** Buscas el producto y lo sueltas. Aparece al toque en
   la pantalla del otro, sin recargar.
3. **La IA reacciona en vivo.** En el mismo chat te pone la nota de salud, el
   precio más barato que encontró y cómo va el mes.
4. **Cocinas y ahorras.** Con lo que ya tienes en la despensa te propone qué
   cocinar hoy. Nada se queda pudriendo en la refri.

**En vivo** — *Uno agrega. El otro lo ve. La IA contesta en el mismo canal.*
`No hay una pestaña de chatbot aparte: el asistente es un participante más del
carrito, como tu roomie.`

**Qué hace la IA** — *Cuatro cosas, bien hechas.*
- **Salud · una nota, no un sermón.** Cada producto recibe A, B, C o D según lo
  procesado que sea, el azúcar y el sodio. Una letra y una razón en una línea.
- **Ahorro · el mismo producto, más barato.** Compara contra otras tiendas y te
  dice dónde cuesta menos y cuánto te ahorras. Tú decides si cambias.
- **Presencia · ves quién está comprando.** El carrito es uno solo y se
  actualiza mientras el otro camina por el mercado.
- **WhatsApp · desde el chat de siempre.** Mandas lo que compraste por WhatsApp
  y entra al mismo carrito.

**Despensa** — *Lo que compraste, donde debería estar.*
`Tu despensa dibujada: qué hay, cuánto costó, qué está por vencerse y qué
puedes cocinar hoy sin comprar nada más.`

**Precio** — *Gratis, y lo decimos sin letra chica.*
`QuéCompro.app es un proyecto de hackathon hecho en Lima. No hay planes, ni
cupos, ni descuentos por tiempo limitado. Cuando exista un precio, va a
aparecer en esta misma página antes que en ningún otro lado.`

**Cierre / footer** — *La próxima compra ya empezó.*
`Alguien de tu casa está pensando qué falta ahora mismo. Que lo piense contigo.`

## 4. SEO

**title** (≤60): `QuéCompro.app — carrito de compras compartido con IA`

**description** (≤155):
`Carrito de compras compartido en vivo con tu pareja o roomies. Una IA te dice
qué comprar según tu presupuesto y tu salud, con precios de tiendas peruanas y
recetas fáciles.`

**Palabras que sí busca la gente**: lista de compras compartida, cuánto gasto al
mes en comida, qué cocinar con lo que tengo, precios de supermercado Perú,
presupuesto mensual de comida, compartir gastos con roomies.

**Open Graph**
- title: `¿Qué compro? — la despensa viva de tu casa`
- description: `Tu pareja, tus roomies y una IA de cocina llenan el mercado
  contigo, en vivo, antes de que gastes de más.`
- locale: `es_PE` · type: `website`

**JSON-LD**: `SoftwareApplication` con `applicationCategory:
LifestyleApplication`, `operatingSystem: Web`, `offers` con `price: "0"` y
`priceCurrency: "PEN"`. Sin `aggregateRating` — no hay reseñas reales y
inventarlas es exactamente el tipo de cosa que no hacemos.

**Accesibilidad que también es SEO**: un solo `<h1>` por página, jerarquía de
encabezados sin saltos, `alt` real en cada imagen de contenido (`aria-hidden` en
las decorativas), y el texto vive en el DOM, nunca solo dentro de un canvas.

## 5. Dirección visual (referencias del cliente)

Ver `public/hero/ref2/`:

- **r6** — *la principal*. Verde profundo + crema, titular serif, ilustración de
  comida, píldora verde de CTA sobre fondo claro. De aquí sale la paleta de las
  secciones: `#0F4A3C` verde profundo, `#F7F4EC` crema, acento lima.
- **r8** — isométrico sobre celeste, colores planos y alegres. Es la referencia
  de la **despensa**.
- **r1** — banda vertical de texto repetido en el borde. Buen recurso de ritmo
  entre secciones.
- **r3** — recortes de comida en cuadrícula dentro de un celular.

El hero se queda celeste (es la escena); las secciones bajan a crema y verde
profundo. Que la transición de color sea gradual y no un choque.
