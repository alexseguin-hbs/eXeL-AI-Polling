/**
 * SECURITY-2525 · Country name labels for the world view (2D flat + 3D globe).
 * Label anchor = an approximate interior/centroid point (chosen for readable placement,
 * not the capital). Curated set of the larger / strategically-relevant states — enough to
 * read the map as a world map without clutter. `min` = declutter gate: the label shows only
 * when the visible span is ≤ this many degrees (i.e. once zoomed in enough). Big countries omit
 * it and always show; smaller states appear as you zoom in.
 */
export interface Country {
  name: string;
  lat: number;
  lon: number;
  /** show only when the visible longitude span ≤ this (deg); omitted = always show. */
  min?: number;
}

export const COUNTRIES: Country[] = [
  // ── North America ──
  { name: "UNITED STATES", lat: 39.5, lon: -98.5 },
  { name: "CANADA", lat: 58.0, lon: -106.0 },
  { name: "MEXICO", lat: 23.6, lon: -102.5 },
  { name: "GREENLAND", lat: 72.0, lon: -40.0 },
  { name: "GUATEMALA", lat: 15.5, lon: -90.3, min: 40 },
  { name: "CUBA", lat: 21.5, lon: -79.0, min: 40 },
  { name: "HONDURAS", lat: 14.8, lon: -86.5, min: 60 },
  { name: "NICARAGUA", lat: 12.9, lon: -85.2, min: 60 },
  { name: "PANAMA", lat: 8.5, lon: -80.1, min: 60 },
  // ── South America ──
  { name: "BRAZIL", lat: -10.0, lon: -52.0 },
  { name: "ARGENTINA", lat: -35.0, lon: -65.0 },
  { name: "PERU", lat: -9.5, lon: -75.0 },
  { name: "COLOMBIA", lat: 3.5, lon: -73.0 },
  { name: "BOLIVIA", lat: -16.5, lon: -64.5 },
  { name: "VENEZUELA", lat: 7.0, lon: -66.0 },
  { name: "CHILE", lat: -35.0, lon: -71.0 },
  { name: "PARAGUAY", lat: -23.4, lon: -58.4, min: 40 },
  { name: "URUGUAY", lat: -32.8, lon: -55.8, min: 40 },
  { name: "ECUADOR", lat: -1.5, lon: -78.5, min: 40 },
  // ── Europe ──
  { name: "UNITED KINGDOM", lat: 54.0, lon: -2.5, min: 25 },
  { name: "IRELAND", lat: 53.2, lon: -8.0, min: 40 },
  { name: "FRANCE", lat: 46.6, lon: 2.5, min: 25 },
  { name: "SPAIN", lat: 40.0, lon: -3.5 },
  { name: "PORTUGAL", lat: 39.6, lon: -8.0, min: 40 },
  { name: "GERMANY", lat: 51.2, lon: 10.4, min: 25 },
  { name: "ITALY", lat: 42.8, lon: 12.8, min: 25 },
  { name: "POLAND", lat: 52.1, lon: 19.4, min: 30 },
  { name: "UKRAINE", lat: 49.0, lon: 32.0 },
  { name: "ROMANIA", lat: 45.9, lon: 25.0, min: 40 },
  { name: "SWEDEN", lat: 62.5, lon: 15.5, min: 30 },
  { name: "NORWAY", lat: 62.0, lon: 9.0, min: 30 },
  { name: "FINLAND", lat: 64.0, lon: 26.0, min: 40 },
  { name: "GREECE", lat: 39.2, lon: 22.0, min: 40 },
  { name: "TURKEY", lat: 39.0, lon: 35.0 },
  { name: "ICELAND", lat: 64.9, lon: -18.6, min: 40 },
  // ── Africa ──
  { name: "ALGERIA", lat: 28.0, lon: 3.0 },
  { name: "LIBYA", lat: 27.0, lon: 17.0 },
  { name: "EGYPT", lat: 26.8, lon: 30.0 },
  { name: "SUDAN", lat: 15.5, lon: 30.0 },
  { name: "CHAD", lat: 15.5, lon: 18.7, min: 40 },
  { name: "NIGER", lat: 17.6, lon: 8.0, min: 40 },
  { name: "MALI", lat: 17.5, lon: -3.5, min: 40 },
  { name: "MAURITANIA", lat: 20.3, lon: -10.5, min: 50 },
  { name: "NIGERIA", lat: 9.5, lon: 8.0, min: 30 },
  { name: "ETHIOPIA", lat: 8.6, lon: 39.6, min: 30 },
  { name: "KENYA", lat: 0.5, lon: 37.9, min: 40 },
  { name: "TANZANIA", lat: -6.4, lon: 34.9, min: 40 },
  { name: "DEM. REP. CONGO", lat: -2.0, lon: 23.6, min: 30 },
  { name: "ANGOLA", lat: -12.3, lon: 17.9, min: 30 },
  { name: "SOUTH AFRICA", lat: -29.0, lon: 24.0 },
  { name: "NAMIBIA", lat: -22.0, lon: 17.2, min: 40 },
  { name: "MOROCCO", lat: 31.8, lon: -7.0, min: 40 },
  { name: "SOMALIA", lat: 5.2, lon: 46.2, min: 50 },
  { name: "MADAGASCAR", lat: -19.4, lon: 46.9, min: 40 },
  // ── Middle East / Central Asia ──
  { name: "SAUDI ARABIA", lat: 24.0, lon: 45.0 },
  { name: "IRAN", lat: 32.5, lon: 54.0 },
  { name: "IRAQ", lat: 33.0, lon: 43.7, min: 40 },
  { name: "SYRIA", lat: 35.0, lon: 38.5, min: 50 },
  { name: "YEMEN", lat: 15.5, lon: 47.6, min: 50 },
  { name: "KAZAKHSTAN", lat: 48.0, lon: 68.0 },
  { name: "AFGHANISTAN", lat: 33.9, lon: 66.0, min: 40 },
  { name: "PAKISTAN", lat: 30.0, lon: 69.4 },
  // ── Asia ──
  { name: "RUSSIA", lat: 61.5, lon: 90.0 },
  { name: "CHINA", lat: 35.9, lon: 104.2 },
  { name: "INDIA", lat: 22.5, lon: 79.0 },
  { name: "MONGOLIA", lat: 46.9, lon: 103.0, min: 30 },
  { name: "MYANMAR", lat: 21.0, lon: 96.0, min: 40 },
  { name: "THAILAND", lat: 15.5, lon: 101.0, min: 40 },
  { name: "VIETNAM", lat: 16.0, lon: 107.5, min: 50 },
  { name: "INDONESIA", lat: -2.5, lon: 118.0 },
  { name: "JAPAN", lat: 37.5, lon: 138.5, min: 30 },
  { name: "SOUTH KOREA", lat: 36.5, lon: 127.9, min: 50 },
  { name: "NORTH KOREA", lat: 40.3, lon: 127.0, min: 50 },
  { name: "PHILIPPINES", lat: 12.0, lon: 122.5, min: 40 },
  { name: "MALAYSIA", lat: 4.2, lon: 109.5, min: 50 },
  // ── Oceania ──
  { name: "AUSTRALIA", lat: -25.0, lon: 134.0 },
  { name: "NEW ZEALAND", lat: -41.5, lon: 172.5, min: 40 },
  { name: "PAPUA NEW GUINEA", lat: -6.5, lon: 144.5, min: 50 },
];
