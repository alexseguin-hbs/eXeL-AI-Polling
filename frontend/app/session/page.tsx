"use client";

import { Suspense } from "react";
import { SessionView } from "@/components/session-view";
import { Loader2 } from "lucide-react";

function SessionLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function SessionPage() {
  return (
    <Suspense fallback={<SessionLoading />}>
      <SessionView />
    </Suspense>
  );
}
