/**
 * SIM Data: Poll 3 — AI Governance (Live Interactive)
 * Per-cube I/O for Moderator and User simulation roles.
 */

export const POLL_3 = {
  sessionId: "c3d4e5f6-a7b8-9012-cdef-333333333333",
  title: "Collaborative Thoughts on AI Governance",
  pollingMode: "live_interactive" as const,
  questions: [
    {
      text: "How should AI shape collective decision-making?",
      id: "q1-333333",
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
      joinCode: "PAST0001",
      tokensOnJoin: { si: 1, ai: 5, hi: 0 },
    },
  },

  cube2: {
    aiResponses: [
      {
        user: "AI User 1",
        text: "AI can democratize decision-making by processing millions of voices simultaneously, something human-only systems can't achieve at scale.",
        delayMs: 2000,
        theme: "opportunity",
      },
      {
        user: "AI User 2",
        text: "My biggest concern is algorithmic bias in AI governance. If the training data reflects historical biases, the AI will perpetuate inequality.",
        delayMs: 4500,
        theme: "concern",
      },
      {
        user: "AI User 3",
        text: "We should consider a hybrid approach — AI processes data and identifies patterns, but humans make final governance decisions.",
        delayMs: 7000,
        theme: "balanced",
      },
      {
        user: "AI User 4",
        text: "The potential for real-time governance adaptation is huge. Policies can respond to citizen feedback in hours instead of years.",
        delayMs: 9500,
        theme: "opportunity",
      },
      {
        user: "AI User 5",
        text: "Data privacy is non-negotiable. Any AI governance system accessing citizen data needs iron-clad privacy protections and transparency.",
        delayMs: 12000,
        theme: "concern",
      },
      {
        user: "AI User 6",
        text: "AI-assisted polling could bridge the gap between representative and direct democracy by making large-scale participation feasible.",
        delayMs: 14500,
        theme: "opportunity",
      },
      {
        user: "AI User 7",
        text: "Historical precedent shows technology adoption in governance requires gradual trust-building. Start with low-stakes decisions first.",
        delayMs: 17000,
        theme: "balanced",
      },
    ],
  },

  cube3: {
    voiceTranscript: {
      text: "I think AI governance should focus on transparency and explainability so citizens can understand and trust the decision-making process.",
      confidence: 0.91,
      provider: "whisper" as const,
    },
  },

  themes: [
    {
      id: "t1",
      name: "Opportunity & Innovation",
      confidence: 0.92,
      count: 3,
      color: "#22C55E",
    },
    {
      id: "t2",
      name: "Risk & Concerns",
      confidence: 0.88,
      count: 2,
      color: "#EF4444",
    },
    {
      id: "t3",
      name: "Balanced / Hybrid Approach",
      confidence: 0.85,
      count: 2,
      color: "#3B82F6",
    },
  ],
} as const;
