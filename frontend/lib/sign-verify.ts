/**
 * Offline verification of a signed PDF — from the file alone, no backend (Pangu, wave 3). Reads what
 * the stamps recorded (SoISig boxes, SoITxt marks, SoIEnv passes, SoICodex rows), checks that the
 * four accounts agree, that every later pass's timestamp row carries the chain it was signed over,
 * and recomputes the closing chain for a single-file envelope so it can be read against the receipt.
 */
import { signatureBoxes, textBoxes, codexRows, envelopeMarks, countSignatureImages, initialledBy, holders } from "@/lib/pdf-stamp";
import { sha256Hex, shortHash, chainHash } from "@/lib/sign-envelope";

export interface VerifyReport {
  /** distinct SoISig images (by object reference — a page inheriting a shared /Resources dict does not double-count) */
  name: string; sha256: string; images: number; boxes: number; texts: number;
  /** signatory rows; `name` when the file recorded it (the `:n<b64url>` suffix, since 2026-09-08) */
  rows: { rowIndex: number; isoDate: string; hash: string; name?: string }[];
  passes: { token: string; chain: string }[];
  /** signatories who initialled every page (SoIInit:<idx> keywords); optional so an empty report literal still types */ initials?: number;
  /** placeholders still recorded for signatories to come (SoIHold) */ holders?: number;
  /** chainHash(chain before the last pass, [this file's sha]) — equals the receipt's chain for a one-file envelope */
  chain: string;
  /** distinct envelope tokens across the passes — 2+ means an offline hand-off (file carried by hand) */
  envelopes: number;
  issues: string[];
  ok: boolean;
}

export async function verifySignedPdf(name: string, bytes: Uint8Array): Promise<VerifyReport> {
  const [sha256, images, boxes, texts, rows, passes, initialled, held] = await Promise.all([sha256Hex(bytes), countSignatureImages(bytes), signatureBoxes(bytes), textBoxes(bytes), codexRows(bytes), envelopeMarks(bytes), initialledBy(bytes), holders(bytes)]);
  const issues: string[] = [];
  if (images === 0) issues.push("no_signatures");
  if (images !== boxes.length) issues.push("images_vs_boxes");
  if (passes.length !== images) issues.push("passes_vs_signatures");
  if (rows.length !== images) issues.push("rows_vs_signatures");
  if (rows.some((r) => r.rowIndex < 0 || !/^\d{4}-\d{2}-\d{2}T/.test(r.isoDate))) issues.push("row_malformed");
  const envelopes = new Set(passes.map((p) => p.token)).size;   // > 1: a partly-signed file carried by hand and re-uploaded (offline hand-off) — a fact, not a fault
  // pass k (k ≥ 1) was signed over the chain after pass k-1; its row's hash is that chain's short form
  for (let k = 1; k < passes.length; k++) {
    const r = rows.find((x) => x.rowIndex === k);
    const genesis = !passes[k].chain || passes[k].chain === "genesis";   // a hand-carried file re-uploaded: a new envelope's first pass has no chain to carry
    if (r && !genesis && r.hash !== shortHash(passes[k].chain)) issues.push(`row_${k}_chain`);
  }
  const chain = passes.length ? await chainHash(passes[passes.length - 1].chain, [sha256]) : "";
  return { name, sha256, images, boxes: boxes.length, texts: texts.length, rows, passes, initials: initialled.length, holders: held.length, chain, envelopes, issues, ok: issues.length === 0 };
}
