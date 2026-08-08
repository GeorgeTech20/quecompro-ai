"use client";

import { useActionState } from "react";

import { ArrowRightIcon } from "@/components/shell/icons";
import { Button } from "@/components/ui";

import { joinByTokenAction } from "./actions";
import { JOIN_IDLE, type JoinState } from "./state";

export function JoinForm({ token, householdName }: { token: string; householdName: string }) {
  const [state, action, pending] = useActionState<JoinState, FormData>(
    joinByTokenAction,
    JOIN_IDLE,
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />

      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={pending}
        iconRight={<ArrowRightIcon className="size-4" />}
      >
        Unirme a {householdName}
      </Button>

      {state.status === "error" && state.message ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
