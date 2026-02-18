"use client";

import { Auth0Provider } from "@auth0/auth0-react";
import { Toaster } from "@/components/ui/toaster";
import {
  AUTH0_DOMAIN,
  AUTH0_CLIENT_ID,
  AUTH0_AUDIENCE,
  AUTH0_REDIRECT_URI,
} from "@/lib/constants";

export function Providers({ children }: { children: React.ReactNode }) {
  // Skip Auth0 provider if config is missing (dev mode without Auth0)
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) {
    return (
      <>
        {children}
        <Toaster />
      </>
    );
  }

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: AUTH0_REDIRECT_URI,
        ...(AUTH0_AUDIENCE ? { audience: AUTH0_AUDIENCE } : {}),
        scope: "openid profile email",
      }}
      cacheLocation="localstorage"
    >
      {children}
      <Toaster />
    </Auth0Provider>
  );
}
