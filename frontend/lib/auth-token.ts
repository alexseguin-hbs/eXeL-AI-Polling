// t189u — the bearer the API sees for a signed-in creator.
// With an Auth0 API audience configured (NEXT_PUBLIC_AUTH0_AUDIENCE) it is the access token.
// Until that API exists, it is the OIDC ID token for this SPA (aud = client id), which the
// backend verifies against the tenant JWKS + issuer (backend/app/core/auth.py). Either way the
// identity (sub, email) is the real OAuth profile — never a mock user.
import { AUTH0_AUDIENCE } from "@/lib/constants";

interface Auth0TokenSource {
  getAccessTokenSilently: () => Promise<string>;
  getIdTokenClaims: () => Promise<{ __raw: string } | undefined>;
}

export function makeTokenGetter(auth0: Auth0TokenSource): () => Promise<string> {
  return async () => {
    if (AUTH0_AUDIENCE) return auth0.getAccessTokenSilently();
    // Refresh the cache first (renews an expired ID token via the stored session), then read it.
    try {
      await auth0.getAccessTokenSilently();
    } catch {
      // No refreshable session — fall through to whatever ID token is cached (API answers 401 if stale).
    }
    const claims = await auth0.getIdTokenClaims();
    return claims?.__raw ?? "";
  };
}
