"use client";

import { useAuth0 } from "@auth0/auth0-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { setTokenGetter } from "@/lib/api";

export default function CallbackPage() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently } =
    useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Wire up token getter for API calls
      setTokenGetter(getAccessTokenSilently);
      router.replace("/dashboard/");
    }
  }, [isLoading, isAuthenticated, getAccessTokenSilently, router]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-semibold text-destructive">
            Login failed
          </p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
          <a href="/" className="text-sm text-primary hover:underline">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
