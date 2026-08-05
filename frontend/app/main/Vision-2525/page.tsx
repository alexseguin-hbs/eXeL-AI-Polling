// /main/Vision-2525 — the Vision • 2525 white paper in the app.
// Renders the shared reader so this route and the top-level /Vision-2525 cannot drift apart.
import { Vision2525Reader } from "@/components/vision2525-reader";

export default function MainVision2525Page() {
  return <Vision2525Reader />;
}
