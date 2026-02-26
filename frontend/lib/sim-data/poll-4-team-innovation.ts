/**
 * SIM Data: Poll 4 — Team Innovation Challenge (Static Poll)
 * Per-cube I/O for Moderator and User simulation roles.
 *
 * Cube 4: Web_Results format with native_language per response
 * Cube 6: Phase A (333/111/33 summaries) + Phase B (Theme01 → Theme2_9/6/3)
 */

export const POLL_4 = {
  sessionId: "d4e5f6a7-b8c9-0123-defg-444444444444",
  title: "Team Innovation Challenge",
  pollingMode: "static_poll" as const,
  staticPollDurationDays: 3,
  questions: [
    {
      text: "What innovative tools or processes could improve our team collaboration?",
      id: "q1-444444",
    },
  ],

  cube1: {
    moderator: {
      stateFlow: [
        "draft",
        "open",
        "polling",
        "theming",
        "visuals",
        "ranking",
        "archived",
      ] as const,
    },
    user: {
      joinCode: "STATIC01",
      tokensOnJoin: { si: 1, ai: 5, hi: 0 },
    },
  },

  cube2: {
    aiResponses: [
      {
        user: "AI User 1",
        text: "Virtual whiteboard tools with AI-powered idea clustering would transform brainstorming. Ideas get organized as they're shared.",
        delayMs: 2000,
        theme: "tools",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 2",
        text: "Actualizaciones de video as\u00edncronas en lugar de reuniones. Graba un Loom de 2 minutos, evita la reuni\u00f3n de 30 minutos. Respeta las zonas horarias y el tiempo de concentraci\u00f3n.",
        delayMs: 4500,
        theme: "process",
        languageCode: "es",
        nativeLanguage: "Spanish",
      },
      {
        user: "AI User 3",
        text: "Cross-functional rotation programs where engineers spend a week with design, designers with product, etc. Builds empathy and breaks silos.",
        delayMs: 7000,
        theme: "culture",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 4",
        text: "KI-gest\u00fctzte Pair-Programming- und Code-Review-Assistenten, die Team-Muster lernen. Reduziert Review-Engp\u00e4sse und findet Probleme fr\u00fcher.",
        delayMs: 9500,
        theme: "tools",
        languageCode: "de",
        nativeLanguage: "German",
      },
      {
        user: "AI User 5",
        text: "Weekly innovation time \u2014 4 hours dedicated to experiments, prototypes, and learning. Google's 20% time but structured and accountable.",
        delayMs: 12000,
        theme: "process",
        languageCode: "en",
        nativeLanguage: "English",
      },
      {
        user: "AI User 6",
        text: "Mejor gesti\u00f3n del conocimiento. Un wiki con respuestas impulsadas por IA a \u0027\u00bfc\u00f3mo hacemos X?\u0027 ahorrar\u00eda horas de b\u00fasqueda en Slack.",
        delayMs: 14500,
        theme: "tools",
        languageCode: "es",
        nativeLanguage: "Spanish",
      },
      {
        user: "AI User 7",
        text: "Retrospectives need innovation too. Use anonymous sentiment analysis to surface issues people won't say in meetings.",
        delayMs: 17000,
        theme: "culture",
        languageCode: "en",
        nativeLanguage: "English",
      },
    ],
  },

  cube3: {
    voiceTranscript: {
      text: "I think AI-powered project management that automatically identifies blockers and suggests solutions would be a game-changer for team productivity.",
      confidence: 0.93,
      provider: "whisper" as const,
    },
  },

  // ── Cube 4: Web_Results format (collected responses) ─────────
  cube4: {
    collectedResponses: [
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 1",
        detailed_results: "Virtual whiteboard tools with AI-powered idea clustering would transform brainstorming. Ideas get organized as they're shared.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 2",
        detailed_results: "Actualizaciones de video as\u00edncronas en lugar de reuniones. Graba un Loom de 2 minutos, evita la reuni\u00f3n de 30 minutos. Respeta las zonas horarias y el tiempo de concentraci\u00f3n.",
        response_language: "Spanish",
        native_language: "es",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 3",
        detailed_results: "Cross-functional rotation programs where engineers spend a week with design, designers with product, etc. Builds empathy and breaks silos.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 4",
        detailed_results: "KI-gest\u00fctzte Pair-Programming- und Code-Review-Assistenten, die Team-Muster lernen. Reduziert Review-Engp\u00e4sse und findet Probleme fr\u00fcher.",
        response_language: "German",
        native_language: "de",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 5",
        detailed_results: "Weekly innovation time \u2014 4 hours dedicated to experiments, prototypes, and learning. Google's 20% time but structured and accountable.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 6",
        detailed_results: "Mejor gesti\u00f3n del conocimiento. Un wiki con respuestas impulsadas por IA a \u0027\u00bfc\u00f3mo hacemos X?\u0027 ahorrar\u00eda horas de b\u00fasqueda en Slack.",
        response_language: "Spanish",
        native_language: "es",
        source: "text",
      },
      {
        q_number: "Q-0001",
        question: "What innovative tools or processes could improve our team collaboration?",
        user: "AI User 7",
        detailed_results: "Retrospectives need innovation too. Use anonymous sentiment analysis to surface issues people won't say in meetings.",
        response_language: "English",
        native_language: "en",
        source: "text",
      },
    ],
    responseCount: { total: 7, text_count: 7, voice_count: 0 },
    languageBreakdown: [
      { language_code: "en", count: 3 },
      { language_code: "es", count: 2 },
      { language_code: "de", count: 1 },
    ],
  },

  // ── Cube 6: AI Theme Pipeline Output ─────────────────────────
  cube6: {
    // Phase A: Live per-response summaries (333/111/33 words)
    summaries: [
      {
        user: "AI User 1",
        summary_333: "Virtual whiteboard tools with AI-powered idea clustering would transform brainstorming sessions. Ideas would be automatically organized as they are shared by team members.",
        summary_111: "AI-powered virtual whiteboards transform brainstorming. Ideas auto-organized as shared.",
        summary_33: "AI whiteboards transform brainstorming. Ideas auto-organized as shared.",
      },
      {
        user: "AI User 2",
        summary_333: "Asynchronous video updates should replace meetings. Recording a 2-minute video eliminates 30-minute meetings while respecting time zones and focus time for distributed teams.",
        summary_111: "Async video updates replace meetings. 2-minute recordings eliminate 30-minute meetings, respecting time zones.",
        summary_33: "Async video replaces meetings. Respects time zones and focus.",
      },
      {
        user: "AI User 3",
        summary_333: "Cross-functional rotation programs where engineers spend time with design and designers with product teams would build empathy across disciplines and break organizational silos.",
        summary_111: "Cross-functional rotation builds empathy and breaks silos. Engineers with design, designers with product.",
        summary_33: "Cross-functional rotation builds empathy and breaks organizational silos.",
      },
      {
        user: "AI User 4",
        summary_333: "AI pair programming and code review assistants that learn team-specific patterns would reduce review bottlenecks and catch issues earlier in the development cycle.",
        summary_111: "AI pair programming assistants learn team patterns. Reduces review bottlenecks, catches issues earlier.",
        summary_33: "AI code review assistants reduce bottlenecks and catch issues earlier.",
      },
      {
        user: "AI User 5",
        summary_333: "Weekly innovation time with 4 hours dedicated to experiments, prototypes, and learning. Structured like Google's 20% time but with accountability and team-level goals.",
        summary_111: "Weekly 4-hour innovation time for experiments and prototypes. Structured like Google's 20% time with accountability.",
        summary_33: "Weekly innovation time: 4 hours for experiments with accountability.",
      },
      {
        user: "AI User 6",
        summary_333: "Better knowledge management through a searchable wiki with AI-powered answers to common team questions would save hours currently spent searching through Slack message history.",
        summary_111: "AI-powered searchable wiki for team knowledge. Saves hours of Slack searching for answers.",
        summary_33: "AI wiki saves hours of Slack searching for team knowledge.",
      },
      {
        user: "AI User 7",
        summary_333: "Retrospective formats need innovation. Anonymous sentiment analysis could surface issues that team members hesitate to raise in face-to-face meetings due to social pressure.",
        summary_111: "Retrospectives need innovation. Anonymous sentiment analysis surfaces issues people won't say in meetings.",
        summary_33: "Anonymous sentiment analysis surfaces retro issues people won't voice.",
      },
    ],
    // Phase B: Theme01 classification
    theme01Classification: [
      { user: "AI User 1", theme01: "Supporting Comments", theme01_confidence: 90 },
      { user: "AI User 2", theme01: "Supporting Comments", theme01_confidence: 86 },
      { user: "AI User 3", theme01: "Neutral Comments", theme01_confidence: 75 },
      { user: "AI User 4", theme01: "Supporting Comments", theme01_confidence: 88 },
      { user: "AI User 5", theme01: "Neutral Comments", theme01_confidence: 72 },
      { user: "AI User 6", theme01: "Supporting Comments", theme01_confidence: 87 },
      { user: "AI User 7", theme01: "Risk & Concerns", theme01_confidence: 68 },
    ],
    theme01Partitions: {
      "Supporting Comments": 4,
      "Risk & Concerns": 1,
      "Neutral Comments": 2,
    },
    marbleGroups: [
      { groupIndex: 0, size: 7, seed: 42 },
    ],
    theme2Hierarchy: {
      theme2_9: [
        { label: "AI-Enhanced Development Tools", confidence: 0.90, partition: "Supporting Comments" },
        { label: "Visual Collaboration Platforms", confidence: 0.88, partition: "Supporting Comments" },
        { label: "Knowledge Management Systems", confidence: 0.87, partition: "Supporting Comments" },
        { label: "Async Communication Methods", confidence: 0.86, partition: "Supporting Comments" },
        { label: "Cross-Team Empathy Building", confidence: 0.82, partition: "Neutral Comments" },
        { label: "Structured Innovation Time", confidence: 0.80, partition: "Neutral Comments" },
        { label: "Anonymous Feedback Mechanisms", confidence: 0.78, partition: "Risk & Concerns" },
      ],
      theme2_6: [
        { label: "AI-Powered Productivity", confidence: 0.89, partition: "Supporting Comments" },
        { label: "Collaborative Workspaces", confidence: 0.87, partition: "Supporting Comments" },
        { label: "Async & Knowledge Sharing", confidence: 0.86, partition: "Supporting Comments" },
        { label: "Cross-Functional Rotation", confidence: 0.82, partition: "Neutral Comments" },
        { label: "Innovation Time Allocation", confidence: 0.80, partition: "Neutral Comments" },
        { label: "Psychological Safety Tools", confidence: 0.78, partition: "Risk & Concerns" },
      ],
      theme2_3: [
        { label: "AI-Powered Tools", confidence: 0.90, partition: "Supporting Comments" },
        { label: "Process Innovation", confidence: 0.87, partition: "Neutral Comments" },
        { label: "Culture & Knowledge", confidence: 0.84, partition: "Risk & Concerns" },
      ],
    },
    themeAssignments: [
      { user: "AI User 1", theme2_9: "Visual Collaboration Platforms", theme2_9_confidence: 89, theme2_6: "Collaborative Workspaces", theme2_6_confidence: 88, theme2_3: "AI-Powered Tools", theme2_3_confidence: 90 },
      { user: "AI User 2", theme2_9: "Async Communication Methods", theme2_9_confidence: 87, theme2_6: "Async & Knowledge Sharing", theme2_6_confidence: 86, theme2_3: "Process Innovation", theme2_3_confidence: 88 },
      { user: "AI User 3", theme2_9: "Cross-Team Empathy Building", theme2_9_confidence: 83, theme2_6: "Cross-Functional Rotation", theme2_6_confidence: 82, theme2_3: "Culture & Knowledge", theme2_3_confidence: 84 },
      { user: "AI User 4", theme2_9: "AI-Enhanced Development Tools", theme2_9_confidence: 91, theme2_6: "AI-Powered Productivity", theme2_6_confidence: 90, theme2_3: "AI-Powered Tools", theme2_3_confidence: 92 },
      { user: "AI User 5", theme2_9: "Structured Innovation Time", theme2_9_confidence: 81, theme2_6: "Innovation Time Allocation", theme2_6_confidence: 80, theme2_3: "Process Innovation", theme2_3_confidence: 82 },
      { user: "AI User 6", theme2_9: "Knowledge Management Systems", theme2_9_confidence: 88, theme2_6: "Async & Knowledge Sharing", theme2_6_confidence: 87, theme2_3: "AI-Powered Tools", theme2_3_confidence: 89 },
      { user: "AI User 7", theme2_9: "Anonymous Feedback Mechanisms", theme2_9_confidence: 79, theme2_6: "Psychological Safety Tools", theme2_6_confidence: 78, theme2_3: "Culture & Knowledge", theme2_3_confidence: 80 },
    ],
  },

  // ── Final themes (consumed by SimTheme UI — Theme2_3 level) ──
  themes: [
    {
      id: "t1",
      name: "AI-Powered Tools",
      confidence: 0.90,
      count: 3,
      color: "#22C55E",
    },
    {
      id: "t2",
      name: "Process Innovation",
      confidence: 0.87,
      count: 2,
      color: "#F59E0B",
    },
    {
      id: "t3",
      name: "Culture & Knowledge",
      confidence: 0.84,
      count: 2,
      color: "#8B5CF6",
    },
  ],
} as const;
