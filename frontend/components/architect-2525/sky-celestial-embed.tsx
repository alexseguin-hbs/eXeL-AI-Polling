"use client";

/**
 * SKY TAB · Celestial-2525 master embed (Architect-2525 → Design → Sky).
 * =================================================================================================
 * Operator doctrine: "The master design is always the Celestial-2525 — use an iframe so code does not
 * have to be repurposed." The Sky section therefore renders the SAME /main/Celestial-2525 reader that
 * ships standalone (flower selector · dual-language reader · BASE-3600 celestial map). One master, one
 * source of truth — any celestial iteration lands there and flows to the Architect Sky tab for free.
 */
export function SkyCelestialEmbed() {
  return (
    <div data-sky-celestial-embed className="w-full overflow-hidden rounded-lg border" style={{ borderColor: "#1e2b3a", height: "78vh" }}>
      <iframe
        src="/main/Celestial-2525/"
        title="Celestial-2525 · master design"
        loading="lazy"
        className="h-full w-full border-0"
        // sandbox kept permissive for same-origin interactivity (drag/zoom, selection, dual-language);
        // it is our own route, so scripts + same-origin are allowed.
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </div>
  );
}
