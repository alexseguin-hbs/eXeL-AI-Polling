"use client";

/**
 * /workspace — the post-login "Choose a workspace" landing (operator design, 2026-07-26).
 * Auth0 login → /callback → HERE → the moderator picks a mode of operation:
 *   Polling (→ /dashboard) · Innovation (access key → /innovation) · Solution Brainstorm (sealed).
 * Guarded by AuthGuard so only an authenticated moderator reaches it.
 */
import { AuthGuard } from "@/components/auth-guard";
import { WorkspaceSelect } from "@/components/workspace-select";

export default function WorkspacePage() {
  return (
    <AuthGuard>
      <WorkspaceSelect />
    </AuthGuard>
  );
}
