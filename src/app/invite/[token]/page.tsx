import type { Metadata } from "next";
import Link from "next/link";

import { LinkButton } from "@/components/shell/LinkButton";
import {
  belongsToHousehold,
  loadHouseholdByToken,
  loadMembers,
  resolveViewer,
  safeLoad,
  type Viewer,
} from "@/components/shell/server-data";
import { Avatar, Card, EmptyState } from "@/components/ui";
import type { HouseholdRow, MemberWithProfile } from "@/types/db";

import { JoinForm } from "./JoinForm";

export const metadata: Metadata = { title: "Invitación" };

type Params = Promise<{ token: string }>;

/**
 * Invitación pública.
 *
 * Es la puerta por la que entra el segundo usuario de la demo, así que tiene
 * que aguantar todo: token inexistente, sesión cerrada, base caída y el caso de
 * alguien que ya vive en esa casa. Ninguno de esos es una excepción.
 */
export default async function InvitePage({ params }: { params: Params }) {
  const { token } = await params;

  const household = await safeLoad<HouseholdRow | null>(
    () => loadHouseholdByToken(token),
    null,
    "invite:casa",
  );

  if (!household) {
    return (
      <InviteFrame>
        <InvalidInvite />
      </InviteFrame>
    );
  }

  const [members, viewer] = await Promise.all([
    safeLoad<MemberWithProfile[]>(() => loadMembers(household.id), [], "invite:miembros"),
    safeLoad<Viewer | null>(() => resolveViewer(), null, "invite:sesion"),
  ]);

  const already = viewer
    ? await safeLoad(
        () => belongsToHousehold(household.id, viewer.profile.id),
        false,
        "invite:pertenencia",
      )
    : false;

  return (
    <InviteFrame>
      <div className="flex flex-col gap-6">
        <div className="text-center">
          <p className="text-sm text-ink-muted">Te invitaron a</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">{household.name}</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Un carrito compartido en vivo. Lo que agregues aparece al toque en la pantalla de los
            demás, y la IA les dice qué está más barato y qué tan sano es.
          </p>
        </div>

        {members.length > 0 ? (
          <div className="flex flex-col items-center gap-2">
            <div className="flex -space-x-2">
              {members.slice(0, 6).map((member) => (
                <Avatar
                  key={member.id}
                  size="md"
                  name={member.profile?.full_name}
                  src={member.profile?.avatar_url}
                  id={member.profile?.clerk_id ?? member.user_id}
                  className="ring-2 ring-surface"
                />
              ))}
            </div>
            <p className="text-sm text-ink-muted">
              {members.length === 1
                ? `${members[0]?.profile?.full_name ?? "Alguien"} ya está adentro`
                : `${members.length} personas ya están adentro`}
            </p>
          </div>
        ) : null}

        {!viewer ? (
          <div className="flex flex-col gap-2">
            <LinkButton
              href={`/login?redirect_url=${encodeURIComponent(`/invite/${token}`)}`}
              size="lg"
              fullWidth
            >
              Entrar y unirme
            </LinkButton>
            <p className="text-center text-xs text-ink-faint">
              Creas tu cuenta en 10 segundos y vuelves justo a esta pantalla.
            </p>
          </div>
        ) : already ? (
          <div className="flex flex-col gap-2">
            <LinkButton href="/app/cart" size="lg" fullWidth>
              Ya estás en esta casa — ir al carrito
            </LinkButton>
          </div>
        ) : (
          <JoinForm token={token} householdName={household.name} />
        )}
      </div>
    </InviteFrame>
  );
}

function InviteFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-canvas px-4 py-12">
      <Link
        href="/"
        className="text-xl font-semibold tracking-tight text-ink focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        QueCompro<span className="text-brand-600">.ai</span>
      </Link>

      <Card padding="md" className="mt-8 w-full max-w-md">
        {children}
      </Card>
    </div>
  );
}

function InvalidInvite() {
  return (
    <EmptyState
      illustration={<span className="text-2xl">🔗</span>}
      title="Esta invitación ya no sirve"
      description="El enlace venció o la casa cerró las invitaciones. Pídele a quien te invitó que te mande uno nuevo desde Roomies."
      action={
        <LinkButton href="/" variant="secondary">
          Ver qué es QueCompro.ai
        </LinkButton>
      }
    />
  );
}
