"""
Generate 3 simulated CSV files matching the 16-column eXeL-AI-Polling schema.
Fixed seed=42 for full reproducibility.
"""

import pandas as pd
import numpy as np
import os

SEED = 42
rng = np.random.default_rng(SEED)

OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Content pools per use case
# ---------------------------------------------------------------------------

# USE CASE 1: Strategic priority Q1 2026
UC1_QUESTION = "What should be our top strategic priority for Q1 2026?"
UC1_DETAILED_RISK = [
    "We risk over-investing in new markets without solidifying our existing customer base. Revenue concentration in a single vertical leaves us exposed to sector downturns. A more cautious approach to expansion would protect our balance sheet.",
    "Pursuing aggressive growth targets without adequate risk controls could jeopardize the company. Our supply chain remains fragile after last year's disruptions. We need contingency planning before committing to new initiatives.",
    "Cybersecurity threats are escalating and our defenses have not kept pace. A single breach could destroy stakeholder trust and trigger regulatory penalties. Security must be the top strategic priority.",
    "Talent retention is at a critical point with attrition rising quarter over quarter. Losing key engineers will delay product launches and erode competitive advantage. We must address compensation and culture immediately.",
    "Our technical debt continues to accumulate and deployment velocity is declining. Without a dedicated remediation sprint, feature delivery will grind to a halt. This is the hidden risk leadership is underestimating.",
    "Regulatory changes in the EU could invalidate our current data processing model. Non-compliance fines under the new directive could reach eight figures. Legal review must be prioritized above growth targets.",
    "Customer satisfaction scores have dropped for three consecutive quarters. Churn is accelerating among enterprise accounts. If we don't fix product quality, no amount of sales effort will matter.",
    "Our competitors have secured significant funding rounds and are hiring aggressively. Failing to respond with our own investment in R&D will leave us behind within two quarters.",
    "The board is pushing for short-term profitability at the expense of long-term positioning. This pressure could lead to cuts in innovation programs that are essential for future revenue streams.",
    "Dependency on a single cloud provider creates vendor lock-in risk. A pricing change or outage could cascade through our entire platform. Multi-cloud strategy should be the Q1 priority.",
]
UC1_DETAILED_SUPPORT = [
    "Investing in AI-driven product features will differentiate us from competitors and unlock new revenue streams. Early movers in our segment are already seeing 20% uplift in engagement. This is the right moment to double down.",
    "Expanding into Latin American markets offers significant upside with relatively low entry barriers. Our brand awareness survey shows strong recognition in Mexico and Brazil. Q1 is the ideal window before competitors enter.",
    "Building a world-class developer experience will attract top talent and accelerate partner integrations. Open APIs and comprehensive documentation are force multipliers for growth. This should be the cornerstone of Q1 strategy.",
    "Strengthening our data analytics platform will enable better decision-making across every department. Data-informed organizations outperform peers by 23% according to recent industry studies. The investment pays for itself within two quarters.",
    "Focusing on customer success programs will reduce churn and increase lifetime value. Proactive engagement models have proven effective in similar SaaS companies. Happy customers become our best salesforce through referrals.",
    "Launching a sustainability initiative aligns with stakeholder expectations and opens green financing options. ESG-focused companies are attracting premium valuations in public markets. This positions us well for a future IPO.",
    "Accelerating our mobile-first strategy captures the shift in user behavior we're seeing across all demographics. Mobile engagement is up 40% year over year and desktop is declining. Meeting users where they are is simply good business.",
    "Investing in employee training and upskilling programs will boost productivity and morale simultaneously. Companies that invest in learning see 24% higher margins. Q1 budget allocation should reflect this priority.",
    "Strategic partnerships with complementary platforms will expand our total addressable market without heavy capital expenditure. Co-selling arrangements reduce customer acquisition costs. Several partners have expressed strong interest.",
    "Consolidating our product line to focus on core strengths will improve margins and simplify the customer journey. Feature bloat is confusing prospects and burdening support teams. Simplification is the path to scalable growth.",
]
UC1_DETAILED_NEUTRAL = [
    "There are arguments for both aggressive expansion and cautious consolidation. The right balance likely depends on Q4 performance data that hasn't been fully analyzed yet. More information is needed before committing to a direction.",
    "Different departments have different priorities and there's no obvious single focus that serves everyone. Engineering wants stability while sales wants new features. A portfolio approach might be more realistic than a single priority.",
    "The macro-economic outlook remains uncertain with mixed signals from leading indicators. It's hard to commit to major strategic bets when the environment could shift rapidly. Flexibility and optionality should be valued.",
    "I think the priority depends heavily on what our largest customers are signaling. Without fresh voice-of-customer data, any strategic direction is somewhat speculative. We should survey key accounts first.",
    "Both technology investment and market expansion have merit as Q1 priorities. The choice probably comes down to organizational capacity and which initiative has stronger internal champions. Either could work with proper execution.",
    "Our industry is in a transitional phase and it's unclear which trends will dominate. Following fast rather than leading might be the wisest approach until the dust settles. Observation before action has value.",
    "The strategic priority should be whatever addresses our most binding constraint, but I'm not sure the leadership team has consensus on what that constraint actually is. A facilitated strategy session would help clarify.",
]

UC1_THEMES_9 = {
    "Risk & Concerns": ["Market Vulnerability", "Talent Attrition Risk", "Cybersecurity Gaps", "Regulatory Exposure", "Technical Debt Burden", "Vendor Lock-in", "Competitive Pressure", "Short-term Thinking"],
    "Supporting Comments": ["AI Innovation Push", "Market Expansion", "Developer Experience", "Data-Driven Growth", "Customer Retention", "Sustainability Play", "Mobile Strategy", "Partnership Growth"],
    "Neutral Comments": ["Balanced Approach", "Uncertain Outlook", "Need More Data", "Portfolio Strategy", "Wait and See", "Constraint Analysis"],
}
UC1_THEMES_6 = {
    "Risk & Concerns": ["Operational Risk", "Strategic Overreach", "Security Deficit", "Talent Crisis", "Compliance Gap"],
    "Supporting Comments": ["Growth Acceleration", "Product Innovation", "Market Penetration", "Capability Building", "Revenue Diversification"],
    "Neutral Comments": ["Mixed Signals", "Balanced View", "Pending Analysis", "Multi-factor Decision"],
}
UC1_THEMES_3 = {
    "Risk & Concerns": ["Downside Protection", "Risk Mitigation", "Caution Advised"],
    "Supporting Comments": ["Growth Priority", "Innovation Focus", "Expansion Ready"],
    "Neutral Comments": ["Balanced Path", "Undecided", "Context Dependent"],
}

# USE CASE 2: Austin public transportation
UC2_QUESTION = "How should Austin improve public transportation?"
UC2_DETAILED_RISK = [
    "Expanding rail without addressing last-mile connectivity will result in low ridership and wasted investment. Previous attempts like the Red Line show limited adoption when feeder routes are inadequate. We cannot repeat those mistakes.",
    "Cost overruns on transit megaprojects are the norm, not the exception. Austin's history with Project Connect timelines suggests budgets will balloon beyond projections. Taxpayers deserve more realistic financial planning.",
    "Displacing communities through transit corridor development raises serious equity concerns. Gentrification along new rail lines will push out the very populations the system is supposed to serve. Social impact must be studied carefully.",
    "Autonomous vehicle technology could make fixed-route transit obsolete within a decade. Investing billions in rail infrastructure that may become stranded assets is a significant risk. We should plan for technological disruption.",
    "Austin's sprawling geography makes traditional mass transit inherently challenging. Population density outside downtown is too low to support frequent service. Without land use reform, transit investments will underperform.",
    "Political fragmentation between the city, county, and CapMetro creates governance challenges. Lack of a unified transit authority leads to duplication and gaps in service. Institutional reform must precede major capital spending.",
    "Summer heat makes waiting at exposed bus stops dangerous for elderly and disabled riders. Without climate-adapted infrastructure, ridership will remain seasonal. This basic comfort issue is consistently overlooked.",
]
UC2_DETAILED_SUPPORT = [
    "A comprehensive light rail network connecting major employment centers would transform Austin's mobility landscape. Cities like Portland and Denver have shown that rail catalyzes both ridership and economic development along corridors.",
    "Dedicated bus rapid transit lanes on major arterials can be implemented quickly at a fraction of rail costs. BRT systems in Bogota and Cleveland demonstrate that buses with proper infrastructure rival rail performance.",
    "Expanding Park-and-Ride facilities along the urban fringe gives suburban commuters a practical reason to use transit. Convenient parking and express connections can shift thousands of car trips daily.",
    "Real-time transit data and mobile payment integration would dramatically improve the rider experience. Modern transit apps that show accurate arrival times and allow seamless transfers reduce the friction of using public transit.",
    "A commuter ferry service on Lady Bird Lake and the Colorado River could serve as both transit and tourism. Water transit is underexplored in Austin despite favorable geography in certain corridors.",
    "Microtransit on-demand shuttles for low-density neighborhoods would solve the last-mile problem without running empty buses. Companies like Via have shown this model works well as a feeder to trunk routes.",
    "Congestion pricing downtown combined with free transit zones would shift behavior and fund service improvements simultaneously. London and Stockholm proved this approach reduces traffic while boosting transit ridership.",
    "Protected bike lanes connecting to transit hubs enable multi-modal commuting that's faster than driving for many trips. Dutch-style cycling infrastructure would complement rather than compete with public transit investment.",
    "Free fares funded through sales tax would eliminate the biggest barrier to ridership for low-income residents. Kansas City's experiment with fare-free transit showed significant ridership gains and reduced car dependency.",
]
UC2_DETAILED_NEUTRAL = [
    "Austin needs better transit but the specific technology choice matters less than getting the routing and frequency right. Whether it's rail or BRT, the key is going where people actually need to go at times they need to travel.",
    "I've lived in cities with great transit and cities without. Austin could go either way depending on whether leadership commits to density around stations. Transit and land use are inseparable policy decisions.",
    "The debate between rail and bus tends to overshadow the real question of funding sustainability. Whatever mode we choose, the operating budget must be reliable for decades. Capital costs are only half the equation.",
    "Both investing heavily and taking an incremental approach have merit. The right answer probably involves a phased plan that starts with high-impact corridors and expands based on demonstrated demand.",
    "Transit improvements will help some neighborhoods more than others. I'm not sure there's a fair way to distribute benefits when geography creates inherent winners and losers. Equity analysis should guide but not paralyze decisions.",
]

UC2_THEMES_9 = {
    "Risk & Concerns": ["Cost Overrun Fear", "Ridership Uncertainty", "Equity Displacement", "Technology Obsolescence", "Governance Fragmentation", "Heat Exposure Risk"],
    "Supporting Comments": ["Rail Expansion", "Bus Rapid Transit", "Microtransit Solutions", "Multi-modal Network", "Free Fare Model", "Congestion Pricing", "Park and Ride Growth", "Cycling Integration"],
    "Neutral Comments": ["Mode Agnostic", "Phased Approach", "Funding Sustainability", "Land Use Linkage", "Equity Trade-offs"],
}
UC2_THEMES_6 = {
    "Risk & Concerns": ["Financial Risk", "Displacement Concern", "Infrastructure Lock-in", "Governance Gaps"],
    "Supporting Comments": ["Network Expansion", "Service Innovation", "Demand Management", "Fare Equity", "Rider Experience"],
    "Neutral Comments": ["Balanced Planning", "Context Matters", "Incremental Strategy"],
}
UC2_THEMES_3 = {
    "Risk & Concerns": ["Overspend Risk", "Equity Harm", "Planning Failure"],
    "Supporting Comments": ["Build Transit Now", "Innovative Solutions", "Rider First"],
    "Neutral Comments": ["Pragmatic Path", "More Study Needed"],
}

# USE CASE 3: Most important issue facing humanity 2026
UC3_QUESTION = "What is the most important issue facing humanity in 2026?"
UC3_DETAILED_RISK = [
    "Climate change is accelerating beyond worst-case projections and global cooperation remains insufficient. Tipping points in the Arctic and Amazon are approaching faster than models predicted. Without drastic action this decade, adaptation costs will dwarf mitigation investments.",
    "The proliferation of autonomous weapons systems is creating new categories of existential risk. International governance frameworks have not kept pace with the technology. A single miscalculation could trigger escalation beyond human control.",
    "Artificial intelligence alignment remains an unsolved problem as systems grow more capable. The race to deploy powerful AI without adequate safety research threatens unintended consequences at scale. This is arguably the defining risk of our era.",
    "Antibiotic resistance is quietly becoming a global health emergency. By 2030, drug-resistant infections could claim millions of lives annually. The pharmaceutical pipeline for new antibiotics is dangerously thin.",
    "Fresh water scarcity affects billions and is worsening due to overextraction and climate shifts. Water conflicts are already emerging between nations and within regions. This basic resource crisis underlies many other global tensions.",
    "Democratic institutions worldwide are eroding under the pressure of misinformation and political polarization. The ability of societies to make collective decisions is degrading at precisely the moment we need coordinated action on global challenges.",
    "Income inequality has reached levels not seen since the Gilded Age in many developed nations. Social cohesion is fracturing as economic mobility declines. Concentrated wealth distorts political systems and perpetuates structural disadvantage.",
    "Biodiversity loss is proceeding at extinction-event rates. Ecosystem collapse would undermine agriculture, medicine, and climate regulation. The economic value of nature's services far exceeds what markets currently recognize.",
    "Nuclear proliferation risks have increased with shifting geopolitical alliances and weakened treaties. The deterrence framework that prevented conflict for decades is under stress. A new arms race is quietly underway.",
    "Mental health crisis among young people is reaching epidemic proportions globally. Social media, economic precarity, and climate anxiety are compounding factors. The workforce and social fabric of the next generation are at stake.",
]
UC3_DETAILED_SUPPORT = [
    "Renewable energy costs have plummeted to historic lows, making the clean transition economically inevitable. Solar and wind are now cheaper than fossil fuels in most markets. This is genuinely hopeful progress on climate change.",
    "Global literacy rates continue to rise, enabling more people than ever to participate in knowledge economies. Education technology is reaching previously underserved populations. Human capital is growing at an unprecedented rate.",
    "International cooperation on pandemic preparedness has improved significantly since COVID. New mRNA platforms can develop vaccines in weeks rather than years. We are better prepared for biological threats than at any point in history.",
    "Advances in fusion energy research suggest commercial viability may be achieved within this decade. Unlimited clean energy would transform nearly every challenge humanity faces. The investment momentum is encouraging.",
    "Gene editing technologies like CRISPR offer the potential to eliminate hereditary diseases. Ethical frameworks are developing alongside the science. Responsible application could reduce enormous amounts of human suffering.",
    "Space exploration is entering a new era of international cooperation and private sector innovation. The long-term survival of humanity benefits from becoming multi-planetary. Mars missions in this decade could prove transformative.",
    "Open source AI models are democratizing access to powerful tools for education, health, and governance. Smaller nations and organizations can now leverage capabilities once reserved for tech giants. This levels the playing field significantly.",
]
UC3_DETAILED_NEUTRAL = [
    "There are so many interconnected crises that identifying a single most important issue feels reductive. Climate, AI, inequality, and health are all deeply entangled. Systems thinking rather than issue prioritization may be what's needed.",
    "The answer depends entirely on where you live and what you're experiencing. Water scarcity is existential for some regions while AI risk dominates discourse in wealthy nations. Perspective shapes priority.",
    "History suggests that the most important issues are often the ones we're not yet discussing. Black swan events by definition catch us off guard. Resilience and adaptability matter more than predicting the next crisis.",
    "Both techno-optimists and doomers have compelling arguments. The truth is probably that humanity will muddle through with partial solutions to most challenges. The real question is whether muddling is fast enough.",
    "I think governance capacity is the meta-issue. Most problems have known solutions but lack the political will or institutional capability to implement them. Fixing decision-making systems fixes everything downstream.",
    "Generational divides in how people perceive global risks make consensus difficult. Older populations prioritize economic stability while younger ones focus on climate and social justice. Bridging this gap is itself a critical challenge.",
    "The interconnected nature of global challenges means no single issue can be addressed in isolation. Food security links to climate which links to migration which links to political stability. We need integrated approaches.",
]

UC3_THEMES_9 = {
    "Risk & Concerns": ["Climate Catastrophe", "AI Alignment Risk", "Democratic Erosion", "Wealth Inequality", "Biodiversity Collapse", "Water Scarcity Crisis", "Nuclear Proliferation", "Antibiotic Resistance", "Mental Health Epidemic"],
    "Supporting Comments": ["Renewable Energy Boom", "Pandemic Preparedness", "Fusion Breakthrough", "Gene Editing Promise", "Space Expansion", "Education Access", "Open Source AI"],
    "Neutral Comments": ["Interconnected Crises", "Perspective Dependent", "Governance Meta-issue", "Generational Divide", "Systems Thinking Needed"],
}
UC3_THEMES_6 = {
    "Risk & Concerns": ["Existential Climate Risk", "Technology Misalignment", "Institutional Decay", "Resource Depletion", "Social Fragmentation"],
    "Supporting Comments": ["Energy Transition", "Scientific Progress", "Global Cooperation", "Democratized Technology"],
    "Neutral Comments": ["Systemic Complexity", "Cultural Perspective", "Adaptive Governance"],
}
UC3_THEMES_3 = {
    "Risk & Concerns": ["Existential Threat", "Systemic Collapse", "Human Conflict"],
    "Supporting Comments": ["Progress Accelerating", "Innovation Hope", "Cooperation Rising"],
    "Neutral Comments": ["Complex Reality", "Depends on Context", "Integrated Response"],
}


# ---------------------------------------------------------------------------
# Language pools for non-English text snippets (short fragments)
# ---------------------------------------------------------------------------
ES_FRAGMENTS = [
    "Es fundamental que abordemos este tema con urgencia y transparencia. La participacion ciudadana es clave para el exito de cualquier iniciativa.",
    "Necesitamos mas inversion en infraestructura y educacion. Sin recursos adecuados, las comunidades mas vulnerables seguiran marginadas.",
    "La colaboracion entre sectores publico y privado puede generar soluciones innovadoras. Debemos fomentar alianzas estrategicas para el bien comun.",
    "Creo que la tecnologia puede ser una herramienta poderosa si se usa responsablemente. El acceso equitativo a las herramientas digitales es esencial.",
    "Los datos muestran que las politicas actuales no estan funcionando. Necesitamos un enfoque basado en evidencia para tomar decisiones informadas.",
]
FR_FRAGMENTS = [
    "Il est essentiel de repenser notre approche face aux defis actuels. La cooperation internationale doit etre renforcee pour obtenir des resultats durables.",
    "Les inegalites sociales continuent de croitre et menacent la stabilite de nos societes. Des politiques redistributives plus audacieuses sont necessaires.",
    "L'innovation technologique offre des opportunites sans precedent pour resoudre les problemes mondiaux. Nous devons investir dans la recherche et le developpement.",
    "La transition ecologique necessite un engagement collectif de tous les acteurs de la societe. Chaque citoyen a un role a jouer dans cette transformation.",
]
DE_FRAGMENTS = [
    "Wir muessen unsere Strategien grundlegend ueberdenken, um den aktuellen Herausforderungen gerecht zu werden. Nachhaltigkeit sollte im Mittelpunkt jeder Entscheidung stehen.",
    "Die Digitalisierung bietet enorme Chancen, birgt aber auch Risiken fuer Datenschutz und soziale Gerechtigkeit. Ein ausgewogener Ansatz ist erforderlich.",
    "Bildung und Forschung sind die Grundpfeiler einer zukunftsfaehigen Gesellschaft. Investitionen in Humankapital zahlen sich langfristig immer aus.",
]
ZH_FRAGMENTS = [
    "We must consider the perspective of developing nations in this discussion. Global solutions require global participation and equitable resource distribution.",
    "Technology transfer between developed and developing countries could accelerate progress on shared challenges. Barriers to knowledge sharing must be reduced.",
    "The rapid urbanization in Asian cities presents both opportunities and challenges for sustainability. Smart city planning can mitigate many negative effects.",
]
HI_FRAGMENTS = [
    "The diverse cultural perspectives of South Asia offer unique insights into collective governance. Community-based solutions have deep roots in this tradition.",
    "Population dynamics in the subcontinent will shape global outcomes for decades. Investment in education and healthcare infrastructure is urgently needed.",
]
AR_FRAGMENTS = [
    "Regional cooperation in the Middle East could unlock enormous economic potential. Shared water resources require collaborative management frameworks.",
    "Youth empowerment across Arabic-speaking nations is essential for political and economic reform. The demographic dividend must not be wasted.",
]
OTHER_FRAGMENTS = [
    "Cross-cultural dialogue is essential for addressing global challenges that transcend national boundaries. We must build bridges between diverse communities.",
    "Indigenous knowledge systems offer valuable perspectives on sustainable resource management. Integration of traditional and modern approaches strengthens outcomes.",
    "Small island developing states face disproportionate impacts from climate change. Their voices must be amplified in international policy discussions.",
]


def pick_language(lang_dist: dict) -> str:
    """Return a language code based on distribution dict {code: probability}."""
    codes = list(lang_dist.keys())
    probs = [lang_dist[c] for c in codes]
    return rng.choice(codes, p=probs)


def get_lang_label(code: str) -> str:
    labels = {"en": "English", "es": "Spanish", "fr": "French", "de": "German",
              "zh": "Chinese", "hi": "Hindi", "ar": "Arabic", "other": "Other"}
    return labels.get(code, "Other")


def get_non_english_text(code: str) -> str:
    pools = {"es": ES_FRAGMENTS, "fr": FR_FRAGMENTS, "de": DE_FRAGMENTS,
             "zh": ZH_FRAGMENTS, "hi": HI_FRAGMENTS, "ar": AR_FRAGMENTS, "other": OTHER_FRAGMENTS}
    pool = pools.get(code, OTHER_FRAGMENTS)
    return rng.choice(pool)


def make_summary_333(detailed: str) -> str:
    """~50 words from detailed text."""
    words = detailed.split()
    end = min(50, len(words))
    return " ".join(words[:end])


def make_summary_111(detailed: str) -> str:
    """~20 words."""
    words = detailed.split()
    end = min(20, len(words))
    return " ".join(words[:end])


def make_summary_33(detailed: str) -> str:
    """~10 words."""
    words = detailed.split()
    end = min(10, len(words))
    return " ".join(words[:end])


def pick_confidence() -> str:
    return f"{rng.integers(65, 99)}%"


def generate_csv(
    filename: str,
    n_rows: int,
    question: str,
    theme01_dist: dict,  # {"Risk & Concerns": 0.35, ...}
    lang_dist: dict,
    detailed_pools: dict,  # {"Risk & Concerns": [...], "Supporting Comments": [...], "Neutral Comments": [...]}
    themes_9: dict,
    themes_6: dict,
    themes_3: dict,
):
    rows = []
    theme_labels = list(theme01_dist.keys())
    theme_probs = [theme01_dist[t] for t in theme_labels]

    for i in range(1, n_rows + 1):
        theme01 = rng.choice(theme_labels, p=theme_probs)
        lang_code = pick_language(lang_dist)
        lang_label = get_lang_label(lang_code)

        # Pick detailed text
        pool = detailed_pools[theme01]
        base_text = rng.choice(pool)

        # For non-English, prepend a native-language fragment
        if lang_code != "en":
            fragment = get_non_english_text(lang_code)
            detailed = f"{fragment} {base_text}"
        else:
            detailed = base_text

        # Summaries
        s333 = make_summary_333(detailed)
        s111 = make_summary_111(detailed)
        s33 = make_summary_33(detailed)

        # Theme sub-categories
        t9_pool = themes_9[theme01]
        t6_pool = themes_6[theme01]
        t3_pool = themes_3[theme01]

        row = {
            "Q_Number": "Q-0001",
            "Question": question,
            "User": f"user_{i:04d}",
            "Detailed_Results": detailed,
            "Response_Language": lang_label,
            "333_Summary": s333,
            "111_Summary": s111,
            "33_Summary": s33,
            "Theme01": theme01,
            "Theme01_Confidence": pick_confidence(),
            "Theme2_9": rng.choice(t9_pool),
            "Theme2_9_Confidence": pick_confidence(),
            "Theme2_6": rng.choice(t6_pool),
            "Theme2_6_Confidence": pick_confidence(),
            "Theme2_3": rng.choice(t3_pool),
            "Theme2_3_Confidence": pick_confidence(),
        }
        rows.append(row)

    df = pd.DataFrame(rows)
    path = os.path.join(OUTPUT_DIR, filename)
    df.to_csv(path, index=False, encoding="utf-8-sig")
    size_kb = os.path.getsize(path) / 1024
    print(f"  {filename}: {len(df)} rows, {size_kb:.1f} KB")
    return df


def main():
    print("Generating simulated CSV files...\n")

    # UC1: Strategic priority (1,000 rows)
    generate_csv(
        filename="sim_use_case_1000.csv",
        n_rows=1000,
        question=UC1_QUESTION,
        theme01_dist={"Risk & Concerns": 0.35, "Supporting Comments": 0.40, "Neutral Comments": 0.25},
        lang_dist={"en": 0.80, "es": 0.10, "fr": 0.05, "de": 0.05},
        detailed_pools={"Risk & Concerns": UC1_DETAILED_RISK, "Supporting Comments": UC1_DETAILED_SUPPORT, "Neutral Comments": UC1_DETAILED_NEUTRAL},
        themes_9=UC1_THEMES_9,
        themes_6=UC1_THEMES_6,
        themes_3=UC1_THEMES_3,
    )

    # UC2: Austin transportation (1,000 rows representing 40K)
    generate_csv(
        filename="sim_use_case_40000.csv",
        n_rows=1000,
        question=UC2_QUESTION,
        theme01_dist={"Risk & Concerns": 0.30, "Supporting Comments": 0.45, "Neutral Comments": 0.25},
        lang_dist={"en": 0.70, "es": 0.15, "zh": 0.10, "other": 0.05},
        detailed_pools={"Risk & Concerns": UC2_DETAILED_RISK, "Supporting Comments": UC2_DETAILED_SUPPORT, "Neutral Comments": UC2_DETAILED_NEUTRAL},
        themes_9=UC2_THEMES_9,
        themes_6=UC2_THEMES_6,
        themes_3=UC2_THEMES_3,
    )

    # UC3: Humanity's most important issue (1,000 rows representing 1.1M)
    generate_csv(
        filename="sim_use_case_1111111.csv",
        n_rows=1000,
        question=UC3_QUESTION,
        theme01_dist={"Risk & Concerns": 0.40, "Supporting Comments": 0.30, "Neutral Comments": 0.30},
        lang_dist={"en": 0.50, "es": 0.15, "zh": 0.10, "hi": 0.08, "ar": 0.05, "other": 0.12},
        detailed_pools={"Risk & Concerns": UC3_DETAILED_RISK, "Supporting Comments": UC3_DETAILED_SUPPORT, "Neutral Comments": UC3_DETAILED_NEUTRAL},
        themes_9=UC3_THEMES_9,
        themes_6=UC3_THEMES_6,
        themes_3=UC3_THEMES_3,
    )

    print("\nDone. All 3 CSV files generated.")


if __name__ == "__main__":
    main()
