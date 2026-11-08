"use client";
// /Architect-2525/future — the greenfield Architect (plan §14-§17). Imports ONLY components/architect-future, which
// imports ONLY lib/architect-future — nothing from the legacy surface (the T-IMPORT-BAN boundary). The legacy design
// tool stays at /Architect-2525/.
import { FutureApp } from "@/components/architect-future/future-app";

export default function Page() {
  return <FutureApp />;
}
