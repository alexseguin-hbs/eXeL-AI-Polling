// Alias route — /main/experiences (operator's original ask). Renders the same shared
// component as the canonical /experiences, with its own base path for correct links.
import { ExperiencesLanding } from "@/components/experiences/experiences-landing";

export default function Page() {
  return <ExperiencesLanding basePath="/main/experiences" />;
}
