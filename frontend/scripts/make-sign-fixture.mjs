// make-sign-fixture.mjs — a synthetic 2-page promissory note (placeholder names) for the live run.
import fs from 'fs';
import { buildDocPdf, promissoryNote } from '../lib/doc-pdf.ts';
const { spec } = promissoryNote({ lender: 'Ada Lender', borrower: 'Ben Borrower', principal: 11049, apr: 11.35, months: 42, firstPayment: '2026-10-01', method: 'Venmo / Zelle / ACH: ______________________' });
const bytes = await buildDocPdf(spec);
fs.mkdirSync('tests/fixtures', { recursive: true });
fs.writeFileSync('tests/fixtures/sign-sample.pdf', bytes);
console.log('tests/fixtures/sign-sample.pdf', bytes.length, 'bytes');
