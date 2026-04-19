/**
 * Sumerian Cuneiform Keys — data schema + Key 1 (Humanity's Universal Challenge).
 *
 * Each key is revealed progressively through sustained reading of the Divinity
 * Guide. Click the corresponding arc on the Master of Thought emblem → opens
 * the dedicated page at /divinity-guide/sumerian-keys/[keyId].
 */

export interface CuneiformSign {
  glyph: string;
  sound: string;
  literal: string;
  symbolic: string;
}

export interface CuneiformKey {
  /** URL slug */
  id: string;
  /** 1 through 6 — unlock order */
  order: number;
  /** Thematic sigil (emoji or symbol) */
  emoji: string;
  /** English phrase */
  title: string;
  /** Transliteration with middle-dot separators, e.g. "lú · me · ka · šeš · ḫa" */
  transliteration: string;
  /** Cuneiform glyphs with wide spacing */
  glyphs: string;
  /** Per-sign breakdown table */
  signs: CuneiformSign[];
  /** Exactly 3 paragraphs, ~111 words each, totalling ~333 words */
  overview: {
    anchor: string;   // Sumerian historical anchor + phonetic unveil
    signs: string;    // Sign-by-sign narrative
    synthesis: string; // Compression + poetic close
  };
  /** One-line synthesis displayed in the gold seal */
  seal: string;
  /** Badge awarded on unlock */
  badge: {
    name: string;
    icon: string;   // visible symbol (◎ ✦ ◆ 🌳 ✍ 👑)
    tokenGlyph: string; // Sumerian sign minted as token
  };
  /** Unlock thresholds */
  unlock: {
    readingMinutes: number;
    dailyVisits: number;
    note?: string;
  };
}

export const KEY_HUMANITY: CuneiformKey = {
  id: "humanity-universal-challenge",
  order: 1,
  emoji: "🌌",
  title: "Humanity's Universal Challenge",
  transliteration: "lú · me · ka · šeš · ḫa",
  glyphs: "𒇽  𒈨  𒅗  𒋧  𒍠 ",
  signs: [
    { glyph: "𒇽", sound: "lú",  literal: "man · person",         symbolic: "the one-who-stands-upright; humanity stripped of title or tribe" },
    { glyph: "𒈨", sound: "me",  literal: "divine power · decree", symbolic: "cosmic function, the spiritual destiny each person carries" },
    { glyph: "𒅗", sound: "ka",  literal: "mouth · speech",       symbolic: "voice of power; the human defined by what they voice" },
    { glyph: "𒋧", sound: "šeš", literal: "brother · kin",         symbolic: "sacred kinship, spiritual lineage; no solitary self" },
    { glyph: "𒍠", sound: "ḫa",  literal: "side · aspect",        symbolic: "boundary, the edge where one self meets another" },
  ],
  overview: {
    anchor:
      "In the river valleys of ancient Sumer, civilization first learned to speak through clay. Around 3200 BCE, the scribes of Uruk pressed reed styluses into damp tablets and invented writing itself — cuneiform, the wedge-shaped script that would outlive its makers by four millennia. Of all the phrases etched into these clay witnesses, few carried more weight than those that named the human condition. The five-sign compression lú-me-ka-šeš-ḫa is such a phrase: a distilled meditation on who we are, what we carry, and how we stand among one another in sacred relation.",
    signs:
      "The sequence opens with 𒇽 lú — the human, the person, the one-who-stands-upright — stripped of title or tribe, named simply as being. Beside it rises 𒈨 me, the Sumerian word for divine power or cosmic decree; each person carries their own me, their own ordained function. Then 𒅗 ka, the mouth and speech: the human is defined not only by what they are but by what they voice. 𒋧 šeš follows — brother, kin, sacred lineage — binding the speaker into relation. And 𒍠 ḫa closes the line: aspect, boundary, the edge where one self meets another.",
    synthesis:
      "Stacked, the phrase reads as a compressed covenant: the human, carrying divine decree, voicing it through speech, bound in kinship, meeting the edge of self. The Sumerian tablet maker knew what the modern dashboard often forgets — identity is never singular. To be human is to stand at the boundary, speaking destiny, accountable to kin. This is the universal challenge: not to conquer, not to escape, but to voice rightly, across difference, without losing the self. You are lú. You carry me. Speak.",
  },
  seal: "You are lú. You carry me. Speak.",
  badge: {
    name: "Awakener",
    icon: "◎",
    tokenGlyph: "𒇽",
  },
  unlock: {
    readingMinutes: 60,
    dailyVisits: 7,
    note: "Read 60 minutes across 7 distinct days in the Divinity Guide",
  },
};

/** Registry — other five keys will be added one at a time per user's iterative review. */
export const CUNEIFORM_KEYS: Record<string, CuneiformKey> = {
  [KEY_HUMANITY.id]: KEY_HUMANITY,
};

export const CUNEIFORM_KEY_ORDER = [
  "humanity-universal-challenge",
  // "divinity-guide",
  // "emerald-tablets",
  // "flower-of-life",
  // "book-of-thoth",
  // "master-of-thought",
] as const;
