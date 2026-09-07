/**
 * Create Doc — text → PDF (pdf-lib), plus the promissory-note template with its amortization.
 * Letter, one-inch margins, Helvetica, greedy word-wrap, signature lines at the end. Pure: the
 * same engine builds the test fixture, the operator's cleaned note, and any document typed in
 * /soi-session/create. Money math is done in integer cents.
 */
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export interface DocSpec { title: string; subtitle?: string; header?: string; body: string; signers: { role: string; name: string }[]; footer?: string; table?: TableSpec }
export interface TableSpec { title?: string; head: string[]; rows: string[][]; align?: ("l" | "r")[] }

const PAGE_W = 612, PAGE_H = 792, MARGIN = 72, LINE = 14;

class Writer {
  page!: PDFPage; y = PAGE_H - MARGIN; pages = 0;
  doc: PDFDocument; font: PDFFont; bold: PDFFont; italic: PDFFont; header: string;
  constructor(doc: PDFDocument, font: PDFFont, bold: PDFFont, italic: PDFFont, header: string) {
    this.doc = doc; this.font = font; this.bold = bold; this.italic = italic; this.header = header; this.newPage();
  }
  newPage() {
    this.page = this.doc.addPage([PAGE_W, PAGE_H]); this.pages++; this.y = PAGE_H - MARGIN;
    this.page.drawText(this.header, { x: MARGIN, y: PAGE_H - 40, size: 8, font: this.italic, color: rgb(0.4, 0.4, 0.4) });
    this.page.drawText(`Page ${this.pages}`, { x: PAGE_W - MARGIN - 40, y: PAGE_H - 40, size: 8, font: this.italic, color: rgb(0.4, 0.4, 0.4) });
  }
  need(h: number) { if (this.y - h < MARGIN) this.newPage(); }
  text(s: string, opts: { size?: number; font?: PDFFont; color?: [number, number, number]; gap?: number; x?: number; width?: number } = {}) {
    const size = opts.size ?? 10.5, font = opts.font ?? this.font, width = opts.width ?? PAGE_W - 2 * MARGIN, x = opts.x ?? MARGIN;
    for (const para of s.split(/\n/)) {
      const lines = wrap(para, font, size, width);
      for (const ln of lines) { this.need(size + 4); this.page.drawText(ln, { x, y: this.y - size, size, font, color: rgb(...(opts.color ?? [0.08, 0.08, 0.1])) }); this.y -= size * 1.35; }
    }
    this.y -= opts.gap ?? 6;
  }
  heading(s: string) { this.need(30); this.y -= 6; this.text(s, { size: 12, font: this.bold, color: [0.1, 0.25, 0.45], gap: 2 }); }
  table(t: TableSpec) {
    const cols = t.head.length, width = PAGE_W - 2 * MARGIN, cw = width / cols, size = 8.5, rowH = 13;
    const drawRow = (cells: string[], bold: boolean, fill?: [number, number, number]) => {
      this.need(rowH + 2);
      if (fill) this.page.drawRectangle({ x: MARGIN, y: this.y - rowH, width, height: rowH, color: rgb(...fill) });
      cells.forEach((c, i) => {
        const f = bold ? this.bold : this.font; const tw = f.widthOfTextAtSize(c, size);
        const right = (t.align?.[i] ?? (i === 0 ? "l" : "r")) === "r";
        this.page.drawText(c, { x: MARGIN + i * cw + (right ? cw - tw - 4 : 4), y: this.y - rowH + 3.5, size, font: f, color: bold ? rgb(1, 1, 1) : rgb(0.1, 0.1, 0.1) });
      });
      this.y -= rowH;
    };
    if (t.title) this.heading(t.title);
    drawRow(t.head, true, [0.12, 0.3, 0.5]);
    t.rows.forEach((r, i) => drawRow(r, false, i % 2 ? [0.95, 0.96, 0.98] : undefined));
    this.y -= 8;
  }
  signatures(signers: { role: string; name: string }[]) {
    this.need(80); this.y -= 10;
    const cw = (PAGE_W - 2 * MARGIN) / Math.min(signers.length, 2);
    for (let i = 0; i < signers.length; i += 2) {
      const row = signers.slice(i, i + 2); this.need(70);
      row.forEach((s, j) => {
        const x = MARGIN + j * cw;
        this.page.drawText(s.role, { x, y: this.y - 10, size: 10, font: this.font });
        this.page.drawLine({ start: { x, y: this.y - 40 }, end: { x: x + cw - 30, y: this.y - 40 }, thickness: 0.7, color: rgb(0.2, 0.2, 0.2) });
        this.page.drawText(s.name, { x, y: this.y - 54, size: 10, font: this.font });
        this.page.drawText("Date: ____________________", { x, y: this.y - 68, size: 10, font: this.font });
      });
      this.y -= 84;
    }
  }
}

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const words = text.split(/\s+/).filter(Boolean); if (!words.length) return [""];
  const out: string[] = []; let cur = "";
  for (const w of words) {
    const cand = cur ? cur + " " + w : w;
    if (font.widthOfTextAtSize(cand, size) <= width) cur = cand; else { if (cur) out.push(cur); cur = w; }
  }
  if (cur) out.push(cur); return out;
}

export async function buildDocPdf(spec: DocSpec): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(spec.title); doc.setProducer("eXeL AI Polling — Create Doc");
  const font = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold), italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const w = new Writer(doc, font, bold, italic, spec.header ?? spec.title);
  w.y -= 10; w.text(spec.title, { size: 18, font: bold, color: [0.1, 0.25, 0.45], gap: 2 });
  if (spec.subtitle) w.text(spec.subtitle, { size: 10, font: italic, color: [0.35, 0.35, 0.4], gap: 8 });
  w.page.drawLine({ start: { x: MARGIN, y: w.y }, end: { x: PAGE_W - MARGIN, y: w.y }, thickness: 0.8, color: rgb(0.12, 0.3, 0.5) }); w.y -= 12;
  for (const block of spec.body.split(/\n\s*\n/)) {
    const m = block.match(/^##\s+(.*)$/m);
    if (m) { w.heading(m[1]); const rest = block.replace(/^##.*$/m, "").trim(); if (rest) w.text(rest); }
    else w.text(block.trim());
  }
  if (spec.table) w.table(spec.table);
  if (spec.signers.length) w.signatures(spec.signers);
  if (spec.footer) { w.need(30); w.y -= 6; w.text(spec.footer, { size: 8, font: italic, color: [0.4, 0.4, 0.4] }); }
  return doc.save({ useObjectStreams: false });
}

/* ── money ─────────────────────────────────────────────────────────────────── */
export interface AmortRow { n: number; date: string; begin: number; payment: number; interest: number; principal: number; end: number }
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Level payment for `principal` at `apr` (percent) over `months`, rounded to cents. */
export function solvePayment(principal: number, apr: number, months: number): number {
  const i = apr / 100 / 12; if (i === 0) return r2(principal / months);
  return r2((principal * i) / (1 - Math.pow(1 + i, -months)));
}

/**
 * Schedule: interest = beginning balance × APR ÷ 12, rounded to cents; principal = payment − interest.
 * The LAST row keeps the level payment exactly (no odd last amount): its principal is the remaining
 * balance and its interest absorbs the cent-rounding residual of the whole schedule — that residual
 * is a few cents and is stated in the footer, never hidden. (The operator's source table fudged row 1
 * instead; a stated residual in the last row is the honest form of the same intent.)
 */
export function amortize(principal: number, apr: number, months: number, payment: number, firstDate: Date): AmortRow[] {
  const rows: AmortRow[] = []; let bal = r2(principal);
  for (let n = 1; n <= months; n++) {
    const d = new Date(Date.UTC(firstDate.getUTCFullYear(), firstDate.getUTCMonth() + n - 1, firstDate.getUTCDate()));
    let interest = r2(bal * apr / 100 / 12);
    let princ = r2(payment - interest);
    if (n === months || princ >= bal) { princ = bal; interest = r2(payment - princ); }
    const end = r2(bal - princ);
    rows.push({ n, date: d.toISOString().slice(0, 10), begin: bal, payment, interest, principal: princ, end });
    bal = end; if (bal <= 0) break;
  }
  return rows;
}

export const usd = (n: number) => "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const longDate = (iso: string) => new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric", timeZone: "UTC" });

export interface NoteFields {
  lender: string; borrower: string; lenderShort?: string; borrowerShort?: string;
  principal: number; apr: number; months: number; payment?: number; firstPayment: string /* YYYY-MM-DD */;
  method?: string; lateFee?: number; lateDays?: number; defaultDays?: number; governingLaw?: string; purpose?: string;
}

/** The promissory-note template: the document text + its amortization table, from eight fields. */
export function promissoryNote(f: NoteFields): { spec: DocSpec; rows: AmortRow[]; payment: number } {
  const payment = f.payment ?? solvePayment(f.principal, f.apr, f.months);
  const rows = amortize(f.principal, f.apr, f.months, payment, new Date(f.firstPayment + "T00:00:00Z"));
  const last = rows[rows.length - 1];
  const totalPaid = r2(rows.reduce((s, r) => s + r.payment, 0)), totalInt = r2(rows.reduce((s, r) => s + r.interest, 0));
  const L = f.lenderShort ?? f.lender.split(" ")[0], B = f.borrowerShort ?? f.borrower.split(" ")[0];
  const body = [
    `## Terms`,
    `Lender: ${f.lender}\nBorrower: ${f.borrower}\nPrincipal: ${usd(f.principal)}\nRate: ${f.apr}% APR\nPayment: ${usd(payment)} per month\nTerm: ${f.months} months\nFirst payment: ${longDate(rows[0].date)}\nLast payment: ${usd(last.payment)} on ${longDate(last.date)}\nTotal of payments: ${usd(totalPaid)}`,
    `## Agreement`,
    (f.purpose ? f.purpose + " " : "") + `${B} will pay ${L} ${usd(payment)} on the same day of each month for ${f.months} months, starting ${longDate(rows[0].date)}, including the final payment on ${longDate(last.date)}. Each payment is applied first to interest, then to principal. ${B} may prepay any amount at any time with no penalty.`,
    `Payments go to ${L} by ${f.method ?? "________________________________"}. A payment more than ${f.lateDays ?? 10} days late adds a ${usd(f.lateFee ?? 25)} late fee. If ${B} is more than ${f.defaultDays ?? 30} days past due, the remaining balance plus accrued interest is due in full. ${f.governingLaw ?? "Texas"} law governs.`,
  ].join("\n\n");
  const table: TableSpec = {
    title: `Amortization — ${usd(f.principal)} · ${f.apr}% APR · ${usd(payment)} × ${rows.length}`,
    head: ["Mo", "Date", "Beginning", "Payment", "Interest", "Principal", "Ending"],
    rows: [...rows.map((r) => [String(r.n), longDate(r.date), usd(r.begin), usd(r.payment), usd(r.interest), usd(r.principal), usd(r.end)]),
      ["", "TOTALS", "", usd(totalPaid), usd(totalInt), usd(f.principal), usd(0)]],
    align: ["l", "l", "r", "r", "r", "r", "r"],
  };
  const spec: DocSpec = {
    title: "PROMISSORY NOTE", subtitle: f.purpose ? undefined : `${f.lender} / ${f.borrower}`,
    header: `${L} / ${B} — Promissory Note`, body, table,
    signers: [{ role: "Lender", name: f.lender }, { role: "Borrower", name: f.borrower }],
    footer: `Interest each month is the beginning balance × APR ÷ 12, rounded to cents; principal is payment minus interest. Every payment is ${usd(payment)}: the last row's interest absorbs the cent-rounding residual of the schedule. Not legal advice.`,
  };
  return { spec, rows, payment };
}
