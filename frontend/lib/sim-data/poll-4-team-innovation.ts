/**
 * SIM Data: Poll 4 — Team Innovation Challenge (Static Poll)
 * Per-cube I/O for Moderator and User simulation roles.
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
      },
      {
        user: "AI User 2",
        text: "Async video updates instead of meetings. Record a 2-minute Loom, skip the 30-minute meeting. Respects time zones and focus time.",
        delayMs: 4500,
        theme: "process",
      },
      {
        user: "AI User 3",
        text: "Cross-functional rotation programs where engineers spend a week with design, designers with product, etc. Builds empathy and breaks silos.",
        delayMs: 7000,
        theme: "culture",
      },
      {
        user: "AI User 4",
        text: "AI pair programming and code review assistants that learn team patterns. Reduces review bottlenecks and catches issues earlier.",
        delayMs: 9500,
        theme: "tools",
      },
      {
        user: "AI User 5",
        text: "Weekly innovation time — 4 hours dedicated to experiments, prototypes, and learning. Google's 20% time but structured and accountable.",
        delayMs: 12000,
        theme: "process",
      },
      {
        user: "AI User 6",
        text: "Better knowledge management. A searchable wiki with AI-powered answers to 'how do we do X?' would save hours of Slack searching.",
        delayMs: 14500,
        theme: "tools",
      },
      {
        user: "AI User 7",
        text: "Retrospectives need innovation too. Use anonymous sentiment analysis to surface issues people won't say in meetings.",
        delayMs: 17000,
        theme: "culture",
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
