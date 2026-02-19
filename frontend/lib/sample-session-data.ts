/**
 * Seeded 5,000-response generator for Flower of Life theme visualization.
 * Uses a seeded PRNG + template sentence pools — not a giant JSON blob.
 */

import type {
  Theme01Label,
  ThemeInfo,
  ThemedResponse,
  SessionThemeData,
} from "./types";

// ── Seeded PRNG (mulberry32) ─────────────────────────────────────

function mulberry32(seed: number) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededPick<T>(arr: T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

function seededRange(min: number, max: number, rng: () => number): number {
  return min + rng() * (max - min);
}

// ── Theme Hierarchy ──────────────────────────────────────────────

interface ThemeHierarchy {
  theme2_3: string[];
  theme2_6: string[];
  theme2_9: string[];
  /** Maps each theme2_9 → its parent theme2_6 */
  map9to6: Record<string, string>;
  /** Maps each theme2_6 → its parent theme2_3 */
  map6to3: Record<string, string>;
}

const RISK_HIERARCHY: ThemeHierarchy = {
  theme2_3: ["Bias & Fairness", "Societal Impact", "Safety & Control"],
  theme2_6: [
    "Bias Amplification",
    "Stereotype Reinforcement",
    "Job Loss",
    "Ethical Dilemmas",
    "Surveillance Risks",
    "Weaponization Dangers",
  ],
  theme2_9: [
    "Bias Amplification",
    "Stereotype Reinforcement",
    "Job Loss",
    "Ethical Dilemmas",
    "Surveillance Risks",
    "Weaponization Dangers",
    "Opacity Issues",
    "Regulation Gaps",
    "Error Vulnerability",
  ],
  map9to6: {
    "Bias Amplification": "Bias Amplification",
    "Stereotype Reinforcement": "Stereotype Reinforcement",
    "Job Loss": "Job Loss",
    "Ethical Dilemmas": "Ethical Dilemmas",
    "Surveillance Risks": "Surveillance Risks",
    "Weaponization Dangers": "Weaponization Dangers",
    "Opacity Issues": "Surveillance Risks",
    "Regulation Gaps": "Ethical Dilemmas",
    "Error Vulnerability": "Weaponization Dangers",
  },
  map6to3: {
    "Bias Amplification": "Bias & Fairness",
    "Stereotype Reinforcement": "Bias & Fairness",
    "Job Loss": "Societal Impact",
    "Ethical Dilemmas": "Societal Impact",
    "Surveillance Risks": "Safety & Control",
    "Weaponization Dangers": "Safety & Control",
  },
};

const SUPPORTING_HIERARCHY: ThemeHierarchy = {
  theme2_3: ["Efficiency & Automation", "Health & Learning", "Innovation & Safety"],
  theme2_6: [
    "Efficiency Boost",
    "Manufacturing Precision",
    "Medical Advances",
    "Personalized Learning",
    "Financial Optimization",
    "Environmental Monitoring",
  ],
  theme2_9: [
    "Efficiency Boost",
    "Manufacturing Precision",
    "Medical Advances",
    "Personalized Learning",
    "Financial Optimization",
    "Environmental Monitoring",
    "Innovation Driver",
    "Transportation Safety",
    "E-commerce Personalization",
  ],
  map9to6: {
    "Efficiency Boost": "Efficiency Boost",
    "Manufacturing Precision": "Manufacturing Precision",
    "Medical Advances": "Medical Advances",
    "Personalized Learning": "Personalized Learning",
    "Financial Optimization": "Financial Optimization",
    "Environmental Monitoring": "Environmental Monitoring",
    "Innovation Driver": "Efficiency Boost",
    "Transportation Safety": "Environmental Monitoring",
    "E-commerce Personalization": "Financial Optimization",
  },
  map6to3: {
    "Efficiency Boost": "Efficiency & Automation",
    "Manufacturing Precision": "Efficiency & Automation",
    "Medical Advances": "Health & Learning",
    "Personalized Learning": "Health & Learning",
    "Financial Optimization": "Innovation & Safety",
    "Environmental Monitoring": "Innovation & Safety",
  },
};

const NEUTRAL_HIERARCHY: ThemeHierarchy = {
  theme2_3: ["Mixed Impact", "Evolving Standards", "Uncertain Outcomes"],
  theme2_6: [
    "Mixed Impact",
    "Dual-Use Concerns",
    "Evolving Standards",
    "Regulatory Balance",
    "Uncertain Outcomes",
    "Conditional Benefits",
  ],
  theme2_9: [
    "Mixed Impact",
    "Dual-Use Concerns",
    "Evolving Standards",
    "Regulatory Balance",
    "Uncertain Outcomes",
    "Conditional Benefits",
    "Cultural Adaptation",
    "Long-term Unknown",
    "Innovation vs Risk",
  ],
  map9to6: {
    "Mixed Impact": "Mixed Impact",
    "Dual-Use Concerns": "Dual-Use Concerns",
    "Evolving Standards": "Evolving Standards",
    "Regulatory Balance": "Regulatory Balance",
    "Uncertain Outcomes": "Uncertain Outcomes",
    "Conditional Benefits": "Conditional Benefits",
    "Cultural Adaptation": "Mixed Impact",
    "Long-term Unknown": "Uncertain Outcomes",
    "Innovation vs Risk": "Evolving Standards",
  },
  map6to3: {
    "Mixed Impact": "Mixed Impact",
    "Dual-Use Concerns": "Mixed Impact",
    "Evolving Standards": "Evolving Standards",
    "Regulatory Balance": "Evolving Standards",
    "Uncertain Outcomes": "Uncertain Outcomes",
    "Conditional Benefits": "Uncertain Outcomes",
  },
};

const HIERARCHY_MAP: Record<Theme01Label, ThemeHierarchy> = {
  "Risk & Concerns": RISK_HIERARCHY,
  "Supporting Comments": SUPPORTING_HIERARCHY,
  "Neutral Comments": NEUTRAL_HIERARCHY,
};

// ── Sentence template pools ──────────────────────────────────────

const RISK_TEMPLATES = [
  "AI systems risk amplifying existing biases in training data, disproportionately affecting marginalized communities in hiring, lending, and criminal justice decisions across multiple sectors.",
  "The rapid adoption of facial recognition surveillance technology raises profound concerns about privacy erosion and the potential for authoritarian abuse of automated monitoring systems worldwide.",
  "Autonomous weapons systems present unprecedented ethical dilemmas, as delegating lethal decisions to algorithms removes critical human judgment from life-and-death battlefield situations.",
  "Job displacement from automation threatens millions of workers in manufacturing, retail, and transportation sectors, potentially widening economic inequality without adequate retraining programs available.",
  "The opacity of neural network decision-making processes makes it nearly impossible to audit algorithmic outputs, undermining accountability in healthcare diagnosis and financial risk assessment.",
  "Deepfake technology enables sophisticated disinformation campaigns that erode public trust in media, threatening democratic processes and creating unprecedented challenges for information verification systems.",
  "Predictive policing algorithms perpetuate historical patterns of racial profiling, concentrating enforcement resources in already over-policed communities while ignoring systemic root causes of crime.",
  "The concentration of AI development among a few large corporations creates dangerous power asymmetries, limiting public oversight and democratic governance of transformative technology deployment decisions.",
  "Current AI regulation lags significantly behind the pace of technological innovation, leaving critical gaps in consumer protection, data privacy enforcement, and algorithmic transparency requirements globally.",
  "Machine learning systems trained on internet-scale data absorb and reproduce harmful stereotypes about gender, race, and ethnicity, normalizing discriminatory patterns in automated decision-making processes.",
  "The environmental cost of training large language models is substantial, consuming massive amounts of energy and contributing to carbon emissions that counteract climate change mitigation efforts.",
  "AI-powered social media recommendation algorithms optimize for engagement at the expense of user wellbeing, contributing to polarization, mental health decline, and information bubble effects globally.",
];

const SUPPORTING_TEMPLATES = [
  "AI-powered diagnostic tools demonstrate remarkable accuracy in detecting early-stage cancers from medical imaging, potentially saving millions of lives through earlier intervention and more personalized treatment plans.",
  "Intelligent automation systems increase manufacturing precision by orders of magnitude, reducing defect rates and enabling consistent quality control that surpasses human capability in repetitive inspection tasks.",
  "Personalized learning platforms adapt educational content to individual student needs, improving retention rates and enabling self-paced mastery that traditional classroom settings cannot efficiently provide at scale.",
  "AI-driven climate monitoring systems analyze satellite imagery and sensor networks in real-time, enabling faster response to environmental changes and more accurate predictions of natural disaster events.",
  "Algorithmic financial optimization reduces transaction costs and improves portfolio performance, democratizing access to sophisticated investment strategies previously available only to institutional investors with large budgets.",
  "Smart transportation networks leverage AI traffic optimization to reduce commute times, lower fuel consumption, and decrease accident rates through predictive routing and automated vehicle coordination systems.",
  "Natural language processing breakthroughs enable real-time translation services that bridge communication barriers, facilitating international collaboration and making information accessible across language boundaries efficiently.",
  "AI-assisted drug discovery accelerates the identification of promising therapeutic compounds, dramatically reducing the time and cost required to bring life-saving medications from laboratory research to patient access.",
  "Precision agriculture systems use machine learning to optimize irrigation, fertilization, and pest management, increasing crop yields while reducing environmental impact and resource consumption across farming operations.",
  "Robotic process automation frees knowledge workers from repetitive administrative tasks, allowing them to focus on creative problem-solving and strategic decision-making that generates greater organizational value.",
  "AI-powered accessibility tools transform the lives of people with disabilities, from real-time audio descriptions to intelligent prosthetics that restore mobility and independence through adaptive control systems.",
  "Predictive maintenance algorithms analyze equipment sensor data to prevent costly breakdowns, extending machinery lifespan and reducing unplanned downtime in critical infrastructure and industrial manufacturing operations.",
];

const NEUTRAL_TEMPLATES = [
  "The impact of AI on employment remains uncertain, as historical patterns suggest technology creates new roles while eliminating others, but the pace and scale of current disruption may differ significantly.",
  "AI governance frameworks need to balance innovation incentives with safety requirements, a challenge that requires ongoing collaboration between technologists, policymakers, and civil society organizations across jurisdictions.",
  "While AI demonstrates impressive capabilities in narrow domains, the timeline for achieving human-level general intelligence remains deeply contested among researchers, with estimates ranging from decades to never.",
  "Cross-cultural deployment of AI systems reveals significant variation in acceptance and ethical norms, suggesting that universal governance standards must accommodate diverse values and regulatory traditions worldwide.",
  "The dual-use nature of AI research means that advances in beneficial applications simultaneously enable potentially harmful uses, creating complex tradeoffs for researchers and institutions making funding decisions.",
  "Current AI benchmarks may not adequately capture real-world performance, as systems that excel in controlled testing environments frequently fail when confronted with edge cases and distribution shifts in practice.",
  "The long-term societal effects of widespread AI adoption are fundamentally unpredictable, as emergent behaviors and second-order consequences often only become apparent years after initial technology deployment begins.",
  "AI-generated creative works raise unresolved questions about authorship, intellectual property, and the nature of creativity itself, challenging existing legal frameworks and cultural norms around artistic production.",
  "The relationship between AI development and national competitiveness creates pressure for rapid deployment, potentially at the expense of thorough safety testing and responsible innovation practices across governments.",
  "Some AI applications deliver clear net benefits in specific contexts while creating negative externalities elsewhere, making holistic impact assessment essential before scaling deployment across different populations and environments.",
  "Public understanding of AI capabilities and limitations remains low, creating both unrealistic expectations and unfounded fears that complicate evidence-based policy discussions about appropriate regulation and oversight mechanisms.",
  "The conditional benefits of AI depend heavily on implementation quality, organizational readiness, and the social context of deployment, meaning identical systems can produce vastly different outcomes across settings.",
];

const TEMPLATES: Record<Theme01Label, string[]> = {
  "Risk & Concerns": RISK_TEMPLATES,
  "Supporting Comments": SUPPORTING_TEMPLATES,
  "Neutral Comments": NEUTRAL_TEMPLATES,
};

// ── Summary generators ───────────────────────────────────────────

function truncateToWords(text: string, wordCount: number): string {
  const words = text.split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "...";
}

// ── Main generator ───────────────────────────────────────────────

const DISTRIBUTION: { label: Theme01Label; count: number }[] = [
  { label: "Risk & Concerns", count: 2500 },
  { label: "Supporting Comments", count: 1750 },
  { label: "Neutral Comments", count: 750 },
];

let cachedData: SessionThemeData | null = null;

export function generateSampleSessionData(
  sessionId = "sample-5k-session"
): SessionThemeData {
  if (cachedData && cachedData.sessionId === sessionId) return cachedData;

  const rng = mulberry32(42);
  const responses: ThemedResponse[] = [];

  for (const { label, count } of DISTRIBUTION) {
    const hierarchy = HIERARCHY_MAP[label];
    const templates = TEMPLATES[label];

    for (let i = 0; i < count; i++) {
      const theme2_9 = seededPick(hierarchy.theme2_9, rng);
      const theme2_6 = hierarchy.map9to6[theme2_9];
      const theme2_3 = hierarchy.map6to3[theme2_6];
      const rawText = seededPick(templates, rng);
      const confidence = Math.round(seededRange(65, 98, rng));
      const theme1Confidence = Math.round(seededRange(70, 99, rng));

      responses.push({
        id: `resp-${responses.length.toString().padStart(5, "0")}`,
        userHash: `user-${Math.floor(seededRange(1000, 9999, rng))}`,
        rawText,
        summary33: truncateToWords(rawText, 33),
        summary111: truncateToWords(rawText, 111),
        summary333: rawText,
        theme1: label,
        theme1Confidence,
        theme2_9,
        theme2_6,
        theme2_3,
        theme2Confidence: confidence,
      });
    }
  }

  // Build ThemeInfo aggregates
  const theme1Info = {} as Record<Theme01Label, ThemeInfo>;
  const theme2Info = {} as Record<
    Theme01Label,
    { level3: ThemeInfo[]; level6: ThemeInfo[]; level9: ThemeInfo[] }
  >;

  for (const { label } of DISTRIBUTION) {
    const group = responses.filter((r) => r.theme1 === label);
    const avgConf =
      group.reduce((s, r) => s + r.theme1Confidence, 0) / group.length;

    theme1Info[label] = {
      label,
      count: group.length,
      avgConfidence: Math.round(avgConf),
      summary33: `Aggregate view of ${group.length} responses classified under ${label} with ${Math.round(avgConf)}% average confidence across all sub-themes in the session.`,
    };

    const hierarchy = HIERARCHY_MAP[label];
    const buildLevel = (themes: string[], key: keyof ThemedResponse) =>
      themes.map((t) => {
        const matching = group.filter((r) => r[key] === t);
        const avg =
          matching.length > 0
            ? matching.reduce((s, r) => s + r.theme2Confidence, 0) /
              matching.length
            : 0;
        return {
          label: t,
          count: matching.length,
          avgConfidence: Math.round(avg),
          summary33: `${matching.length} responses about ${t.toLowerCase()} with ${Math.round(avg)}% average confidence in this sub-theme classification.`,
        };
      });

    theme2Info[label] = {
      level3: buildLevel(hierarchy.theme2_3, "theme2_3"),
      level6: buildLevel(hierarchy.theme2_6, "theme2_6"),
      level9: buildLevel(hierarchy.theme2_9, "theme2_9"),
    };
  }

  cachedData = {
    sessionId,
    totalResponses: responses.length,
    theme1: theme1Info,
    theme2: theme2Info,
    responses,
  };

  return cachedData;
}
