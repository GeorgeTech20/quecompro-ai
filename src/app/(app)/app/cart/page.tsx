import { auth } from "@clerk/nextjs/server";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CartView } from "@/components/cart/CartView";
import { EmptyState } from "@/components/ui";
import {
  getHouseholdById,
  getHouseholdCart,
  getHouseholdMembers,
  getHouseholdsForUser,
  getMonthSpend,
  getProductsByIds,
  getProfileByClerkId,
} from "@/lib/data";
import type { LiveCartSeedItem } from "@/hooks/use-live-cart";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Punto de entrada del carrito.
 *
 * Todo lo pesado pasa aquí: identidad, casa y snapshot. El cliente arranca con
 * el carrito ya pintado y no vuelve a pedirlo por HTTP — desde ese momento el
 * único que lo mueve es el canal de Portal.
 */

export const metadata: Metadata = { title: "Carrito" };

export default async function CartPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const profile = await getProfileByClerkId(userId);
  if (!profile) {
    return (
      <MissingHousehold description="Todavía no tienes un perfil creado. Termina el onboarding para armar tu casa." />
    );
  }

  // `active_household_id` puede estar vacío si alguien entró por invitación y
  // nunca eligió casa; en ese caso vale la primera a la que pertenece.
  let householdId = profile.active_household_id;
  if (!householdId) {
    const households = await getHouseholdsForUser(profile.id);
    householdId = households[0]?.id ?? null;
  }

  if (!householdId) {
    return (
      <MissingHousehold description="Aún no perteneces a ninguna casa. Crea la tuya o entra con el link que te pasaron." />
    );
  }

  const [household, cart, spend, members] = await Promise.all([
    getHouseholdById(householdId),
    getHouseholdCart(householdId),
    getMonthSpend(householdId),
    getHouseholdMembers(householdId),
  ]);

  // El `product_key` no viaja por el canal (no está en `CartItemPayload`), así
  // que se resuelve aquí para que "ver precios" pegue contra la clave real del
  // catálogo y no contra un slug adivinado del título.
  const productIds = cart.items
    .map((item) => item.product_id)
    .filter((id): id is string => id !== null);
  const products = productIds.length > 0 ? await getProductsByIds(productIds) : [];
  const keyByProductId = new Map(products.map((product) => [product.id, product.product_key]));

  const memberById = new Map(
    members.map((member) => [
      member.user_id,
      {
        id: member.user_id,
        name: member.profile?.full_name ?? "Alguien de la casa",
        avatarUrl: member.profile?.avatar_url ?? null,
      },
    ]),
  );

  const purchasePhotoEntries = await Promise.all(
    cart.items
      .filter((item) => Boolean(item.purchase_photo_path))
      .map(async (item) => {
        const signed = await supabaseAdmin()
          .storage.from("purchase-evidence")
          .createSignedUrl(item.purchase_photo_path as string, 60 * 60);
        return [item.id, signed.data?.signedUrl] as const;
      }),
  );
  const purchasePhotoByItem = new Map(purchasePhotoEntries);

  const seedItems: LiveCartSeedItem[] = cart.items.map((row) => ({
    id: row.id,
    title: row.title,
    price: row.price,
    qty: row.qty,
    unit: row.unit,
    store: row.store ?? undefined,
    category: row.category ?? undefined,
    healthGrade: row.health_grade ?? undefined,
    note: row.note ?? undefined,
    addedBy: row.added_by ? memberById.get(row.added_by) : undefined,
    addedAt: row.created_at,
    purchasedAt: row.purchased_at ?? undefined,
    purchasedBy: row.purchased_by ? memberById.get(row.purchased_by) : undefined,
    purchasePhotoUrl: purchasePhotoByItem.get(row.id),
    productKey: row.product_id ? keyByProductId.get(row.product_id) : undefined,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  }));

  return (
    <CartView
      householdName={household?.name ?? "Tu casa"}
      seedItems={seedItems}
      budget={{
        budget: spend.budget,
        transactionsTotal: spend.transactionsTotal,
        dayOfMonth: spend.dayOfMonth,
        daysInMonth: spend.daysInMonth,
        currency: spend.currency,
      }}
    />
  );
}

function MissingHousehold({ description }: { description: string }) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <EmptyState title="Falta tu casa" description={description} />
    </div>
  );
}
