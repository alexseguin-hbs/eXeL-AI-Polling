import { fromLedgerJson, type LedgerInput } from "@/lib/2525-core/revisions";

/** SensorFusion-2525 only. Not the Financial-2525 ledger. */
export const SENSOR_FUSION_LEDGER: LedgerInput = {
  section: "SensorFusion-2525",
  route: "/SensorFusion-2525",
  note: "Append-only. This record is for Sensor Fusion · 2525 and no other surface.",
  entries: [
    {
      rev: 1,
      date: "2026-10-02",
      kind: "ask",
      text: "Sensor Fusion · 2525 is accessible from multiple devices: a Windows PC, an Android phone, an iPhone, a Raspberry Pi, or Ubuntu. The System Operator signs in on the device, then turns the camera on.",
      commit: "5141b16",
    },
    {
      rev: 2,
      date: "2026-10-02",
      kind: "decision",
      text: "The public link is /SensorFusion-2525. /main stays the hub page. The folder is Home/SensorFusion. Windows uses a backslash.",
      commit: "5141b16",
    },
    {
      rev: 3,
      date: "2026-10-02",
      kind: "release",
      text: "The page opens with log in, device choice, SENSOR 1, annotate, and the session colors, including the Atlantis Accords and Vision • 2525. Pictures stay on the device until a trainer is connected.",
      commit: "5141b16",
    },
    {
      rev: 4,
      date: "2026-10-02",
      kind: "release",
      text: "The R-CORE target sits at the bottom of Sensor Fusion · 2525. The first click shows the icon with the word art. The second click opens version history for SensorFusion-2525 only.",
      commit: "",
    },
  ],
};

export const SENSOR_FUSION_RCORE_HISTORY = fromLedgerJson(SENSOR_FUSION_LEDGER);
