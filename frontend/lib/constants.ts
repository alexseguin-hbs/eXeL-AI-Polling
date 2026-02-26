// Auth0 configuration — public values (not secrets, exposed in browser)
export const AUTH0_DOMAIN =
  process.env.NEXT_PUBLIC_AUTH0_DOMAIN || "exel-ai-polling.us.auth0.com";
export const AUTH0_CLIENT_ID =
  process.env.NEXT_PUBLIC_AUTH0_CLIENT_ID || "H8wuT6P2nfm87bvbRjaegoOliLyhPw4K";
export const AUTH0_AUDIENCE =
  process.env.NEXT_PUBLIC_AUTH0_AUDIENCE || "";
export const AUTH0_REDIRECT_URI =
  typeof window !== "undefined"
    ? `${window.location.origin}/callback/`
    : "";

// API configuration
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Session types for Moderator dashboard
export const SESSION_TYPES = [
  {
    value: "project_series" as const,
    label: "Project Series",
    description: "Multi-session series scoped to a Project ID, Cube, or CRS",
  },
  {
    value: "multi_question" as const,
    label: "Multi-Question",
    description: "Up to 3 back-to-back questions in one session",
  },
  {
    value: "single_question" as const,
    label: "Single Question",
    description: "Quick poll with a single question",
  },
] as const;

// Supported languages — 33 languages matching backend master table
export const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "fr", name: "French", native: "Fran\u00e7ais" },
  { code: "es", name: "Spanish", native: "Espa\u00f1ol" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "pt", name: "Portuguese", native: "Portugu\u00eas" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "ru", name: "Russian", native: "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" },
  { code: "zh", name: "Chinese", native: "\u4e2d\u6587" },
  { code: "ja", name: "Japanese", native: "\u65e5\u672c\u8a9e" },
  { code: "ko", name: "Korean", native: "\ud55c\uad6d\uc5b4" },
  { code: "ar", name: "Arabic", native: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { code: "hi", name: "Hindi", native: "\u0939\u093f\u0928\u094d\u0926\u0940" },
  { code: "bn", name: "Bengali", native: "\u09ac\u09be\u0982\u09b2\u09be" },
  { code: "pa", name: "Punjabi", native: "\u0a2a\u0a70\u0a1c\u0a3e\u0a2c\u0a40" },
  { code: "th", name: "Thai", native: "\u0e44\u0e17\u0e22" },
  { code: "vi", name: "Vietnamese", native: "Ti\u1ebfng Vi\u1ec7t" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "tr", name: "Turkish", native: "T\u00fcrk\u00e7e" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "uk", name: "Ukrainian", native: "\u0423\u043a\u0440\u0430\u0457\u043d\u0441\u044c\u043a\u0430" },
  { code: "ro", name: "Romanian", native: "Rom\u00e2n\u0103" },
  { code: "el", name: "Greek", native: "\u0395\u03bb\u03bb\u03b7\u03bd\u03b9\u03ba\u03ac" },
  { code: "cs", name: "Czech", native: "\u010ce\u0161tina" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "he", name: "Hebrew", native: "\u05e2\u05d1\u05e8\u05d9\u05ea" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "ne", name: "Nepali", native: "\u0928\u0947\u092a\u093e\u0932\u0940" },
] as const;

// Polling modes for session creation
export const POLLING_MODES = [
  {
    value: "live_interactive" as const,
    label: "Live Interactive",
    description: "Real-time synchronous polling with all participants present",
  },
  {
    value: "static_poll" as const,
    label: "Static Poll",
    description: "Asynchronous polling over a set duration (1-7 days)",
  },
] as const;

export const STATIC_POLL_DURATIONS = [
  { value: 1, label: "1 Day", locked: false },
  { value: 3, label: "3 Days", locked: false },
  { value: 7, label: "7 Days", locked: true },
] as const;

// Timer display modes for static poll countdown
export const TIMER_DISPLAY_MODES = [
  { value: "day" as const, label: "Day Timer" },
  { value: "flex" as const, label: "Flex Timer" },
  { value: "both" as const, label: "Both" },
] as const;

// Session code constraints
export const SESSION_CODE_MAX_LENGTH = 8;

// Polling intervals (ms)
export const PRESENCE_POLL_INTERVAL = 3000;
