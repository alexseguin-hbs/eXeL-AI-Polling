// The Atlantis Accords — viewer data
// 7 sections × 4 word tiers (7 / 33 / 111 / 333)
// Source of truth: docs/ATLANTIS_ACCORDS.md v2.0

export type WordLevel = 7 | 33 | 111 | 333;

export interface AccordSection {
  id: string;
  page: number;
  tag: string; // PILOT
  title: string; // Where Innovation Begins
  content: Record<WordLevel, string>;
}

// 7 sections × 4 tiers, English source. Other languages fall back to English
// via the same pattern the Divinity Guide uses until translations land.
export const ACCORD_SECTIONS_EN: AccordSection[] = [
  {
    id: "pilot",
    page: 1,
    tag: "PILOT",
    title: "Where Innovation Begins",
    content: {
      7: "Leaders begin what no century has begun.",
      33: "Three regions — Cambodia, Honduras, Austin — promise to host young learners, protect them, and hand them the tools of the future. Government, Education, Innovation: three visionary signatures per region. One beginning together.",
      111: "The Atlantis Accords is a promise made by leaders willing to begin something that has not existed before. Its founding signatories in Cambodia, Honduras, and Austin, Texas were chosen for one rare quality: the willingness to trust the young with the tools of the future while there is still time to teach them. Signing the accord commits the region to host learners across cultures, contribute what only it can uniquely offer, and hold itself to a standard higher than current regulation requires. Three visionary signatures — Government, Education, Innovation — enter the accord together. Three visionaries, three regions, one shared beginning.",
      333: "Every civilization is remembered by what it chose to begin. The Atlantis Accords is a promise made by leaders willing to begin something that has not existed before — a shared foundation for ordinary human innovation that reaches every corner of the world, honors every voice, and endures across generations. Its founding signatories in Cambodia, Honduras, and Austin, Texas were not chosen for economic power, for military strength, or for institutional prestige. They were chosen for a rarer quality: the willingness to trust the young with the tools of the future. This is what leadership means in the century ahead — the courage to hand over the keys to the next generation while there is still time to teach them how to drive.\n\nThe accord is convened by eXeL, an organizing force purpose-built for this moment. eXeL exists deliberately outside the traditional coordination channels that shaped the last century — outside diplomatic treaty structures, outside multilateral bureaucracies, outside the political entanglements of any single nation-state. eXeL is the trusted convener that brings visionary leaders together around a shared framework, a shared flywheel, and a shared five-hundred-year horizon. Every signatory retains full sovereignty, full authority over its own citizens, and full freedom to withdraw at any moment. What signatories gain is the network effect that only a purpose-built framework can provide. This is coordination without any single form of political domination.\n\nSigning the accord is signing a promise. That the region will host young learners across cultures. That the region will contribute what only it can uniquely offer. That the region will hold itself to a standard higher than current regulation requires. That the region will do so publicly, transparently, in view of every citizen it serves. Three signatures are required from each region — Government, Education, and Innovation. No single office binds the accord alone. It takes three visionaries to say yes. Three visionaries, three regions, one beginning — this is how any framework enters life through the mutual trust of leaders willing to sign it into being.",
    },
  },
  {
    id: "replay",
    page: 2,
    tag: "REPLAY",
    title: "Learning Through Simulation",
    content: {
      7: "Practice a thousand times before touching.",
      33: "Nothing consequential is learned first on live hardware. Every participant practices in simulation, rotates across three regions, celebrates publicly. This is respect for the young human whose first mistake should never cost a life.",
      111: "Every discipline worth mastering was learned by someone before it was known. The Atlantis Accords returns this ancient wisdom to the center of how the young are prepared to build the future. Nothing consequential is learned first on live hardware, on real people, or in irreversible conditions. Every participant practices in simulation until practice becomes competence, and competence becomes readiness. The rotation model carries every participant through the three founding regions, and every rotation ends in a public and cooperative celebration open to the wider host community. This is respect for the young human whose first mistake should never cost a life.",
      333: "Every discipline worth mastering was learned by someone before it was known. Master craftspeople rehearse before performance, pilots rehearse before flight, physicians rehearse before surgery, and children rehearse the world through play. The Atlantis Accords returns this ancient wisdom to the center of how the young are prepared to build the future. Nothing consequential is learned first on live hardware, on real people, or in irreversible conditions. Every participant practices in simulation until practice becomes competence, and competence becomes readiness. This is not caution — this is respect for the young human whose first mistake should never cost anyone their life.\n\nThe accord's rotation model carries every participant through the three founding regions. What is learned in Cambodia is refined in Honduras and completed in Austin. What is discovered in Austin is questioned in Cambodia and integrated in Honduras. Every participant lives, learns, and is mentored across cultures that would otherwise remain distant. The training curriculum draws from disciplined-simulation traditions across many cultures — from Sun Tzu's strategic education tradition, from Musashi's practice-through-play, from Ibn Khaldun's cyclical learning theory, from Nalanda's monastic dialectic, from the civilian flight-simulator — synthesized to respect every cognitive stage and cultural inheritance. No single tradition dominates.\n\nEvery rotation ends in a public and cooperative celebration open to the wider host community. Neighbors, families, and curious visitors gather to see what the cohort has learned. These events make sophisticated technology accessible and celebrated rather than fearsome. A society that grows up understanding cooperative systems through play cannot easily be manipulated by fear about those systems. This is deterrence through education, not deterrence through force. The accord's promise to every parent: your child will practice a thousand times in safety before touching anything that could harm them, and the community will witness their growth every step of the way. This is what respect for the young human looks like when it is engineered into a framework, and this is what leadership hands the next generation of participants before that generation must demand it.",
    },
  },
  {
    id: "qualify",
    page: 3,
    tag: "QUALIFY",
    title: "Safety Verified Before Trust Extended",
    content: {
      7: "Safety proven first, then trust extended.",
      33: "Every facility and every rotation sits inside a protective envelope with early warning. Hardware refuses weaponization. Records survive turbulence. Safety is engineered around the youngest participant every day, not merely promised or assumed.",
      111: "Before trust is extended, safety must be proven. The Atlantis Accords makes this its founding commitment. Every accord facility, every rotation route, every place a young participant sleeps or studies sits inside a documented protective envelope with early-warning capability that gives the community hours, not minutes, to respond to any credible risk. Every device, every sensor, every coordination system is bound at the hardware layer to refuse repurposing for weapon-systems integration. This is not policy — this is physics. The accord is designed to remain honorable through turbulence: political instability, funding contraction, cyber attack, or travel disruption. Every scenario is planned for, and every plan places human dignity as its first design constraint.",
      333: "Before trust is extended, safety must be proven. The Atlantis Accords makes this its founding commitment. Every accord facility, every rotation route, every place a young participant sleeps or studies sits inside a documented protective envelope with early-warning capability that gives the community hours, not minutes, to respond to any credible risk. The technology used to protect participants is the same technology the accord teaches them to build — sensors, coordination, communication survivability, distributed intelligence. Young people learn safety from the inside out, in their own language and in their own region, not by being told they are safe, but by seeing how safety is engineered around them every day.\n\nThe accord makes an unbreakable promise about what its technology cannot become. Every device, every sensor, every coordination system is bound at the hardware layer to refuse repurposing for weapon-systems integration. This is not policy language. This is not aspiration. This is a physical impossibility, enforced cryptographically, verified by every signatory region, and inspectable by every citizen. The tools that protect a child in Phnom Penh cannot be repurposed to harm a child in Austin. The tools that connect a swarm exercise in Tegucigalpa cannot be reconfigured to target a human anywhere. This is the accord's answer to a century of dual-use fear. Not policy — physics.\n\nThe accord is designed to remain honorable through turbulence. If a signatory region loses political stability, participants are held by the remaining regions. If funding contracts, participant stipends are protected first, before administration and infrastructure. If digital records are attacked, offline backups persist. If travel becomes impossible, the substrate continues virtually. Every scenario is planned for, and every plan places human dignity as its first design constraint. Leaders who sign this accord are signing a promise that safety is engineered, not assumed. What they extend to their citizens is not merely opportunity, but protection built at the standard the youngest participant deserves — the same protection every leader would demand for their own child crossing an unfamiliar border alone.",
    },
  },
  {
    id: "certify",
    page: 4,
    tag: "CERTIFY",
    title: "Compensation, Well-Being, and Human Dignity",
    content: {
      7: "A stipend, a mentor, a home.",
      33: "Every participant receives a living stipend from day one. Love, loss, and safety are treated as first-class infrastructure. Success is measured by the most vulnerable participant, never the average. Dignity is substrate, never decoration.",
      111: "The Atlantis Accords treats every participant as a full human being from the first day. A stipend is provided from the moment participation begins, indexed to the region's cost of living so its impact respects local dignity of work. Well-being is treated as first-class infrastructure — not optional benefit, not a wellness perk, but the substrate on which everything else stands. Three foundational domains are supported: Love, Loss, and Safety. The accord measures success by the outcome of its most vulnerable participant, not the average. No participant will be quietly forgotten so that averages can look good. Dignity as substrate, not decoration.",
      333: "The Atlantis Accords treats every participant as a full human being from the first day. A stipend is provided from the moment participation begins, indexed to the region's cost of living so its impact respects local dignity of work. The stipend arrives before family obligations become emergencies, and before dignity is compromised. It signals to every young person that their time is valuable, their contribution is anticipated, and their family's stability is part of the accord's responsibility. This is not charity. This is the recognition that ordinary human innovation requires ordinary human security first. A mind cannot flourish while its household is under threat.\n\nWell-being is treated as first-class infrastructure — not optional benefit, not a wellness perk, but the substrate on which everything else stands. The accord names three foundational domains that every participant is supported through: Love, in the sense of connection, attachment, and healthy boundary; Loss, since every participant will experience grief and must be walked with, not around; and Safety, in the sense that every participant knows who to call, in every region, in their own language. Individual counselling, group circles, somatic practices, and cultural or spiritual practices honored per the participant's own tradition are all provided. Zero forced ideology. The accord holds space with reverence; it does not proselytize any belief system.\n\nThe accord measures success by the outcome of its most vulnerable participant, not the average. Rural participants without high bandwidth are served. Neurodivergent participants receive accommodation as the norm. Disabled participants find every facility accessible. Gender-diverse participants receive safe housing and mentor pairing. Non-native-language speakers find every artifact in their language. Indigenous participants find their cultural practices honored and their traditional knowledge protected. Leaders who sign this accord are promising that no participant will be quietly forgotten so that averages can look good. This is dignity as substrate, not decoration. What is measured is what will be honored, and what is honored here is the whole human — mind, body, and spirit together, without any exception at all.",
    },
  },
  {
    id: "adopt",
    page: 5,
    tag: "ADOPT",
    title: "Funding and Governance",
    content: {
      7: "Citizens fund the next generation directly.",
      33: "Ordinary residents contribute small monthly amounts. No aid pipeline, no foreign benefactor, no political strings. Every dollar is traceable. Every accounting is published, in every region's language, every month, publicly.",
      111: "The Atlantis Accords is funded by the citizens it serves. Ordinary residents contribute small voluntary amounts each month — modest enough that no adult is priced out, resonant enough that the total sustains the accord's work at meaningful scale. When a citizen funds the next generation directly, that citizen holds the accord accountable directly. The accord is deliberately independent of the multilateral institutions that shaped the past century. This is not a political statement — it is a design choice. Every dollar is recorded permanently and traceably. Every citizen contribution can be followed from origin to stipend to innovation. Transparency of a kind rarely offered by any institution.",
      333: "The Atlantis Accords is funded by the citizens it serves. Ordinary residents of participating regions contribute small voluntary amounts each month — amounts modest enough that no adult in any host region is priced out of participation, resonant enough that the total sustains the accord's work at meaningful scale. This design is deliberate. When a citizen funds the education of the next generation directly, that citizen holds the accord accountable directly. There is no aid pipeline, no foreign benefactor, no political string attached to the check. The accord's soul is the citizen who contributes one small amount every month, whose participation makes the whole possible.\n\nThe accord is deliberately independent of the multilateral institutions that have shaped the past century — the North Atlantic Treaty Organization, the World Health Organization, the United Nations, the International Monetary Fund, the World Bank, and every national foreign-aid channel. This is not a political statement about the worth of those institutions or their contributions. It is a design choice. Single-point dependencies compromise durability across a five-hundred-year horizon. A framework meant to serve every region regardless of geopolitical alignment cannot be entangled with any one alignment. National governments may contribute voluntarily. Contributions are transparent. No contribution buys governance influence, from any source, ever.\n\nEvery dollar and every unit of value entering the accord is recorded permanently, publicly, and traceably. Every citizen contribution can be followed from its origin to the stipend it becomes to the young person it serves to the innovation project that emerges from that young person's work. Administrative overhead is capped. Corporate and institutional gifts are welcomed and capped. Full accounting is delivered in every signatory region's language every month. Leaders who sign the accord are promising their citizens transparency of a kind rarely offered by any institution — transparency that will remain readable for centuries after every signatory has left office. This is the trust the accord requires. This is the trust the accord earns, one small traceable contribution at a time, in view of every citizen.",
    },
  },
  {
    id: "educate",
    page: 6,
    tag: "EDUCATE",
    title: "Cross-Cultural Exchange and Global Contribution",
    content: {
      7: "Every learner in their own language.",
      33: "Every activity available in the participant's language. Artificial, Human, and Shared intelligences held in productive tension — no student defers to one alone. Curricula and outcomes published openly. What one region learns, all inherit.",
      111: "The Atlantis Accords returns education to its deepest purpose: the exchange of wisdom across boundaries that would otherwise divide. Every activity is available in the participant's own language, the host region's language, and a canonical shared record. Language is not decoration — language is jurisdiction, language is dignity made readable. The education framework rests on the trinity of intelligences: Artificial proposes, Human decides, Shared Intent validates. Every student learns to hold all three in productive tension. What the accord learns, the accord gives back. Curricula, innovation outcomes, well-being research, and governance decisions are all published openly. What one region learns, all regions inherit.",
      333: "The Atlantis Accords returns education to its deepest purpose: the exchange of wisdom across boundaries that would otherwise divide. Every accord activity is available in the participant's own language, in the host region's official language, and in a canonical shared record so that no participant navigates the accord in a tongue they did not choose. Language is not decoration. Language is jurisdiction. Language is dignity made readable. When a young person from a Cambodian village reads their own stipend record in Khmer, when a young person from a Honduran town reads it in Spanish, when a young person from an Austin neighborhood reads it in English, all three are being honored equally by the same accord.\n\nThe accord's education framework rests on the trinity of intelligences that Vision 2525 makes visible. Artificial Intelligence proposes patterns, options, and possibilities faster than any human alone could. Human Intelligence decides on safety, ethics, and direction — the questions that no machine should answer. Shared Intent validates that decisions align with the accord's founding principles, ensuring no participant is asked to choose between individual excellence and collective good. No student is taught to defer to any one intelligence. Every student learns to hold all three in productive tension. This is how the next generation of leaders is prepared to govern responsibly and wisely in a world where none of these three intelligences will ever act alone or unchecked.\n\nWhat the accord learns, the accord gives back. Curricula are published under open license so any region — signatory or not — may adapt them freely to local culture and pedagogical tradition. Innovation outcomes are published. Well-being research is published in aggregated form for researchers everywhere. Governance decisions are published with their full reasoning. The accord's success is measured not only by its own participants but by the number of educational, innovation, and cultural initiatives that arise in its wake, in regions that never signed the founding pilot yet built upon its openly-shared wisdom. What one region learns, all other regions inherit.",
    },
  },
  {
    id: "expand",
    page: 7,
    tag: "EXPAND",
    title: "Sustainable Growth of the Network",
    content: {
      7: "Never faster than dignity can travel.",
      33: "Three founding regions complete one pilot cycle before a fourth joins. Records anchored to endure five centuries. Every signatory retains sovereignty. Nothing is downgraded to make room for the next signatory to join.",
      111: "The Atlantis Accords will not grow faster than the quality it can honor. Three founding regions must complete a full pilot cycle, with every participant honored and every principle verified, before a fourth region joins. This is principle finally become working discipline. The accord's horizon is deliberately long — five centuries from founding day. Its records are anchored so a citizen reading them a hundred years from now can trust the reasoning. Every signatory retains full sovereignty, full authority, and full freedom to withdraw. No signatory can compromise the founding principles — because those principles are the accord's promise to its participants across every generation.",
      333: "The Atlantis Accords will not grow faster than the quality it can honor. Every expansion is a promise to the participants already inside — that the accord's founding standard will not be diluted by the excitement of scale. Three founding regions must complete a full pilot cycle, with every participant honored and every principle verified, before a fourth region joins. This is not caution disguised as principle. This is principle finally become working discipline across every founding region. Leaders who sign the founding pilot are promising future signatories the same substrate, the same protection, the same dignity that the founding cohort received. Nothing is downgraded to make room for the next.\n\nThe accord's horizon is deliberately long. It is designed to endure for approximately fifteen to twenty human generations — five centuries from the founding day. Its records are anchored so that a citizen reading them a hundred years from now can trust the reasoning. Its coordinate frame, its human authority roles, and its cross-generational governance cycles are all built to survive any single-technology transition. The accord will outlive every human who signs its founding pilot. That is its promise to the child who signs a stipend agreement in the year following ratification, to that child's grandchildren who may govern the accord in mid-century, and to every generation that inherits what the founders build now.\n\nEvery signatory retains the freedom to withdraw with notice. Every signatory retains full sovereignty. Every signatory retains authority over its own citizens. Every signatory retains the right to propose amendments, to raise disputes, and to shape the accord's evolution alongside every other signatory. What no signatory can do is compromise the substrate's founding principles — because those principles are the accord's promise to its participants, and that promise must survive any single signature's departure. Leaders who sign this accord now are joining something larger than any one term of political office. They are signing the accord's next century, and centuries beyond, into a horizon their own grandchildren will inherit and complete.",
    },
  },
];

// Per-language content. English is the source. Any language not in this map
// falls back to English via getSection() below. Translations land here as they
// are approved through the Lexicon admin flow — same pattern as lexicon-data.ts.
export const ACCORD_TRANSLATIONS: Record<string, AccordSection[]> = {
  en: ACCORD_SECTIONS_EN,
};

export function getSection(sectionIdx: number, langCode: string): AccordSection {
  const langSections = ACCORD_TRANSLATIONS[langCode] ?? ACCORD_SECTIONS_EN;
  return langSections[sectionIdx] ?? ACCORD_SECTIONS_EN[sectionIdx];
}

export const WORD_LEVELS: WordLevel[] = [7, 33, 111, 333];

// ─── Proposed Approvals (Signatories) ──────────────────────────
// Each founding region ratifies The Atlantis Accords through three visionary
// offices — Government, Education, Innovation. No single office binds a region
// alone; all three signatures are required. Signer names remain "Pending
// ratification" until the accord is executed. Written as the official document
// and structured for later translation via SIGNATORY_TRANSLATIONS + getSignatory.
export type SignatureRole = "Government" | "Education" | "Innovation";

export interface SignatureSlot {
  role: SignatureRole;
  representative: string; // official designation of the signing office
  attestation: string; // what this office approves and commits to
  name: string; // the actual signer — "Pending ratification" until executed
  verified: boolean;
}

export interface ProposedSignatory {
  region: string;
  preamble: string; // official opening for this region's signature page
  slots: SignatureSlot[];
}

// Role attestations are shared across regions — each region signs the same
// three commitments, drawn from the accord's PILOT/QUALIFY/EDUCATE sections.
const GOVERNMENT_ATTESTATION =
  "The undersigned public authority commits this region to host young learners across cultures, to protect every participant within a documented safety envelope, and to hold itself to a standard higher than current regulation requires — publicly and transparently, in view of every citizen it serves.";
const EDUCATION_ATTESTATION =
  "The undersigned educational authority commits this region to deliver every activity in the participant's own language, to honor the rotation of learners through all founding regions, and to publish curricula and outcomes under open license so that what one region learns, all regions inherit.";
const INNOVATION_ATTESTATION =
  "The undersigned innovation authority commits this region to equip participants with the tools of the future, to teach through simulation before any live practice, and to ensure every device is bound at the hardware layer to refuse weaponization.";

function proposedRegion(region: string): ProposedSignatory {
  return {
    region,
    preamble: `The founding region of ${region} enters The Atlantis Accords through three visionary offices — Government, Education, and Innovation. No single office binds the region alone; ratification requires all three signatures below.`,
    slots: [
      {
        role: "Government",
        representative: "Office of the Regional Government",
        attestation: GOVERNMENT_ATTESTATION,
        name: "Pending ratification",
        verified: false,
      },
      {
        role: "Education",
        representative: "Office of Education & Learning",
        attestation: EDUCATION_ATTESTATION,
        name: "Pending ratification",
        verified: false,
      },
      {
        role: "Innovation",
        representative: "Office of Innovation & Technology",
        attestation: INNOVATION_ATTESTATION,
        name: "Pending ratification",
        verified: false,
      },
    ],
  };
}

// English source. Region order matches the triangle flower positions:
// Austin (top) / Honduras (bottom-left) / Cambodia (bottom-right).
export const SIGNATORIES_EN: ProposedSignatory[] = [
  proposedRegion("Austin, Texas"),
  proposedRegion("Honduras"),
  proposedRegion("Cambodia"),
];

// Translations land here as approved; any missing language falls back to English.
export const SIGNATORY_TRANSLATIONS: Record<string, ProposedSignatory[]> = {
  en: SIGNATORIES_EN,
};

export function getSignatory(idx: number, langCode: string): ProposedSignatory {
  const list = SIGNATORY_TRANSLATIONS[langCode] ?? SIGNATORIES_EN;
  return list[idx] ?? SIGNATORIES_EN[idx];
}

// ─── Target Countries ──────────────────────────────────────────
// The three founding regions, each a page with a professional overview.
// Same triangle order/colors as the signatory flower. Translation-ready.
export interface TargetCountry {
  region: string;
  overview: string; // professional, simple overview
  language: string; // primary participant language
  rotationStage: string; // Opening / Integration / Completion
  contribution: string; // what this region uniquely offers
}

export const TARGET_COUNTRIES_EN: TargetCountry[] = [
  {
    region: "Austin, Texas",
    overview:
      "Austin anchors the accord in North America as its innovation and convening hub. Home to eXeL — the accord's organizing convener — the region contributes deep technical capacity, a mature builder ecosystem, and English-language mentorship. Austin hosts the completion stage of each rotation, where discovery is refined into shipped, verifiable work.",
    language: "English",
    rotationStage: "Completion",
    contribution:
      "Technology, verification, and delivery — where work is finished and proven.",
  },
  {
    region: "Honduras",
    overview:
      "Honduras is the integrating heart of the rotation, where learning from every region is reconciled and tested against real constraints. A Spanish-language cohort and a culture of community resilience give the accord its middle passage — the place where ideas are pressure-tested before completion.",
    language: "Spanish",
    rotationStage: "Integration",
    contribution:
      "Reconciliation and real-world testing — where ideas meet constraint.",
  },
  {
    region: "Cambodia",
    overview:
      "Cambodia opens each rotation, grounding the accord in one of humanity's oldest living traditions of learning. A Khmer-language cohort and a heritage of monastic dialectic and patient craft give participants their first, formative stage — where the right questions matter more than speed.",
    language: "Khmer",
    rotationStage: "Opening",
    contribution:
      "Foundational inquiry and patient craft — where every rotation begins.",
  },
];

export const TARGET_COUNTRY_TRANSLATIONS: Record<string, TargetCountry[]> = {
  en: TARGET_COUNTRIES_EN,
};

export function getTargetCountry(idx: number, langCode: string): TargetCountry {
  const list = TARGET_COUNTRY_TRANSLATIONS[langCode] ?? TARGET_COUNTRIES_EN;
  return list[idx] ?? TARGET_COUNTRIES_EN[idx];
}
