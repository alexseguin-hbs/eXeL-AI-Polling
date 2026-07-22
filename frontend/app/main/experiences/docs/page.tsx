// Alias route — /main/experiences/docs. Same shared portfolio as /experiences/docs.
import { ExperiencesPortfolio } from "@/components/experiences/experiences-portfolio";

export default function Page() {
  return <ExperiencesPortfolio basePath="/main/experiences" />;
}
