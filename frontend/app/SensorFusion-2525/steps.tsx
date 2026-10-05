import styles from "./sensor-fusion.module.css";

export const TRAIN_STEPS = [
  { id: "capture", n: 1, label: "Capture Images", line: "Record 45–60 second video with the camera." },
  { id: "annotate", n: 2, label: "Annotate Images", line: "Turn the video into pictures and draw the boxes." },
  { id: "upload", n: 3, label: "Upload Images", line: "Review the pictures. A training server is not connected." },
  { id: "develop", n: 4, label: "Develop Models", line: "Training has not started." },
  { id: "download", n: 5, label: "Download ML Files", line: "A finished model is not ready to download." },
  { id: "live", n: 6, label: "Run Live", line: "Pick a model and turn the camera on." },
] as const;

export type TrainStepId = (typeof TRAIN_STEPS)[number]["id"];

const RASTER: Record<TrainStepId, string> = {
  capture: "/sensor-fusion/steps/01-capture.png",
  annotate: "/sensor-fusion/steps/02-annotate.png",
  upload: "/sensor-fusion/steps/03-upload.png",
  develop: "/sensor-fusion/steps/04-develop.png",
  download: "/sensor-fusion/steps/05-download.png",
  live: "/sensor-fusion/steps/06-live.png",
};

export function StepIcon({ id }: { id: TrainStepId }) {
  return <img className={styles.trainIcon} src={RASTER[id]} alt="" />;
}