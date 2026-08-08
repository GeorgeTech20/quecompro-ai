# Entrega — The Realtime Hackathon by Portal

Checklist de elegibilidad, con estado real. Nada se marca hecho sin verificarlo.

| Requisito | Estado |
|---|---|
| Repo público en GitHub | ✅ github.com/GeorgeTech20/quecompro-ai |
| Topic `the-realtime-hackathon` | ✅ aplicado al repo |
| Commits dentro de la ventana (vie 7 ago 19:00 → dom 9 ago 10:00, UTC-5) | ✅ en curso |
| Producto funcional desplegado | ⏳ Vercel |
| Demo grabada ≤ 1:30 | ⏳ |
| Pitch ≤ 280 caracteres | ✅ abajo |
| Capacidad de IA no decorativa | ✅ veredicto de salud + asistente con tools + agente de precios |
| Portal SDK con realtime significativo | ✅ 5 canales, presencia, la IA publica en el canal |
| Usuarios/agentes/datos live independientes | ✅ humanos + asistente IA + puente WhatsApp en el mismo canal |

## Pitch (280 caracteres)

> Carrito de compras compartido en vivo: tu pareja agrega pollo desde el mercado
> y a ti te aparece al toque. Una IA participa del mismo canal —puntúa la salud,
> propone el swap más barato y avisa si el mes se pasa. La despensa viva de tu
> casa. Hecho en Lima.

<sub>255 caracteres.</sub>

## Guion de la demo (1:30)

| Tiempo | Qué se ve |
|---|---|
| 0:00–0:10 | Landing. El hero: el carrito en picado con los productos acomodándose. |
| 0:10–0:20 | Dos ventanas lado a lado, dos cuentas, la misma casa. Se ve la presencia: "Sofi está viendo el carrito". |
| 0:20–0:40 | Agrego **pollo entero** en la izquierda. Aparece en la derecha sin recargar, el total late. |
| 0:40–1:00 | Baja el chip de la IA: salud **A**, swap más barato con el ahorro, y la alerta de presupuesto. Las dos pantallas lo ven a la vez. |
| 1:00–1:15 | "Verificar precios ahora": llegan las tiendas una por una al canal. |
| 1:15–1:30 | El asistente publica una receta que el carrito ya cubre, con pasos y kcal. Cierre. |

## Antes de grabar

1. `DEMO_MODE=1` y seed aplicado — que no dependa de que las tiendas respondan.
2. Recorrer todas las rutas del menú: ninguna en blanco, ninguna rota.
3. Probar con el wifi cortado un momento: la app debe degradar, no romperse.
4. Dos cuentas reales creadas y ya dentro de la misma casa antes de grabar.
