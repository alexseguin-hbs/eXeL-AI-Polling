/**
 * SIM Data: Poll 1 — Product Feedback (Live Interactive)
 * Per-cube I/O for Moderator and User simulation roles.
 *
 * Cube 4: Web_Results format with native_language per response
 * Cube 6: Phase A (333/111/33 summaries) + Phase B (Theme01 → Theme2_9/6/3)
 */

export const POLL_1 = {
  sessionId: "a1b2c3d4-e5f6-7890-abcd-111111111111",
  title: "Test Poll: Product Feedback",
  pollingMode: "live_interactive" as const,
  questions: [
    {
      text: "What is the single most important feature we should build next?",
      id: "q1-111111",
    },
  ],

  cube1: {
    moderator: {
      stateFlow: [
        "draft",
        "open",
        "polling",
        "closed",
        "theming",
        "visuals",
        "ranking",
        "archived",
      ] as const,
    },
    user: {
      joinCode: "12345678",
      tokensOnJoin: { si: 1, ai: 5, hi: 0 },
    },
  },

  cube2: {
    aiResponses: [
      {
        user: "AI User 1",
        text: "Real-time collaboration is the #1 need. Teams waste hours in async threads when a live workspace could resolve issues in minutes.",
        delayMs: 2000,
        theme: "feature",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 2",
        text: "Die Leistungsoptimierung sollte Priorit\u00e4t haben. Unsere Dashboards brauchen \u00fcber 4 Sekunden zum Laden \u2014 Nutzer springen ab, bevor sie Ergebnisse sehen.",
        delayMs: 4500,
        theme: "performance",
        languageCode: "de",
        nativeLanguage: "German",
      },
      {
        user: "AI User 3",
        text: "We need better mobile support. Over 60% of our users access the platform from phones but the experience is desktop-first.",
        delayMs: 7000,
        theme: "feature",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 4",
        text: "Las integraciones API con Slack y Teams desbloquear\u00edan la adopci\u00f3n empresarial. La mayor\u00eda de las empresas no cambiar\u00e1n de herramientas \u2014 necesitan que est\u00e9 integrado.",
        delayMs: 9500,
        theme: "integration",
        languageCode: "es",
        nativeLanguage: "Spanish",
      },
      {
        user: "AI User 5",
        text: "Data export and analytics are the gap. Decision-makers need CSV/PDF reports they can share with stakeholders who don't use the platform.",
        delayMs: 12000,
        theme: "feature",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 6",
        text: "Sicherheitszertifizierungen (SOC2, DSGVO) blockieren Enterprise-Deals. Wir k\u00f6nnen nicht an Gesundheitswesen oder Finanzen verkaufen ohne Compliance.",
        delayMs: 14500,
        theme: "performance",
        languageCode: "de",
        nativeLanguage: "German",
      },
      {
        user: "AI User 7",
        text: "The onboarding flow needs work. New users get lost after sign-up. An interactive tutorial would reduce time-to-value significantly.",
        delayMs: 17000,
        theme: "integration",
        languageCode: "en",
        nativeLanguage: "English",
      },
    ],
  },

  cube3: {
    voiceTranscript: {
      text: "I think the most important feature is real-time collaboration so teams can work together without switching between apps.",
      confidence: 0.94,
      provider: "whisper" as const,
    },
  },

  // ── Cube 4: Web_Results format (collected responses) ─────────
  cube4: {
    collectedResponses: [
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 1",
        detailed_results: "Real-time collaboration is the #1 need. Teams waste hours in async threads when a live workspace could resolve issues in minutes.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 2",
        detailed_results: "Die Leistungsoptimierung sollte Priorit\u00e4t haben. Unsere Dashboards brauchen \u00fcber 4 Sekunden zum Laden \u2014 Nutzer springen ab, bevor sie Ergebnisse sehen.",
        response_language: "German",
        native_language: "de",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 3",
        detailed_results: "We need better mobile support. Over 60% of our users access the platform from phones but the experience is desktop-first.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 4",
        detailed_results: "Las integraciones API con Slack y Teams desbloquear\u00edan la adopci\u00f3n empresarial. La mayor\u00eda de las empresas no cambiar\u00e1n de herramientas \u2014 necesitan que est\u00e9 integrado.",
        response_language: "Spanish",
        native_language: "es",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 5",
        detailed_results: "Data export and analytics are the gap. Decision-makers need CSV/PDF reports they can share with stakeholders who don't use the platform.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 6",
        detailed_results: "Sicherheitszertifizierungen (SOC2, DSGVO) blockieren Enterprise-Deals. Wir k\u00f6nnen nicht an Gesundheitswesen oder Finanzen verkaufen ohne Compliance.",
        response_language: "German",
        native_language: "de",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What is the single most important feature we should build next?",
        user: "AI User 7",
        detailed_results: "The onboarding flow needs work. New users get lost after sign-up. An interactive tutorial would reduce time-to-value significantly.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
    ],
    responseCount: { total: 7, text_count: 7, voice_count: 0 },
    languageBreakdown: [
      { language_code: "en", count: 4 },
      { language_code: "de", count: 2 },
      { language_code: "es", count: 1 },
    ],
  },

  // ── Cube 6: AI Theme Pipeline Output ─────────────────────────
  cube6: {
    // Phase A: Live per-response summaries (333/111/33 words)
    summaries: [
      {
        user: "AI User 1",
        summary_333: "Real-time collaboration is the #1 need. Teams waste hours in async threads when a live workspace could resolve issues in minutes.",
        summary_111: "Real-time collaboration is the top priority. Teams waste time in async threads when live workspaces could resolve issues faster.",
        summary_33: "Real-time collaboration needed. Teams waste hours in async when live workspaces resolve issues faster.",
      },
      {
        user: "AI User 2",
        summary_333: "Performance optimization should be the priority. Dashboards take over 4 seconds to load, causing users to drop off before seeing results.",
        summary_111: "Performance optimization is critical. Dashboards load slowly at 4+ seconds, causing user drop-off before results display.",
        summary_33: "Performance optimization critical. Slow dashboard loading causes user drop-off before results.",
      },
      {
        user: "AI User 3",
        summary_333: "Better mobile support is needed. Over 60% of users access from phones but the experience remains desktop-first, creating friction.",
        summary_111: "Mobile support needed urgently. 60% of users access via phones but the desktop-first design creates friction.",
        summary_33: "Mobile support urgent. 60% access via phone but desktop-first design creates friction.",
      },
      {
        user: "AI User 4",
        summary_333: "API integrations with Slack and Teams would unlock enterprise adoption. Most companies will not switch tools and need the platform embedded in their existing workflow.",
        summary_111: "API integrations with Slack and Teams would unlock enterprise adoption. Companies need embedded tools, not tool switching.",
        summary_33: "Slack/Teams API integrations unlock enterprise. Companies need embedded tools.",
      },
      {
        user: "AI User 5",
        summary_333: "Data export and analytics represent the key gap. Decision-makers need CSV/PDF reports shareable with stakeholders who do not use the platform directly.",
        summary_111: "Data export and analytics are the gap. Decision-makers need CSV/PDF reports for stakeholders outside the platform.",
        summary_33: "Data export gap. Decision-makers need CSV/PDF reports for external stakeholders.",
      },
      {
        user: "AI User 6",
        summary_333: "Security certifications like SOC2 and GDPR compliance are blocking enterprise deals. Sales to healthcare and finance sectors are impossible without proper compliance certifications.",
        summary_111: "Security certifications (SOC2, GDPR) block enterprise deals. Healthcare and finance require compliance.",
        summary_33: "SOC2/GDPR certifications block enterprise deals in healthcare and finance.",
      },
      {
        user: "AI User 7",
        summary_333: "The onboarding flow needs improvement. New users become lost after sign-up. An interactive tutorial would significantly reduce time-to-value for new users.",
        summary_111: "Onboarding needs work. New users get lost after sign-up. Interactive tutorials would reduce time-to-value.",
        summary_33: "Onboarding needs improvement. Interactive tutorials would reduce time-to-value.",
      },
    ],
    // Phase B: Theme01 classification (Risk/Supporting/Neutral)
    theme01Classification: [
      { user: "AI User 1", theme01: "Supporting Comments", theme01_confidence: 89 },
      { user: "AI User 2", theme01: "Risk & Concerns", theme01_confidence: 85 },
      { user: "AI User 3", theme01: "Supporting Comments", theme01_confidence: 82 },
      { user: "AI User 4", theme01: "Supporting Comments", theme01_confidence: 91 },
      { user: "AI User 5", theme01: "Neutral Comments", theme01_confidence: 72 },
      { user: "AI User 6", theme01: "Risk & Concerns", theme01_confidence: 88 },
      { user: "AI User 7", theme01: "Neutral Comments", theme01_confidence: 68 },
    ],
    // Theme01 partition counts
    theme01Partitions: {
      "Supporting Comments": 3,
      "Risk & Concerns": 2,
      "Neutral Comments": 2,
    },
    // Marble sampling: groups of 10 (here all 7 fit in one group)
    marbleGroups: [
      { groupIndex: 0, size: 7, seed: 42 },
    ],
    // Theme2 hierarchy: 9 → 6 → 3 reduction
    theme2Hierarchy: {
      theme2_9: [
        { label: "Collaboration & Real-Time Tools", confidence: 0.91, partition: "Supporting Comments" },
        { label: "Mobile Experience Gap", confidence: 0.84, partition: "Supporting Comments" },
        { label: "Enterprise Integration Needs", confidence: 0.88, partition: "Supporting Comments" },
        { label: "Performance Bottlenecks", confidence: 0.85, partition: "Risk & Concerns" },
        { label: "Compliance & Certification Gaps", confidence: 0.87, partition: "Risk & Concerns" },
        { label: "Data Export Requirements", confidence: 0.80, partition: "Neutral Comments" },
        { label: "User Onboarding Friction", confidence: 0.78, partition: "Neutral Comments" },
      ],
      theme2_6: [
        { label: "Collaboration & Integration", confidence: 0.90, partition: "Supporting Comments" },
        { label: "Mobile & UX Improvements", confidence: 0.83, partition: "Supporting Comments" },
        { label: "Security & Compliance", confidence: 0.86, partition: "Risk & Concerns" },
        { label: "Performance Optimization", confidence: 0.85, partition: "Risk & Concerns" },
        { label: "Export & Analytics", confidence: 0.80, partition: "Neutral Comments" },
        { label: "Onboarding Experience", confidence: 0.78, partition: "Neutral Comments" },
      ],
      theme2_3: [
        { label: "Feature Requests", confidence: 0.91, partition: "Supporting Comments" },
        { label: "Performance & Security", confidence: 0.87, partition: "Risk & Concerns" },
        { label: "Integration Needs", confidence: 0.84, partition: "Neutral Comments" },
      ],
    },
    // Per-response theme assignments (final output)
    themeAssignments: [
      { user: "AI User 1", theme2_9: "Collaboration & Real-Time Tools", theme2_9_confidence: 92, theme2_6: "Collaboration & Integration", theme2_6_confidence: 90, theme2_3: "Feature Requests", theme2_3_confidence: 91 },
      { user: "AI User 2", theme2_9: "Performance Bottlenecks", theme2_9_confidence: 86, theme2_6: "Performance Optimization", theme2_6_confidence: 85, theme2_3: "Performance & Security", theme2_3_confidence: 87 },
      { user: "AI User 3", theme2_9: "Mobile Experience Gap", theme2_9_confidence: 84, theme2_6: "Mobile & UX Improvements", theme2_6_confidence: 83, theme2_3: "Feature Requests", theme2_3_confidence: 88 },
      { user: "AI User 4", theme2_9: "Enterprise Integration Needs", theme2_9_confidence: 90, theme2_6: "Collaboration & Integration", theme2_6_confidence: 89, theme2_3: "Integration Needs", theme2_3_confidence: 91 },
      { user: "AI User 5", theme2_9: "Data Export Requirements", theme2_9_confidence: 81, theme2_6: "Export & Analytics", theme2_6_confidence: 80, theme2_3: "Integration Needs", theme2_3_confidence: 82 },
      { user: "AI User 6", theme2_9: "Compliance & Certification Gaps", theme2_9_confidence: 88, theme2_6: "Security & Compliance", theme2_6_confidence: 87, theme2_3: "Performance & Security", theme2_3_confidence: 89 },
      { user: "AI User 7", theme2_9: "User Onboarding Friction", theme2_9_confidence: 79, theme2_6: "Onboarding Experience", theme2_6_confidence: 78, theme2_3: "Feature Requests", theme2_3_confidence: 80 },
    ],
  },

  // ── Final themes (consumed by SimTheme UI — Theme2_3 level) ──
  themes: [
    {
      id: "t1",
      name: "Feature Requests",
      confidence: 0.91,
      count: 3,
      color: "#22C55E",
    },
    {
      id: "t2",
      name: "Performance & Security",
      confidence: 0.87,
      count: 2,
      color: "#EF4444",
    },
    {
      id: "t3",
      name: "Integration Needs",
      confidence: 0.84,
      count: 2,
      color: "#3B82F6",
    },
  ],
} as const;
