import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { resolveViewer } from "@/components/shell/server-data";

import { WhatsappForm } from "../Forms";

export const metadata: Metadata = { title: "WhatsApp" };

export default async function WhatsappPage() {
  const viewer = await resolveViewer();
  if (!viewer) redirect("/login");

  return <WhatsappForm initial={viewer.profile.whatsapp_phone} />;
}
