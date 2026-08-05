// /vision-2525/white-paper — the Vision • 2525 document.
//
// A child route of the manifesto at /vision-2525, which is what the hierarchy always
// should have been: the manifesto states the vision, this is the document behind it.
// One lowercase namespace, so there is no case-twin and nothing for webpack to refuse.
//
// Replaces /main/Vision-2525 (deleted) and the two static copies under public/.
import { Vision2525Reader } from "@/components/vision2525-reader";

export default function WhitePaperPage() {
  return <Vision2525Reader />;
}
