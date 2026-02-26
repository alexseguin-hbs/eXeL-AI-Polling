/**
 * SIM Data: Poll 2 — Q1 Strategy Alignment (Live Interactive)
 * Per-cube I/O for Moderator and User simulation roles.
 */

export const POLL_2 = {
  sessionId: "b2c3d4e5-f6a7-8901-bcde-222222222222",
  title: "Q1 Strategy Alignment",
  pollingMode: "live_interactive" as const,
  questions: [
    {
      text: "What should be our top strategic priority for Q1?",
      id: "q1-222222",
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
      joinCode: "DEMO2024",
      tokensOnJoin: { si: 1, ai: 5, hi: 0 },
    },
  },

  cube2: {
    aiResponses: [
      {
        user: "AI User 1",
        text: "Revenue growth should be priority #1. We need to close enterprise deals and expand our ARR by at least 40% this quarter.",
        delayMs: 2000,
        theme: "growth",
      },
      {
        user: "AI User 2",
        text: "Customer retention is more important than acquisition. Our churn rate is 8% monthly — fixing that doubles LTV without new spend.",
        delayMs: 4500,
        theme: "retention",
      },
      {
        user: "AI User 3",
        text: "We should invest in team building and culture. Burnout is high after the product push. Sustainable pace means sustainable growth.",
        delayMs: 7000,
        theme: "culture",
      },
      {
        user: "AI User 4",
        text: "Market expansion into LATAM and Europe should be the focus. Our product is mature enough — we need new geographies for growth.",
        delayMs: 9500,
        theme: "growth",
      },
      {
        user: "AI User 5",
        text: "Technical debt is slowing us down. Every new feature takes 2x longer because of shortcuts from last year. Q1 should be cleanup.",
        delayMs: 12000,
        theme: "culture",
      },
      {
        user: "AI User 6",
        text: "Strategic partnerships with complementary products would accelerate growth without proportional headcount increase.",
        delayMs: 14500,
        theme: "growth",
      },
      {
        user: "AI User 7",
        text: "Customer success and support need investment. Happy customers expand their usage — that's the most efficient growth lever.",
        delayMs: 17000,
        theme: "retention",
      },
    ],
  },

  cube3: {
    voiceTranscript: {
      text: "I believe our top priority should be reducing customer churn because retaining existing customers is more cost-effective than acquiring new ones.",
      confidence: 0.92,
      provider: "whisper" as const,
    },
  },

  themes: [
    {
      id: "t1",
      name: "Revenue & Growth",
      confidence: 0.93,
      count: 3,
      color: "#22C55E",
    },
    {
      id: "t2",
      name: "Customer Retention",
      confidence: 0.89,
      count: 2,
      color: "#F59E0B",
    },
    {
      id: "t3",
      name: "Team & Technical Health",
      confidence: 0.86,
      count: 2,
      color: "#8B5CF6",
    },
  ],
} as const;
