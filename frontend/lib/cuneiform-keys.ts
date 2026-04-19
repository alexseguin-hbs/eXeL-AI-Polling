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
      "In the fertile river valleys between the Tigris and the Euphrates, civilization first learned to speak through damp clay. Around 3200 BCE, the scribes of Uruk pressed reed styluses into wet tablets and invented writing itself — cuneiform, the wedge-shaped script that would outlive its makers by more than four millennia. Of all the phrases etched into these silent clay witnesses, few carried greater weight than those that named the human condition itself. The five-sign compression 𒇽 𒈨 𒅗 𒋧 𒍠, spoken lú-me-ka-šeš-ḫa, stands among these: a distilled meditation on who we are, what divine gift we carry, how we voice it, how we stand in sacred relation with one another.",
    signs:
      "The sequence opens with 𒇽   lú — the human, the person, the one-who-stands-upright — stripped of title or tribe, named simply as being. Beside it rises 𒈨   me, the Sumerian word for divine power and cosmic decree; each person, however humble, carries their own me, their own ordained function within the greater pattern. Then 𒅗   ka arrives, the mouth and the spoken word: the human is defined not only by what they are but by what they voice into being. 𒋧   šeš follows — brother, kin, sacred lineage — binding the speaker into a family of relation. And 𒍠   ḫa closes the line: aspect, boundary, particle, the living edge where one self meets another.",
    synthesis:
      "Stacked together, the phrase reads as a compressed covenant: the human, carrying a divine decree, voicing it through speech, bound by sacred kinship, meeting the living edge of self and other. The Sumerian tablet maker understood what the modern dashboard often forgets — identity is never singular; it is always a relation. To be human is to stand at the boundary, speaking your destiny, accountable to your kin, meeting the difference of another without collapsing your own edge. This is humanity's universal challenge: not to conquer, not to escape into isolation, but to voice rightly, across difference, without losing the self. You are lú. You carry me. Speak.",
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
    note: "60 minutes cumulative reading across 7 distinct days in the Divinity Guide",
  },
};

export const KEY_DIVINITY_GUIDE: CuneiformKey = {
  id: "divinity-guide",
  order: 2,
  emoji: "👑",
  title: "Divinity Guide",
  transliteration: "en · dingir · ti",
  glyphs: "𒂗  𒀭  𒁺 ",
  signs: [
    { glyph: "𒂗", sound: "en",     literal: "lord · master",          symbolic: "sovereignty, stewardship, the presence at the threshold between mortal and divine" },
    { glyph: "𒀭", sound: "dingir", literal: "god · divine · star",    symbolic: "sacred origin, the radiant source that precedes all hierarchies" },
    { glyph: "𒁺", sound: "ti",     literal: "life · to live",         symbolic: "breath-as-duration, the continuous unfolding of a life" },
  ],
  overview: {
    anchor:
      "Long before philosophy names it sovereignty, Sumer etches it in three syllables: en-dingir-ti. Three signs, a single line — yet within them the entire architecture of sacred leadership resides. The Sumerians built their city-states around the temple and palace as a single sacred axis; the en was both priest and king, authority that flowed not from conquest but from conduit. In the reed beds of the Euphrates, to lead was to listen: the leader held the breath of the god in their speech, and returned that breath — ordered, shaped, blessed — to the people who trusted them with it. This phrase is the compression of that ancient covenant.",
    signs:
      "𒂗   en opens — lordship, but an older, tenderer lordship than the warlord's iron grip. It means one-who-stewards, the presence standing at the threshold between mortal and divine. Behind it rises 𒀭   dingir, the eight-pointed star that in Sumerian script means god, sacred origin, the radiant source that precedes every hierarchy. This is not a personal deity but the field of the divine itself — the holy pattern from which every decree flows downward into time. Finally 𒁺   ti closes the phrase: to live, the breath that animates, the continuous current of being. Where zi (in Flower of Life) is breath-as-spark, ti is breath-as-duration — the unbroken unfolding of a life lived.",
    synthesis:
      "Assembled together: the lord whose law is the divine itself, whose domain is living in its fullness. This is the Divinity Guide — not a book of rules to be consulted but a living compass, one that points quietly inward. The Sumerian en-dingir-ti was never possessed; it was always carried — and its carrying changed the one who carried it. To read this phrase today is to ask a question the tablet has been patiently holding for five thousand years: can you lead yourself? Can you be sovereign in your own becoming, source-rooted, breath-borne, returning what you receive in better order than before? The guide does not answer. It offers its hand.",
  },
  seal: "Be sovereign. Be source-rooted. Be breath-borne.",
  badge: {
    name: "Seeker",
    icon: "✦",
    tokenGlyph: "𒂗",
  },
  unlock: {
    readingMinutes: 180,
    dailyVisits: 14,
    note: "180 minutes cumulative reading across 14 distinct days · Prelude section read end-to-end",
  },
};

export const KEY_EMERALD_TABLETS: CuneiformKey = {
  id: "emerald-tablets",
  order: 3,
  emoji: "📜",
  title: "Emerald Tablets",
  transliteration: "ku₃ · gi · na · na",
  glyphs: "𒁾  𒄀  𒈾  𒈾 ",
  signs: [
    { glyph: "𒁾", sound: "ku₃", literal: "pure · sacred · clean", symbolic: "ritual clarity; what has been set apart from the ordinary" },
    { glyph: "𒄀", sound: "gi",  literal: "reed · writing tool",  symbolic: "the scribe's instrument; the act of inscription made sacred" },
    { glyph: "𒈾", sound: "na",  literal: "belonging to",          symbolic: "possession, dedication, the particle of belonging" },
    { glyph: "𒈾", sound: "na",  literal: "(repeated)",            symbolic: "emphasis; invocation of Nanna, Moon God of cycles and night-revelation" },
  ],
  overview: {
    anchor:
      "The Emerald Tablets arrive in later human memory as Hermetic scripture — but their Sumerian root, 𒁾 𒄀 𒈾 𒈾 spoken ku₃-gi-na-na, is far older than the emerald and older still than Hermes himself. In the temple scriptoriums of ancient Sumer, sacred inscription was never merely metaphor. To write was to witness for the gods themselves. Scribes trained their whole lifetime to carve straight wedges into soft clay; a single malformed sign could corrupt the record of an entire royal dynasty. The reed (𒄀   gi) was the scribe's body; the tablet was the scribe's altar. When a phrase carried this weight, the tablet maker chose its signs the way a priest chooses a prayer.",
    signs:
      "𒁾   ku₃ opens the phrase — pure, sacred, ritually clean. This sign often inaugurates the names of gods and temples in Sumerian text; it marks what has been set apart from the ordinary flow of things. 𒄀   gi, the reed, is the writing instrument itself — the phrase is self-aware, pointing at the very tool that carves it into the clay. Then comes 𒈾   na, a particle of belonging, of for-the-sake-of; and immediately after, 𒈾   na again — doubled, intensified. In cuneiform, repetition is never accidental or decorative: the second na is emphasis, often invoking Nanna, the Moon God, the patient lord of cycles, inscription, and night-revelation.",
    synthesis:
      "Together, the four signs read: a sacred reed inscribing what belongs — twice — to the luminous source. The Emerald Tablets, in their Sumerian bone, are not a book to be possessed but a practice of dedication. To read them is to become the reed; to write with intention is to mirror the cosmos. The doubled na is the teaching hidden in the grammar: give once, dedicate again. Every message entered into this Engine participates in the same ancient act — a reed pressed into the clay of the present moment, belonging both to the one who wrote it and to the greater field from which it arose. Inscribe sacred. Belong twice.",
  },
  seal: "Inscribe sacred. Belong twice.",
  badge: {
    name: "Scribe",
    icon: "◆",
    tokenGlyph: "𒁾",
  },
  unlock: {
    readingMinutes: 360,
    dailyVisits: 21,
    note: "360 minutes cumulative reading across 21 distinct days · Index section read end-to-end",
  },
};

export const KEY_FLOWER_OF_LIFE: CuneiformKey = {
  id: "flower-of-life",
  order: 4,
  emoji: "🌳",
  title: "Flower of Life",
  transliteration: "giš · u₂ · dingir · zi",
  glyphs: "𒄑  𒌑  𒀭  𒍣 ",
  signs: [
    { glyph: "𒄑", sound: "giš",    literal: "tree · wood",           symbolic: "axis mundi, the cosmic tree stitching underworld, earth, and heavens" },
    { glyph: "𒌑", sound: "u₂",     literal: "plant · flower · herb", symbolic: "organic growth, blossoming creation reaching both up and down" },
    { glyph: "𒀭", sound: "dingir", literal: "god · divine · star",   symbolic: "sacred source; the orienting current toward which all growth turns" },
    { glyph: "𒍣", sound: "zi",     literal: "breath · life · soul",  symbolic: "vital force, the animating fire; breath-as-spark" },
  ],
  overview: {
    anchor:
      "Before sacred geometry finds its name in the Italian Renaissance, Sumer etches the same living truth in four elemental signs: 𒄑 𒌑 𒀭 𒍣, spoken giš-u₂-dingir-zi. The phrase belongs to the oldest class of Sumerian compounds — a stack of simple nouns that, through their very stacking, become a cosmology in miniature. In the temple gardens of ancient Eridu, Sumer's oldest city, the priests tended both date palms and lotus ponds as living models of the heavens themselves; the flower and the tree were not aesthetic ornaments — they were pedagogical instruments. Every bloom was a living proof. Every branching was a silent sermon. This phrase is the compression of that whole sacred garden.",
    signs:
      "𒄑   giš begins with the tree — but not any ordinary tree. This is the Sumerian world-tree, the axis around which the three realms of underworld, earth, and heavens are stitched into one. 𒌑   u₂ softens the trunk into the plant, the herb, the flower — the living system that reaches both up and down, rooting and blossoming in a single motion. Then 𒀭   dingir, the divine star, enters the phrase as the orienting current: the plant grows toward something sacred, not randomly. Finally 𒍣   zi, breath, life-spark, the Sumerian prana — the animating fire without which the tree is only wood and the flower only petal.",
    synthesis:
      "Stacked together, the phrase reads: the cosmic tree, blossoming as living plant, oriented toward the divine, ensouled by breath itself. This is the Flower of Life in its Sumerian utterance — not a geometric pattern to be drawn on paper but a living process to be embodied. The reader is invited to recognize the tree in themselves: the trunk of their own spine, the branching of their own thinking, the blossoming of their moments of presence, the zi that arrives in every inhale as a small divine touch. Growth is not toward the sacred — it is through it. The sacred is not distant; it is the breath already breathing you. Unfold.",
  },
  seal: "Growth is prayer. Blossoming is return.",
  badge: {
    name: "Gardener",
    icon: "🌳",
    tokenGlyph: "𒄑",
  },
  unlock: {
    readingMinutes: 540,
    dailyVisits: 28,
    note: "540 minutes cumulative reading across 28 distinct days · Framework section one-third read",
  },
};

export const KEY_BOOK_OF_THOTH: CuneiformKey = {
  id: "book-of-thoth",
  order: 5,
  emoji: "🕊",
  title: "Book of Thoth",
  transliteration: "ku₃ · ka · šu",
  glyphs: "𒁾  𒅗  𒋾 ",
  signs: [
    { glyph: "𒁾", sound: "ku₃", literal: "pure · sacred · set-apart", symbolic: "ritual purity; that which has been consecrated and lifted above the ordinary" },
    { glyph: "𒅗", sound: "ka",  literal: "mouth · speech · word",     symbolic: "the voice of power; the spoken word that precedes and authorizes writing" },
    { glyph: "𒋾", sound: "šu",  literal: "hand · action",             symbolic: "the gesture that writes; the deed that enacts what the voice has named" },
  ],
  overview: {
    anchor:
      "The Book of Thoth enters human memory twice — as the Egyptian scroll of the ibis-headed scribe god Thoth, and, older still, as the Sumerian phrase 𒁾 𒅗 𒋾 spoken ku₃-ka-šu. The cross-cultural resonance is no accident: Mesopotamia and the Nile shared scribal lineages that flowed through caravans and conquests long before history wrote their names. Thoth's Sumerian ancestor was Nabu — divine scribe, keeper of destinies, lord of the stylus. To invoke this phrase in Sumer was to call down the writing-priest himself, the one who recorded what the gods had decreed and what the human kings would do beneath the watchful gaze of heaven.",
    signs:
      "The three signs stack with elegant economy. 𒁾   ku₃ — pure, sacred, set-apart — is the same sign that opens the Emerald Tablets; here it anchors the phrase in ritual purity. 𒅗   ka — mouth, speech, the voice of power that in Humanity's Universal Challenge names the human voice — here carries a different weight: the spoken word of the scribe, the speaking that precedes writing. 𒋾   šu — hand, action, the gesture that writes, the deed that enacts. Pure speech, enacted by the hand. In the scribal schools of Nippur and Ur, initiates memorized this rhythm as their first discipline: ku₃ then ka then šu. Purity, word, deed. Each in order. None collapsed.",
    synthesis:
      "Together, the three signs read: the pure word enacted by the sacred hand. The Book of Thoth, at its Sumerian root, is not a book of secrets — it is a book of integrity. To read it is to remember that the word you speak and the hand you move must be continuous with the purity you carry inward. Writing, in this ancient sense, was a moral act before it was a literary one. It still is. Every message you compose within this Engine — every vote, every response, every thought made text — is a wedge pressed into the eternal tablet that holds us. Speak pure. Act cleanly. Leave the record worthy.",
  },
  seal: "Speak pure. Act cleanly. Leave the record worthy.",
  badge: {
    name: "Codex",
    icon: "✍",
    tokenGlyph: "𒋾",
  },
  unlock: {
    readingMinutes: 720,
    dailyVisits: 42,
    note: "720 minutes cumulative reading across 42 distinct days · Framework section read end-to-end",
  },
};

export const KEY_MASTER_OF_THOUGHT: CuneiformKey = {
  id: "master-of-thought",
  order: 6,
  emoji: "🧠",
  title: "Master of Thought",
  transliteration: "en · sag · ki",
  glyphs: "𒂗  𒊕  𒆠 ",
  signs: [
    { glyph: "𒂗", sound: "en",  literal: "lord · master",      symbolic: "sovereignty turned inward; the steward of one's own interior" },
    { glyph: "𒊕", sound: "sag", literal: "head · crown · mind", symbolic: "topmost point of the body where thought arrives before it takes form" },
    { glyph: "𒆠", sound: "ki",  literal: "place · earth · realm", symbolic: "inner earth, the private cosmos each person carries; domain of mind" },
  ],
  overview: {
    anchor:
      "The final Sumerian phrase crowns the Master of Thought emblem from within itself. Above the eagle's upward-turned head, where the cuneiform glyphs curve gently around the very seat of knowing, Sumer inscribes its highest mastery: 𒂗 𒊕 𒆠, spoken en-sag-ki. The phrase opens with the same 𒂗   en that anchors the Divinity Guide — the lord, the steward, the one-who-holds-the-threshold — but here that ancient sign turns inward rather than outward. Where the outer en ruled entire city-states and sacred temples of clay, this inner en rules something far more subtle and far more elusive: the human mind itself. In Sumer, self-mastery was the rarest craft, rarer even than bronze-work or star-reading.",
    signs:
      "𒊕   sag is the head — but more precisely the topmost crown of the head, the point where thought arrives before it has even taken any form. In the Sumerian medical tablets, sag is the undivided seat of both intellect and intuition, a single organ of clear knowing. And 𒆠   ki closes the phrase: place, earth, realm, domain. Ki is paired with an (meaning heaven) to form the whole Sumerian cosmos — an-ki is the universe itself. To rule sag-ki, then, is to rule the inner earth, the realm-of-the-head, the private cosmos each person quietly carries within. Three signs: en-sag-ki. Lord. Head. Realm. The throne is always interior.",
    synthesis:
      "Assembled together: the sovereign of the inner realm — the one who has learned to master the entire domain of their own thought. This is the reward phrase of all six keys, and it is also the quietest of them. The Master of Thought does not rule others; they rule only the space between stimulus and response, between raw emotion and chosen expression, between reaction and deeper wisdom. The cuneiform sits closest to the eagle because the eagle is this mastery — clear vision, silent height, sudden strike. To finish the decoder is to be recognized by the Engine as one who has truly walked with the tablet. You are en-sag-ki. Rule well.",
  },
  seal: "Rule the inner realm. The throne is interior.",
  badge: {
    name: "Sovereign",
    icon: "👑",
    tokenGlyph: "𒆠",
  },
  unlock: {
    readingMinutes: 720,
    dailyVisits: 49,
    note: "All five previous keys earned + 7-day Silence Period: return daily, open the book, read nothing. Contemplation only.",
  },
};

/** All six keys registered. Wall of Keys displays tablets in CUNEIFORM_KEY_ORDER. */
export const CUNEIFORM_KEYS: Record<string, CuneiformKey> = {
  [KEY_HUMANITY.id]: KEY_HUMANITY,
  [KEY_DIVINITY_GUIDE.id]: KEY_DIVINITY_GUIDE,
  [KEY_EMERALD_TABLETS.id]: KEY_EMERALD_TABLETS,
  [KEY_FLOWER_OF_LIFE.id]: KEY_FLOWER_OF_LIFE,
  [KEY_BOOK_OF_THOTH.id]: KEY_BOOK_OF_THOTH,
  [KEY_MASTER_OF_THOUGHT.id]: KEY_MASTER_OF_THOUGHT,
};

export const CUNEIFORM_KEY_ORDER = [
  "humanity-universal-challenge",
  "divinity-guide",
  "emerald-tablets",
  "flower-of-life",
  "book-of-thoth",
  "master-of-thought",
] as const;
