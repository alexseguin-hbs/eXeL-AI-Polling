export const TRAIN_STEPS = [
  { id: "capture", n: 1, label: "Capture Images", line: "Record 45–60 second video with the camera." },
  { id: "annotate", n: 2, label: "Annotate Images", line: "Turn the video into pictures and draw the boxes." },
  { id: "upload", n: 3, label: "Upload Images", line: "Review the pictures. A training server is not connected." },
  { id: "develop", n: 4, label: "Develop Models", line: "Training has not started." },
  { id: "download", n: 5, label: "Download ML Files", line: "A finished model is not ready to download." },
  { id: "live", n: 6, label: "Run Live", line: "Pick a model and turn the camera on." },
] as const;

export type TrainStepId = (typeof TRAIN_STEPS)[number]["id"];

export function StepIcon({ id }: { id: TrainStepId }) {
  const pen = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (id === "capture") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2" y="6" width="14" height="12" rx="2" {...pen} />
        <path d="M16 10l6-3v10l-6-3z" {...pen} />
      </svg>
    );
  }
  if (id === "annotate") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" {...pen} strokeDasharray="2.2 1.6" />
        <path d="M12 8v8M8 12h8" {...pen} />
      </svg>
    );
  }
  if (id === "upload" || id === "download") {
    const up = id === "upload";
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 18h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.5-1.6A3.5 3.5 0 0 0 7 18z" {...pen} />
        <path d={up ? "M12 16V9M9.5 11.5L12 9l2.5 2.5" : "M12 9v7M9.5 13.5L12 16l2.5-2.5"} {...pen} />
      </svg>
    );
  }
  if (id === "develop") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 12a8 8 0 0 1-13 6.3L5 16" {...pen} />
        <path d="M4 12a8 8 0 0 1 13-6.3L19 8" {...pen} />
        <circle cx="12" cy="12" r="2.2" {...pen} />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="8" width="8" height="10" rx="1.2" {...pen} />
      <path d="M5 11h4M14 20v-6M14 14a3 3 0 1 1 0-1" {...pen} />
      <circle cx="17.5" cy="8" r="2" {...pen} />
    </svg>
  );
}
