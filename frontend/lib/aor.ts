/**
 * SECURITY-2525 · AOR (Area of Responsibility) buffer
 * ===================================================
 * AOR = the AO polygon expanded outward by `km` (10–100). Per-vertex radial offset
 * from the polygon centroid — robust and stable for the roughly-convex AOs planners
 * draw. Pure + deterministic so the geometry can be unit-tested without a browser.
 * Coordinates are [lat, lon]. km→deg uses local scale (lon compressed by cos(lat)).
 */
export function bufferPolygon(poly: [number, number][], km: number): [number, number][] {
  if (poly.length < 3 || km <= 0) return poly;
  const clat = poly.reduce((a, p) => a + p[0], 0) / poly.length;
  const clon = poly.reduce((a, p) => a + p[1], 0) / poly.length;
  const cosc = Math.cos((clat * Math.PI) / 180) || 1e-6;
  return poly.map(([la, lo]) => {
    const vy = (la - clat) * 110.574, vx = (lo - clon) * 111.32 * cosc;
    const L = Math.hypot(vx, vy) || 1e-6;
    const ny = (vy / L) * km, nx = (vx / L) * km;
    return [clat + (vy + ny) / 110.574, clon + (vx + nx) / (111.32 * cosc)] as [number, number];
  });
}

/** Signed area (deg²) via the shoelace formula — sign encodes winding, |value| the extent. */
export function polygonArea(poly: [number, number][]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [y1, x1] = poly[i], [y2, x2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}
