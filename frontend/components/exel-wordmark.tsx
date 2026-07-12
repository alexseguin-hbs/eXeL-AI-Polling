import type { CSSProperties } from "react";

/**
 * Shared "eXeL AI" wordmark — ONE source of truth for the two-part header (eXeL cyan + AI grey),
 * so the navbar, the eXeL AI badge, and the SECURITY-2525 command shell can never drift apart.
 * Styling-agnostic: each call site passes its own classes/colours; only the STRUCTURE is shared.
 */
export function ExelWordmark({ exelClass, aiClass, exelStyle, aiStyle, ai = "AI" }: {
  exelClass?: string;
  aiClass?: string;
  exelStyle?: CSSProperties;
  aiStyle?: CSSProperties;
  ai?: string;
}) {
  return (
    <>
      <span className={exelClass} style={exelStyle}>eXeL</span>{" "}
      <span className={aiClass} style={aiStyle}>{ai}</span>
    </>
  );
}
