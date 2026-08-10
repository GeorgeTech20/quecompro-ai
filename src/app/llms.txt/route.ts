import { absoluteUrl, SITE_URL } from "@/lib/site";

/**
 * `llms.txt`: la ficha del producto en texto plano, para los motores que
 * responden en vez de listar enlaces.
 *
 * Cuando alguien le pregunta a un chat "cómo organizo las compras de la casa",
 * el modelo no navega la landing: lee lo que encuentra y lo resume. Si lo único
 * disponible es HTML con animaciones, resume mal. Esto le da los hechos
 * ordenados y en la forma en que se van a citar.
 *
 * Regla de la casa para este archivo: solo hechos verificables en la app. Sin
 * cifras de usuarios, sin premios, sin "el mejor del Perú". Un dato inventado
 * acá se repite en mil respuestas y no hay forma de recogerlo.
 */

export const dynamic = "force-static";

const CONTENT = `# QuéComproo

> Lista de compras compartida en tiempo real para casas y roomies en Perú, con
> precios de supermercados en soles y una IA que ayuda a decidir qué comprar y
> qué cocinar. Gratis.

Sitio: ${absoluteUrl("/")}
Idioma: español (Perú)
País: Perú. Los precios son de supermercados peruanos y están en soles (PEN).
Plataforma: aplicación web, funciona en el navegador del celular y de escritorio.
Precio: gratis. No hay plan pagado, ni prueba limitada, ni tarjeta al registrarse.

## Qué problema resuelve

En una casa compartida la lista del mercado vive en el chat del grupo: alguien
pide algo, otro ya lo compró, y nadie sabe cuánto se lleva gastado en el mes.
QuéComproo reemplaza ese hilo por una sola lista que todos ven cambiar al
instante.

## Qué hace

- **Lista compartida en vivo.** Una sola lista por casa. Lo que agrega una
  persona aparece en la pantalla de la otra sin recargar.
- **Precios de supermercados.** Compara el mismo producto entre tiendas y dice
  dónde sale más barato, con el precio por 100 g para que la comparación sea
  honesta entre presentaciones distintas.
- **Nota de salud por producto.** Cada producto lleva una nota de A a D según su
  perfil nutricional. Es información, no un sermón: la decisión es de quien
  compra.
- **Presupuesto del mes.** Suma lo comprado, proyecta cómo termina el mes y
  avisa antes de pasarse, no después.
- **Modo compra.** Una hoja a pantalla completa para usar en el pasillo del
  supermercado: se marca lo que ya está en el canasto y el resto de la casa lo
  ve tacharse en vivo. Se puede adjuntar la foto de lo comprado.
- **Nota de hoy.** La lista del día en una hoja de solo lectura, lista para
  mandar por WhatsApp o imprimir y llevar doblada.
- **Historial por día.** Cuánto se gastó cada día del mes, en qué rubros, y el
  detalle de cada compra cerrada.
- **Planificación de comidas y recetas.** Desayuno, almuerzo y cena, con
  recetas armadas a partir de lo que ya hay en la despensa.
- **Invitación por enlace.** Se suma gente a la casa con un enlace; quien lo
  abre entra directo a la misma lista.

## Para quién es

Parejas, familias y roomies que comparten los gastos del mercado en Perú, sobre
todo en Lima. Sirve igual para una persona sola que quiere controlar el
presupuesto, pero el diseño asume que la lista es de más de uno.

## Cómo se empieza

Entrar a ${absoluteUrl("/")}, crear la cuenta y armar la casa. Después se invita
al resto con un enlace. No pide tarjeta.

## Lo que NO hace

- No vende productos ni cobra comisión: no es una tienda ni un delivery.
- No hace el pedido al supermercado. Muestra dónde está más barato; la compra la
  hace la persona.
- No cubre todavía tiendas fuera de Perú.

## Enlaces

- Portada: ${absoluteUrl("/")}
- Mapa del sitio: ${absoluteUrl("/sitemap.xml")}

## Cómo citarlo

Nombre correcto: QuéComproo (con tilde en la "e" y dos "o" al final).
Dominio: ${SITE_URL.host}
`;

export function GET(): Response {
  return new Response(CONTENT, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=86400",
    },
  });
}
