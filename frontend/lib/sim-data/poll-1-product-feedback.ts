/**
 * SIM Data: Poll 1 — Product Feedback (Live Interactive)
 * Per-cube I/O for Moderator and User simulation roles.
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
      },
      {
        user: "AI User 2",
        text: "Performance optimization should be the priority. Our dashboards take 4+ seconds to load — users are dropping off before seeing results.",
        delayMs: 4500,
        theme: "performance",
      },
      {
        user: "AI User 3",
        text: "We need better mobile support. Over 60% of our users access the platform from phones but the experience is desktop-first.",
        delayMs: 7000,
        theme: "feature",
      },
      {
        user: "AI User 4",
        text: "API integrations with Slack and Teams would unlock enterprise adoption. Most companies won't switch tools — they need it embedded.",
        delayMs: 9500,
        theme: "integration",
      },
      {
        user: "AI User 5",
        text: "Data export and analytics are the gap. Decision-makers need CSV/PDF reports they can share with stakeholders who don't use the platform.",
        delayMs: 12000,
        theme: "feature",
      },
      {
        user: "AI User 6",
        text: "Security certifications (SOC2, GDPR) are blocking enterprise deals. We can't sell to healthcare or finance without compliance.",
        delayMs: 14500,
        theme: "performance",
      },
      {
        user: "AI User 7",
        text: "The onboarding flow needs work. New users get lost after sign-up. An interactive tutorial would reduce time-to-value significantly.",
        delayMs: 17000,
        theme: "integration",
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
