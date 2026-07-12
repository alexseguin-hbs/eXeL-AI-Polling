import type { CSSProperties } from "react";

/**
 * Shared "eXeL AI" wordmark — ONE source of truth for every eXeL·AI header (navbar, eXeL AI badge,
 * SECURITY-2525 command shell, /api, Divinity Guide, ARX, Trinity). Change it here, every header follows.
 * Styling-agnostic: each call site passes its own classes/colours; only the STRUCTURE is shared.
 *
 * LANDSCAPE-ICON UPLOAD HOOK: when the landscape logo is ready, set EXEL_LOGO_SRC to its path
 * ("/exel-logo.svg" in /public, or a data: URI). Every <ExelWordmark> then renders the image instead of
 * the text — one edit, the whole app follows. The icon inherits each header's font-size via `em` height
 * (width auto keeps its aspect ratio), so it scales correctly wherever the wordmark is used.
 */
const EXEL_LOGO_SRC: string | null = null;

export function ExelWordmark({
  exelClass,
  aiClass,
  exelStyle,
  aiStyle,
  ai = "AI",
  logo = EXEL_LOGO_SRC,
  logoHeightEm = 1.15,
  logoClass,
  alt = "eXeL AI",
}: {
  exelClass?: string;
  aiClass?: string;
  exelStyle?: CSSProperties;
  aiStyle?: CSSProperties;
  ai?: string;
  logo?: string | null;
  logoHeightEm?: number;
  logoClass?: string;
  alt?: string;
}) {
  if (logo) {
    // eslint-disable-next-line @next/next/no-img-element -- landscape wordmark logo, sized in em to inherit context
    return (
      <img
        src={logo}
        alt={alt}
        className={logoClass}
        style={{ height: `${logoHeightEm}em`, width: "auto", display: "inline-block", verticalAlign: "middle" }}
      />
    );
  }
  return (
    <>
      <span className={exelClass} style={exelStyle}>eXeL</span>{" "}
      <span className={aiClass} style={aiStyle}>{ai}</span>
    </>
  );
}
