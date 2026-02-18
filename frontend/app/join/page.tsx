"use client";

import { Suspense } from "react";
import { JoinFlow } from "@/components/join-flow";
import { Loader2 } from "lucide-react";

function JoinLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={<JoinLoading />}>
      <JoinFlow />
    </Suspense>
  );
}
