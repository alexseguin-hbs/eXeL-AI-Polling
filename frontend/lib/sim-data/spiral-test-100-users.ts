/**
 * Spiral Test — 100 User Responses across 12 MoT (Master of Thought) Agent Waves.
 *
 * Validates cross-device response sharing via Cloudflare Pages Functions + Cache API
 * at scale, and stress-tests the mock data + live feed pipeline.
 *
 * Target session: "Collaborative Thoughts on AI Governance" (session c3d4e5f6-a7b8-9012-cdef-333333333333)
 * but can be aimed at any polling session.
 *
 * Language distribution: 60 EN, 10 ES, 8 DE, 5 FR, 4 PT, 3 JA, 3 ZH, 2 KO, 2 AR, 2 HI, 1 IT
 */

export interface SpiralTestResponse {
  agent_wave: number;
  agent_name: string;
  user_index: number;
  participant_id: string;
  text: string;
  language_code: string;
  delay_ms: number;
}

export interface SpiralTestWave {
  wave: number;
  agent_name: string;
  user_count: number;
  delay_start_ms: number;
  theme_focus: string;
  responses: SpiralTestResponse[];
}

// ── Wave 1: Catalyst (12 users, 0s start) — Mixed diversity ────────
const WAVE_1: SpiralTestResponse[] = [
  { agent_wave: 1, agent_name: "Catalyst", user_index: 1, participant_id: "spiral-w1-u01", text: "AI governance must start with transparency. Every algorithmic decision affecting citizens should have a clear audit trail that non-technical stakeholders can understand and challenge.", language_code: "en", delay_ms: 0 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 2, participant_id: "spiral-w1-u02", text: "La gobernanza de la IA debería priorizar la inclusión digital. Millones de personas en comunidades rurales no tienen acceso a las herramientas necesarias para participar en sistemas de decisión automatizados.", language_code: "es", delay_ms: 400 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 3, participant_id: "spiral-w1-u03", text: "We need federated learning approaches for governance AI so personal data never leaves local jurisdictions while still enabling collective intelligence at scale.", language_code: "en", delay_ms: 800 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 4, participant_id: "spiral-w1-u04", text: "KI-gestützte Governance könnte die Bürgerbeteiligung revolutionieren, aber wir müssen sicherstellen, dass die Algorithmen nicht die bestehenden Machtstrukturen verstärken.", language_code: "de", delay_ms: 1200 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 5, participant_id: "spiral-w1-u05", text: "The biggest risk of AI in governance is not bias — it is the illusion of objectivity. People trust algorithms more than they should, and bad actors exploit this.", language_code: "en", delay_ms: 1600 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 6, participant_id: "spiral-w1-u06", text: "L'intelligence artificielle dans la gouvernance nécessite un cadre éthique international. Chaque nation ne peut pas avoir ses propres règles contradictoires.", language_code: "fr", delay_ms: 2000 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 7, participant_id: "spiral-w1-u07", text: "Real-time polling with AI summarization could replace traditional town halls. Imagine processing 100,000 citizen opinions in 60 seconds and surfacing the key themes.", language_code: "en", delay_ms: 2400 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 8, participant_id: "spiral-w1-u08", text: "A governança por IA precisa de mecanismos de recurso humano. Nenhuma decisão automatizada que afete direitos fundamentais deve ser irrecorrível.", language_code: "pt", delay_ms: 2800 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 9, participant_id: "spiral-w1-u09", text: "Quadratic voting combined with AI theme clustering is the most promising framework I have seen for preventing tyranny of the majority in digital governance.", language_code: "en", delay_ms: 3200 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 10, participant_id: "spiral-w1-u10", text: "AIガバナンスにおいて最も重要なのは、市民がアルゴリズムの決定を理解し、異議を唱える権利を持つことです。透明性なくして信頼なし。", language_code: "ja", delay_ms: 3600 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 11, participant_id: "spiral-w1-u11", text: "I worry about governance AI being captured by whoever controls the training data. We need open datasets and reproducible pipelines for any system making civic decisions.", language_code: "en", delay_ms: 4000 },
  { agent_wave: 1, agent_name: "Catalyst", user_index: 12, participant_id: "spiral-w1-u12", text: "AI governance should be iterative. Start with advisory roles — AI suggests, humans decide. Only after years of trust-building should we consider any autonomous decisions.", language_code: "en", delay_ms: 4400 },
];

// ── Wave 2: Sentinel (10 users, 3s start) — Risk & security ────────
const WAVE_2: SpiralTestResponse[] = [
  { agent_wave: 2, agent_name: "Sentinel", user_index: 13, participant_id: "spiral-w2-u13", text: "The cybersecurity implications of AI governance are terrifying. A single vulnerability in a decision-making algorithm could be exploited to manipulate outcomes for millions.", language_code: "en", delay_ms: 3000 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 14, participant_id: "spiral-w2-u14", text: "Los ataques adversariales contra modelos de IA son una amenaza real para la gobernanza. Pequeñas perturbaciones en los datos pueden cambiar completamente las decisiones del sistema.", language_code: "es", delay_ms: 3500 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 15, participant_id: "spiral-w2-u15", text: "Deepfake voices and synthetic text could flood governance platforms with fake citizen input. Without robust identity verification, AI governance is a sham.", language_code: "en", delay_ms: 4000 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 16, participant_id: "spiral-w2-u16", text: "Datenschutz muss bei KI-Governance an erster Stelle stehen. Die Verarbeitung von Bürgerdaten für Governance-Entscheidungen darf niemals ohne informierte Einwilligung erfolgen.", language_code: "de", delay_ms: 4500 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 17, participant_id: "spiral-w2-u17", text: "Single points of failure in AI governance infrastructure could paralyze entire cities. We need redundancy, circuit breakers, and graceful degradation at every layer.", language_code: "en", delay_ms: 5000 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 18, participant_id: "spiral-w2-u18", text: "人工智能治理系统中的偏见问题不仅仅是技术问题，更是社会正义问题。如果训练数据反映了历史不平等，AI将继续加剧这些不平等。", language_code: "zh", delay_ms: 5500 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 19, participant_id: "spiral-w2-u19", text: "AI governance systems must be air-gapped from social media manipulation. The same bots that spread misinformation will try to game governance platforms.", language_code: "en", delay_ms: 6000 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 20, participant_id: "spiral-w2-u20", text: "Le risque de surveillance de masse sous couvert de gouvernance IA est réel. Les citoyens doivent pouvoir participer anonymement pour éviter l'autocensure.", language_code: "fr", delay_ms: 6500 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 21, participant_id: "spiral-w2-u21", text: "Nation-state actors could target AI governance platforms to destabilize democracies. Election interference will look primitive compared to governance AI manipulation.", language_code: "en", delay_ms: 7000 },
  { agent_wave: 2, agent_name: "Sentinel", user_index: 22, participant_id: "spiral-w2-u22", text: "Without kill switches and human override capabilities, AI governance is a ticking time bomb. Every automated system needs an emergency manual fallback.", language_code: "en", delay_ms: 7500 },
];

// ── Wave 3: Nexus (10 users, 7s start) — Integration & collaboration ──
const WAVE_3: SpiralTestResponse[] = [
  { agent_wave: 3, agent_name: "Nexus", user_index: 23, participant_id: "spiral-w3-u23", text: "AI governance platforms should integrate with existing civic infrastructure — land registries, zoning boards, municipal budgets — to provide context-rich decision support.", language_code: "en", delay_ms: 7000 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 24, participant_id: "spiral-w3-u24", text: "La integración entre plataformas de gobernanza IA y sistemas educativos podría crear ciudadanos más informados que participen activamente en las decisiones colectivas.", language_code: "es", delay_ms: 7500 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 25, participant_id: "spiral-w3-u25", text: "Cross-border AI governance requires interoperability standards. The EU, US, and Asia must agree on data formats, API specs, and governance protocol compatibility.", language_code: "en", delay_ms: 8000 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 26, participant_id: "spiral-w3-u26", text: "Die Integration von KI-Governance mit bestehenden parlamentarischen Systemen ist entscheidend. Wir brauchen keine Revolution, sondern eine Evolution der demokratischen Prozesse.", language_code: "de", delay_ms: 8500 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 27, participant_id: "spiral-w3-u27", text: "Open APIs for governance platforms would enable a rich ecosystem of civic tech tools. Let a thousand flowers bloom instead of one monolithic system.", language_code: "en", delay_ms: 9000 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 28, participant_id: "spiral-w3-u28", text: "A integração de IA com assembleias cidadãs existentes poderia amplificar vozes que atualmente são ignoradas nos processos de tomada de decisão tradicionais.", language_code: "pt", delay_ms: 9500 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 29, participant_id: "spiral-w3-u29", text: "AI governance should federate across municipal, state, and national levels. Local issues stay local, but patterns and best practices propagate automatically.", language_code: "en", delay_ms: 10000 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 30, participant_id: "spiral-w3-u30", text: "AI 거버넌스 플랫폼은 기존 시민 참여 도구와 통합되어야 합니다. 별도의 시스템은 채택을 방해하고 참여 장벽을 높입니다.", language_code: "ko", delay_ms: 10500 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 31, participant_id: "spiral-w3-u31", text: "SDK-first governance platforms let companies embed civic decision-making into their own products. This embeddable model scales faster than standalone apps.", language_code: "en", delay_ms: 11000 },
  { agent_wave: 3, agent_name: "Nexus", user_index: 32, participant_id: "spiral-w3-u32", text: "Multilingual AI governance is non-negotiable. A system that only works in English excludes 85% of the world population from meaningful participation.", language_code: "en", delay_ms: 11500 },
];

// ── Wave 4: Oracle (9 users, 11s start) — Future predictions ────────
const WAVE_4: SpiralTestResponse[] = [
  { agent_wave: 4, agent_name: "Oracle", user_index: 33, participant_id: "spiral-w4-u33", text: "By 2030, AI governance platforms will process more citizen input in a single day than traditional democratic systems handle in an entire election cycle.", language_code: "en", delay_ms: 11000 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 34, participant_id: "spiral-w4-u34", text: "En cinco años, la IA permitirá a los ciudadanos participar en microdecisiones diarias sobre su comunidad, desde el transporte público hasta la asignación de recursos.", language_code: "es", delay_ms: 11700 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 35, participant_id: "spiral-w4-u35", text: "The next generation of AI governance will use simulation — testing policy changes on digital twins of cities before implementing them in the real world.", language_code: "en", delay_ms: 12400 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 36, participant_id: "spiral-w4-u36", text: "In der Zukunft werden KI-Systeme nicht nur Bürgermeinungen sammeln, sondern auch die Auswirkungen von Entscheidungen in Echtzeit modellieren und vorhersagen.", language_code: "de", delay_ms: 13100 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 37, participant_id: "spiral-w4-u37", text: "Predictive governance will use AI to identify emerging crises before they escalate. Climate events, supply chain disruptions, and social tensions could be anticipated.", language_code: "en", delay_ms: 13800 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 38, participant_id: "spiral-w4-u38", text: "2030年までに、AIガバナンスは予測的なものになるでしょう。市民の不満を事前に検知し、問題が危機に発展する前に対処する仕組みが必要です。", language_code: "ja", delay_ms: 14500 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 39, participant_id: "spiral-w4-u39", text: "Future AI governance will enable continuous constitutional evolution. Instead of rigid amendments, living documents will adapt based on ongoing citizen consensus.", language_code: "en", delay_ms: 15200 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 40, participant_id: "spiral-w4-u40", text: "La gouvernance IA du futur sera personnalisée. Chaque citoyen recevra des résumés adaptés à son niveau de compréhension et ses centres d'intérêt.", language_code: "fr", delay_ms: 15900 },
  { agent_wave: 4, agent_name: "Oracle", user_index: 41, participant_id: "spiral-w4-u41", text: "Within a decade, AI-mediated governance could replace committee-based decision-making entirely. Thousands of voices synthesized in seconds versus months of meetings.", language_code: "en", delay_ms: 16600 },
];

// ── Wave 5: Forge (9 users, 16s start) — Building & implementation ──
const WAVE_5: SpiralTestResponse[] = [
  { agent_wave: 5, agent_name: "Forge", user_index: 42, participant_id: "spiral-w5-u42", text: "We should start building AI governance with local school boards. Low stakes, clear outcomes, and it trains both the AI and the community before scaling.", language_code: "en", delay_ms: 16000 },
  { agent_wave: 5, agent_name: "Forge", user_index: 43, participant_id: "spiral-w5-u43", text: "La implementación de gobernanza IA debe seguir un enfoque de microservicios. Cada componente — recolección, análisis, votación — debe ser independiente y reemplazable.", language_code: "es", delay_ms: 16700 },
  { agent_wave: 5, agent_name: "Forge", user_index: 44, participant_id: "spiral-w5-u44", text: "Horizontal scaling is critical for governance platforms. A system that works for 100 users but crashes at 10,000 is worse than no system at all.", language_code: "en", delay_ms: 17400 },
  { agent_wave: 5, agent_name: "Forge", user_index: 45, participant_id: "spiral-w5-u45", text: "Die technische Implementierung von KI-Governance erfordert event-driven Architekturen. Jede Bürgeraktion löst eine Kette von Verarbeitungsschritten aus.", language_code: "de", delay_ms: 18100 },
  { agent_wave: 5, agent_name: "Forge", user_index: 46, participant_id: "spiral-w5-u46", text: "Deterministic clustering is essential for governance legitimacy. If the same inputs produce different themes each time, no one will trust the system.", language_code: "en", delay_ms: 18800 },
  { agent_wave: 5, agent_name: "Forge", user_index: 47, participant_id: "spiral-w5-u47", text: "A implementação deve usar embeddings em lote para processar milhares de respostas simultaneamente, não chamadas API individuais que não escalam.", language_code: "pt", delay_ms: 19500 },
  { agent_wave: 5, agent_name: "Forge", user_index: 48, participant_id: "spiral-w5-u48", text: "Mobile-first design for governance is non-negotiable. In developing nations, most citizens access the internet exclusively through smartphones.", language_code: "en", delay_ms: 20200 },
  { agent_wave: 5, agent_name: "Forge", user_index: 49, participant_id: "spiral-w5-u49", text: "人工智能治理平台的核心应该是可复现性。相同的输入数据必须产生相同的主题分类结果，否则系统将失去公信力。", language_code: "zh", delay_ms: 20900 },
  { agent_wave: 5, agent_name: "Forge", user_index: 50, participant_id: "spiral-w5-u50", text: "Circuit breaker patterns for AI provider failover ensure governance platforms stay operational even when OpenAI or Google Cloud has an outage.", language_code: "en", delay_ms: 21600 },
];

// ── Wave 6: Compass (8 users, 21s start) — Direction & strategy ─────
const WAVE_6: SpiralTestResponse[] = [
  { agent_wave: 6, agent_name: "Compass", user_index: 51, participant_id: "spiral-w6-u51", text: "The strategic priority for AI governance should be trust-building. Technology is ready; public confidence is the bottleneck. Start with transparency reports.", language_code: "en", delay_ms: 21000 },
  { agent_wave: 6, agent_name: "Compass", user_index: 52, participant_id: "spiral-w6-u52", text: "La estrategia debe centrarse en la adopción gradual. Primero encuestas consultivas, luego votaciones vinculantes, y finalmente presupuestos participativos gestionados por IA.", language_code: "es", delay_ms: 21800 },
  { agent_wave: 6, agent_name: "Compass", user_index: 53, participant_id: "spiral-w6-u53", text: "Africa leapfrogged landlines to mobile. AI governance could let developing nations leapfrog bureaucratic institutions to direct digital democracy.", language_code: "en", delay_ms: 22600 },
  { agent_wave: 6, agent_name: "Compass", user_index: 54, participant_id: "spiral-w6-u54", text: "कृत्रिम बुद्धिमत्ता शासन की सबसे बड़ी चुनौती डिजिटल साक्षरता है। तकनीक बनाना आसान है, लेकिन करोड़ों लोगों को इसका उपयोग सिखाना कठिन है।", language_code: "hi", delay_ms: 23400 },
  { agent_wave: 6, agent_name: "Compass", user_index: 55, participant_id: "spiral-w6-u55", text: "Governance AI must be provider-agnostic. Locking into one AI vendor creates dependency and single points of failure that no democratic system should tolerate.", language_code: "en", delay_ms: 24200 },
  { agent_wave: 6, agent_name: "Compass", user_index: 56, participant_id: "spiral-w6-u56", text: "Die strategische Richtung sollte Open Source sein. Proprietäre KI-Governance-Systeme widersprechen dem Grundprinzip demokratischer Transparenz.", language_code: "de", delay_ms: 25000 },
  { agent_wave: 6, agent_name: "Compass", user_index: 57, participant_id: "spiral-w6-u57", text: "Focus on the governance compression problem: how to distill 1 million opinions into 9 actionable themes without losing minority perspectives.", language_code: "en", delay_ms: 25800 },
  { agent_wave: 6, agent_name: "Compass", user_index: 58, participant_id: "spiral-w6-u58", text: "Il futuro della governance AI risiede nell'equilibrio tra efficienza algoritmica e saggezza umana. La tecnologia deve amplificare, non sostituire, il giudizio umano.", language_code: "it", delay_ms: 26600 },
];

// ── Wave 7: Prism (8 users, 26s start) — Multi-perspective analysis ──
const WAVE_7: SpiralTestResponse[] = [
  { agent_wave: 7, agent_name: "Prism", user_index: 59, participant_id: "spiral-w7-u59", text: "From a legal perspective, AI governance raises fundamental questions about due process. Can an algorithm satisfy the requirements of fair hearing?", language_code: "en", delay_ms: 26000 },
  { agent_wave: 7, agent_name: "Prism", user_index: 60, participant_id: "spiral-w7-u60", text: "Los economistas ven la gobernanza IA como un mecanismo de reducción de costos transaccionales. Los sociólogos la ven como una herramienta de redistribución del poder.", language_code: "es", delay_ms: 26800 },
  { agent_wave: 7, agent_name: "Prism", user_index: 61, participant_id: "spiral-w7-u61", text: "From a psychological lens, the framing of AI governance questions matters enormously. The same issue posed differently yields radically different citizen responses.", language_code: "en", delay_ms: 27600 },
  { agent_wave: 7, agent_name: "Prism", user_index: 62, participant_id: "spiral-w7-u62", text: "La perspective culturelle est souvent ignorée. Ce qui fonctionne dans une démocratie occidentale peut échouer dans des sociétés avec des structures de gouvernance traditionnelles.", language_code: "fr", delay_ms: 28400 },
  { agent_wave: 7, agent_name: "Prism", user_index: 63, participant_id: "spiral-w7-u63", text: "Environmental scientists could use AI governance to process millions of climate opinions, creating a global consensus mechanism for the most urgent issue of our time.", language_code: "en", delay_ms: 29200 },
  { agent_wave: 7, agent_name: "Prism", user_index: 64, participant_id: "spiral-w7-u64", text: "異なる文化圏でのAIガバナンスは、それぞれの社会的文脈に適応する必要があります。一つのモデルをすべての国に押し付けることはできません。", language_code: "ja", delay_ms: 30000 },
  { agent_wave: 7, agent_name: "Prism", user_index: 65, participant_id: "spiral-w7-u65", text: "Anthropologists remind us that governance has always evolved with technology. Writing enabled law codes, printing enabled constitutions, AI will enable something new.", language_code: "en", delay_ms: 30800 },
  { agent_wave: 7, agent_name: "Prism", user_index: 66, participant_id: "spiral-w7-u66", text: "Aus philosophischer Sicht wirft KI-Governance die Frage auf: Kann ein System, das Muster in der Vergangenheit erkennt, uns wirklich in eine bessere Zukunft führen?", language_code: "de", delay_ms: 31600 },
];

// ── Wave 8: Echo (8 users, 31s start) — Reinforcing key themes ──────
const WAVE_8: SpiralTestResponse[] = [
  { agent_wave: 8, agent_name: "Echo", user_index: 67, participant_id: "spiral-w8-u67", text: "I want to emphasize the transparency point raised earlier. Without explainable AI decisions, governance becomes a black box that erodes democratic legitimacy.", language_code: "en", delay_ms: 31000 },
  { agent_wave: 8, agent_name: "Echo", user_index: 68, participant_id: "spiral-w8-u68", text: "Estoy de acuerdo con los puntos sobre sesgo algorítmico. Debemos auditar continuamente los sistemas de IA para detectar discriminación sistémica contra comunidades marginadas.", language_code: "es", delay_ms: 31800 },
  { agent_wave: 8, agent_name: "Echo", user_index: 69, participant_id: "spiral-w8-u69", text: "The earlier point about mobile-first design resonates strongly. Governance platforms that exclude mobile users are governance platforms that exclude the majority.", language_code: "en", delay_ms: 32600 },
  { agent_wave: 8, agent_name: "Echo", user_index: 70, participant_id: "spiral-w8-u70", text: "A governança IA deve ser construída sobre código aberto, como mencionado antes. A transparência algorítmica é impossível com sistemas proprietários fechados.", language_code: "pt", delay_ms: 33400 },
  { agent_wave: 8, agent_name: "Echo", user_index: 71, participant_id: "spiral-w8-u71", text: "Building on the simulation concept — digital twins of governance decisions would let citizens see projected outcomes before committing to policies.", language_code: "en", delay_ms: 34200 },
  { agent_wave: 8, agent_name: "Echo", user_index: 72, participant_id: "spiral-w8-u72", text: "AI 거버넌스에서 다국어 지원의 중요성을 다시 강조합니다. 언어 장벽은 디지털 민주주의에서 가장 큰 참여 장벽 중 하나입니다.", language_code: "ko", delay_ms: 35000 },
  { agent_wave: 8, agent_name: "Echo", user_index: 73, participant_id: "spiral-w8-u73", text: "The security concerns mentioned by others are valid. We need end-to-end encryption for citizen inputs and zero-knowledge proofs for vote verification.", language_code: "en", delay_ms: 35800 },
  { agent_wave: 8, agent_name: "Echo", user_index: 74, participant_id: "spiral-w8-u74", text: "Les préoccupations concernant la vie privée sont fondamentales. Le RGPD devrait être le minimum, pas le maximum, pour les systèmes de gouvernance IA.", language_code: "fr", delay_ms: 36600 },
];

// ── Wave 9: Vanguard (7 users, 37s start) — Cutting-edge ideas ─────
const WAVE_9: SpiralTestResponse[] = [
  { agent_wave: 9, agent_name: "Vanguard", user_index: 75, participant_id: "spiral-w9-u75", text: "Liquid democracy powered by AI could let citizens delegate their votes on specific issues to trusted experts, with real-time revocation capabilities.", language_code: "en", delay_ms: 37000 },
  { agent_wave: 9, agent_name: "Vanguard", user_index: 76, participant_id: "spiral-w9-u76", text: "Las organizaciones autónomas descentralizadas combinadas con IA podrían crear nuevas formas de gobernanza que no dependen de instituciones centralizadas.", language_code: "es", delay_ms: 38000 },
  { agent_wave: 9, agent_name: "Vanguard", user_index: 77, participant_id: "spiral-w9-u77", text: "Swarm intelligence models applied to governance could yield emergent consensus without any individual needing to understand the full complexity of an issue.", language_code: "en", delay_ms: 39000 },
  { agent_wave: 9, agent_name: "Vanguard", user_index: 78, participant_id: "spiral-w9-u78", text: "Ich stelle mir vor, dass KI-Governance mit Brain-Computer-Interfaces die nächste Grenze sein wird. Gedanken direkt in Governance-Systeme einspeisen.", language_code: "de", delay_ms: 40000 },
  { agent_wave: 9, agent_name: "Vanguard", user_index: 79, participant_id: "spiral-w9-u79", text: "Governance NFTs could represent verified participation, creating an immutable record of civic engagement that builds trust and reputation over time.", language_code: "en", delay_ms: 41000 },
  { agent_wave: 9, agent_name: "Vanguard", user_index: 80, participant_id: "spiral-w9-u80", text: "حكومة الذكاء الاصطناعي يمكن أن تمكّن المواطنين من المشاركة في القرارات المحلية عبر الهاتف المحمول في الوقت الفعلي، مما يجعل الديمقراطية المباشرة ممكنة.", language_code: "ar", delay_ms: 42000 },
  { agent_wave: 9, agent_name: "Vanguard", user_index: 81, participant_id: "spiral-w9-u81", text: "Multi-agent AI systems where different models debate policy options could surface nuances that single-model systems miss entirely.", language_code: "en", delay_ms: 43000 },
];

// ── Wave 10: Harmony (7 users, 43s start) — Consensus building ──────
const WAVE_10: SpiralTestResponse[] = [
  { agent_wave: 10, agent_name: "Harmony", user_index: 82, participant_id: "spiral-w10-u82", text: "AI governance works best when it synthesizes opposing viewpoints into shared ground rather than amplifying divisions. Finding common themes across disagreement is the key.", language_code: "en", delay_ms: 43000 },
  { agent_wave: 10, agent_name: "Harmony", user_index: 83, participant_id: "spiral-w10-u83", text: "El consenso no significa unanimidad. La gobernanza IA debe encontrar las áreas de mayor acuerdo mientras respeta y documenta las voces disidentes.", language_code: "es", delay_ms: 44000 },
  { agent_wave: 10, agent_name: "Harmony", user_index: 84, participant_id: "spiral-w10-u84", text: "Bridging algorithms that identify unexpected consensus between traditionally opposing groups could heal political polarization through shared governance priorities.", language_code: "en", delay_ms: 45000 },
  { agent_wave: 10, agent_name: "Harmony", user_index: 85, participant_id: "spiral-w10-u85", text: "AI治理中的共识建设不应该是简单的多数决定，而应该寻找能够满足各方核心关切的解决方案。", language_code: "zh", delay_ms: 46000 },
  { agent_wave: 10, agent_name: "Harmony", user_index: 86, participant_id: "spiral-w10-u86", text: "Le meilleur système de gouvernance IA sera celui qui transforme les conflits en opportunités de dialogue et trouve des solutions que personne n'avait imaginées seul.", language_code: "fr", delay_ms: 47000 },
  { agent_wave: 10, agent_name: "Harmony", user_index: 87, participant_id: "spiral-w10-u87", text: "AI governance should weight consensus-building contributions more heavily. Users who bridge divides create more value than those who simply amplify majority views.", language_code: "en", delay_ms: 48000 },
  { agent_wave: 10, agent_name: "Harmony", user_index: 88, participant_id: "spiral-w10-u88", text: "एआई गवर्नेंस में सबसे महत्वपूर्ण बात यह है कि सभी समुदायों की आवाज सुनी जाए, विशेषकर उन समुदायों की जो ऐतिहासिक रूप से हाशिए पर रहे हैं।", language_code: "hi", delay_ms: 49000 },
];

// ── Wave 11: Cipher (6 users, 49s start) — Data & analytics ─────────
const WAVE_11: SpiralTestResponse[] = [
  { agent_wave: 11, agent_name: "Cipher", user_index: 89, participant_id: "spiral-w11-u89", text: "Governance analytics dashboards should show real-time sentiment drift across demographics. Not just what people think, but how opinions are evolving over time.", language_code: "en", delay_ms: 49000 },
  { agent_wave: 11, agent_name: "Cipher", user_index: 90, participant_id: "spiral-w11-u90", text: "O uso de embeddings semânticos para agrupar respostas de cidadãos é mais eficaz do que métodos tradicionais de análise de texto para descobrir temas ocultos.", language_code: "pt", delay_ms: 50200 },
  { agent_wave: 11, agent_name: "Cipher", user_index: 91, participant_id: "spiral-w11-u91", text: "Cosine similarity for cluster stability scoring gives us a mathematical measure of how robust governance themes are. This is crucial for reproducibility.", language_code: "en", delay_ms: 51400 },
  { agent_wave: 11, agent_name: "Cipher", user_index: 92, participant_id: "spiral-w11-u92", text: "Die Analyse von Governance-Daten sollte Drift-Erkennung umfassen. Wenn sich die Clusterzentroide zwischen Sitzungen stark verschieben, muss das untersucht werden.", language_code: "de", delay_ms: 52600 },
  { agent_wave: 11, agent_name: "Cipher", user_index: 93, participant_id: "spiral-w11-u93", text: "Quadratic normalization prevents any single actor from dominating governance outcomes. The math is elegant: vote weight equals the square root of tokens spent.", language_code: "en", delay_ms: 53800 },
  { agent_wave: 11, agent_name: "Cipher", user_index: 94, participant_id: "spiral-w11-u94", text: "حوكمة الذكاء الاصطناعي تحتاج إلى مقاييس واضحة للنجاح. نسبة المشاركة، رضا المواطنين، وجودة القرارات يجب أن تُقاس وتُنشر بشفافية.", language_code: "ar", delay_ms: 55000 },
];

// ── Wave 12: Zenith (6 users, 55s start) — Summary & synthesis ──────
const WAVE_12: SpiralTestResponse[] = [
  { agent_wave: 12, agent_name: "Zenith", user_index: 95, participant_id: "spiral-w12-u95", text: "Across all perspectives, three themes emerge: transparency and auditability, inclusive multilingual access, and gradual trust-building through iterative deployment.", language_code: "en", delay_ms: 55000 },
  { agent_wave: 12, agent_name: "Zenith", user_index: 96, participant_id: "spiral-w12-u96", text: "En resumen, la gobernanza IA exitosa equilibra la innovación tecnológica con la protección de derechos humanos fundamentales y la inclusión de todas las voces.", language_code: "es", delay_ms: 56000 },
  { agent_wave: 12, agent_name: "Zenith", user_index: 97, participant_id: "spiral-w12-u97", text: "The synthesis is clear: AI governance needs hybrid human-AI systems, open-source foundations, mobile-first design, and mathematical guarantees of fairness.", language_code: "en", delay_ms: 57000 },
  { agent_wave: 12, agent_name: "Zenith", user_index: 98, participant_id: "spiral-w12-u98", text: "Zusammenfassend brauchen wir offene Standards, mehrsprachige Unterstützung, mathematische Fairness-Garantien und einen schrittweisen Ansatz bei der Einführung.", language_code: "de", delay_ms: 58000 },
  { agent_wave: 12, agent_name: "Zenith", user_index: 99, participant_id: "spiral-w12-u99", text: "The shared intention that emerges from this discourse is unmistakable: AI should amplify collective wisdom while protecting individual rights and minority perspectives.", language_code: "en", delay_ms: 59000 },
  { agent_wave: 12, agent_name: "Zenith", user_index: 100, participant_id: "spiral-w12-u100", text: "Where shared intention moves at the speed of thought. One hundred voices, twelve agent waves, eleven languages — compressed into actionable governance themes in sixty seconds.", language_code: "en", delay_ms: 60000 },
];

// ── Assembled Waves ─────────────────────────────────────────────────

export const SPIRAL_TEST_WAVES: SpiralTestWave[] = [
  { wave: 1, agent_name: "Catalyst", user_count: 12, delay_start_ms: 0, theme_focus: "Mixed — kicks off diversity", responses: WAVE_1 },
  { wave: 2, agent_name: "Sentinel", user_count: 10, delay_start_ms: 3000, theme_focus: "Risk & security concerns", responses: WAVE_2 },
  { wave: 3, agent_name: "Nexus", user_count: 10, delay_start_ms: 7000, theme_focus: "Integration & collaboration", responses: WAVE_3 },
  { wave: 4, agent_name: "Oracle", user_count: 9, delay_start_ms: 11000, theme_focus: "Future predictions", responses: WAVE_4 },
  { wave: 5, agent_name: "Forge", user_count: 9, delay_start_ms: 16000, theme_focus: "Building & implementation", responses: WAVE_5 },
  { wave: 6, agent_name: "Compass", user_count: 8, delay_start_ms: 21000, theme_focus: "Direction & strategy", responses: WAVE_6 },
  { wave: 7, agent_name: "Prism", user_count: 8, delay_start_ms: 26000, theme_focus: "Multi-perspective analysis", responses: WAVE_7 },
  { wave: 8, agent_name: "Echo", user_count: 8, delay_start_ms: 31000, theme_focus: "Reinforcing key themes", responses: WAVE_8 },
  { wave: 9, agent_name: "Vanguard", user_count: 7, delay_start_ms: 37000, theme_focus: "Cutting-edge ideas", responses: WAVE_9 },
  { wave: 10, agent_name: "Harmony", user_count: 7, delay_start_ms: 43000, theme_focus: "Consensus building", responses: WAVE_10 },
  { wave: 11, agent_name: "Cipher", user_count: 6, delay_start_ms: 49000, theme_focus: "Data & analytics", responses: WAVE_11 },
  { wave: 12, agent_name: "Zenith", user_count: 6, delay_start_ms: 55000, theme_focus: "Summary & synthesis", responses: WAVE_12 },
];

/** Flat array of all 100 responses, ordered by delay_ms */
export const SPIRAL_TEST_RESPONSES: SpiralTestResponse[] = SPIRAL_TEST_WAVES
  .flatMap((w) => w.responses)
  .sort((a, b) => a.delay_ms - b.delay_ms);

/** Language distribution summary */
export const SPIRAL_LANGUAGE_DISTRIBUTION = {
  en: 60, es: 10, de: 8, fr: 5, pt: 4, ja: 3, zh: 3, ko: 2, ar: 2, hi: 2, it: 1,
} as const;
