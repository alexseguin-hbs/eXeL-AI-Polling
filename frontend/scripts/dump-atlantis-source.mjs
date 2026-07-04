#!/usr/bin/env node
// One-shot dumper: extract ACCORD_SECTIONS_EN from atlantis-accord-data.ts as JSON.
// Uses tsx-free regex extraction since the array is a plain literal.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(
  join(__dirname, "..", "lib", "atlantis-accord-data.ts"),
  "utf8"
);

// Extract the array literal between `ACCORD_SECTIONS_EN: AccordSection[] = [` and the closing `];`
const startMarker = "export const ACCORD_SECTIONS_EN: AccordSection[] = [";
const startIdx = src.indexOf(startMarker);
if (startIdx < 0) throw new Error("ACCORD_SECTIONS_EN not found");

// Walk from start to find the matching closing `];` at depth 0
let depth = 0;
let i = startIdx + startMarker.length - 1; // start at `[`
let end = -1;
for (; i < src.length; i++) {
  const c = src[i];
  if (c === "[") depth++;
  else if (c === "]") {
    depth--;
    if (depth === 0) {
      end = i;
      break;
    }
  }
}
if (end < 0) throw new Error("Could not find end of ACCORD_SECTIONS_EN array");

const arrayLiteral = src.slice(startIdx + startMarker.length - 1, end + 1);

// Eval the literal via Function — safe because we control the source file.
// eslint-disable-next-line no-new-func
const sections = Function(`"use strict";return (${arrayLiteral});`)();

const outPath = "/tmp/atlantis_en.json";
writeFileSync(outPath, JSON.stringify(sections, null, 2));
console.log(`Wrote ${sections.length} sections to ${outPath}`);
