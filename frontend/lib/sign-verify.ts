/**
 * Offline verification of a signed PDF — from the file alone, no backend (Pangu, wave 3). Reads what
 * the stamps recorded (SoISig boxes, SoITxt marks, SoIEnv passes, SoICodex rows), checks that the
 * four accounts agree, that every later pass's timestamp row carries the chain it was signed over,
 * and recomputes the closing chain for a single-file envelope so it can be read against the receipt.
 */
import { signatureBoxes, textBoxes, codexRows, envelopeMarks, countSignatureImages } from "@/lib/pdf-stamp";
import { sha256Hex, shortHash, chainHash } from "@/lib/sign-envelope";

export interface VerifyReport {
  name: string; sha256: string; images: number; boxes: number; texts: number;
  rows: { rowIndex: number; isoDate: string; hash: string }[];
  passes: { token: string; chain: string }[];
  /** chainHash(chain before the last pass, [this file's sha]) — equals the receipt's chain for a one-file envelope */
  chain: string;
  issues: string[];
  ok: boolean;
}

export async function verifySignedPdf(name: string, bytes: Uint8Array): Promise<VerifyReport> {
  const [sha256, images, boxes, texts, rows, passes] = await Promise.all([sha256Hex(bytes), countSignatureImages(bytes), signatureBoxes(bytes), textBoxes(bytes), codexRows(bytes), envelopeMarks(bytes)]);
  const issues: string[] = [];
  if (images === 0) issues.push("no_signatures");
  if (images !== boxes.length) issues.push("images_vs_boxes");
  if (passes.length !== images) issues.push("passes_vs_signatures");
  if (rows.length !== images) issues.push("rows_vs_signatures");
  if (rows.some((r) => r.rowIndex < 0 || !/^\d{4}-\d{2}-\d{2}T/.test(r.isoDate))) issues.push("row_malformed");
  if (passes.length > 1 && new Set(passes.map((p) => p.token)).size !== 1) issues.push("tokens_differ");
  // pass k (k ≥ 1) was signed over the chain after pass k-1; its row's hash is that chain's short form
  for (let k = 1; k < passes.length; k++) {
    const r = rows.find((x) => x.rowIndex === k);
    if (r && r.hash !== shortHash(passes[k].chain)) issues.push(`row_${k}_chain`);
  }
  const chain = passes.length ? await chainHash(passes[passes.length - 1].chain, [sha256]) : "";
  return { name, sha256, images, boxes: boxes.length, texts: texts.length, rows, passes, chain, issues, ok: issues.length === 0 };
}
