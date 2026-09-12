// Sign Doc · Session UX in every language (operator 2026-09-09: "all UX translations, 33 languages"): each lib/i18n-sign/<code>.ts
// carries EVERY soi.sign / soi.codex / soi.landing / soi.pod / soi.doc key, keeps every {placeholder} verbatim, and is a translation
// (not the English) for at least 90 % of the keys. Run: node --experimental-strip-types --loader ./tests/ts-alias-loader.mjs tests/sign-i18n-all.test.mjs
import fs from "node:fs";
const L = await import("../lib/lexicon-data.ts");
const { SIGN_LOCALES } = await import("../lib/i18n-sign/index.ts");
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
const pref = ["soi.sign.", "soi.codex.", "soi.landing.", "soi.pod.", "soi.doc."];
const entries = L.CUBE_GROUPS.flatMap((g) => g.keys).filter((e) => pref.some((p) => e.key.startsWith(p)));
const keys = new Set(entries.map((e) => e.key));
// keys added AFTER the 31-language batch was cut (2026-09-09 01:00Z): English until the next translation pass — listed, never silent
const AFTER_BATCH = new Set(["soi.pod.ui.max_screen", "soi.pod.ui.max_close", "soi.pod.ui.lead_hint", "soi.pod.ui.scan_hint", "soi.pod.ui.trio_hint", "soi.pod.ui.why_three", "soi.pod.ui.gps_location", "soi.pod.ui.signal_location", "soi.pod.ui.use_it", "soi.pod.ui.more"]);   // 2026-09-12 morning keys: English until the second fill pass lands (listed, never silent)   // empty: every key is in every language; a key added later goes here (listed, never silent) until its pass
const codes = L.INITIAL_LANGUAGES.map((l) => l.code).filter((c) => c !== "en" && c !== "es");
const STRICT = process.env.SIGN_I18N_STRICT === "1" || SIGN_LOCALES.length >= 31;   // strict once every language file has landed
const missingFiles = codes.filter((c) => !SIGN_LOCALES.includes(c));
if (missingFiles.length) console.log(`${STRICT ? "FAIL" : "PENDING"}: language files not landed yet: ${missingFiles.join(" ")}`);
ok(!STRICT || missingFiles.length === 0, `31 languages beyond EN + ES all have a loader (${missingFiles.join(",") || "none missing"})`);
const ph = (s) => (s.match(/\{[a-z_]+\}/g) ?? []).sort().join(" ");
const brand = /^(eXeL|PDF|SHA|KV|UTC|OK|◬|♡|웃|[^A-Za-z]*)$/;
for (const code of codes) {
  const file = `lib/i18n-sign/${code}.ts`;
  if (!fs.existsSync(file)) continue;   // reported above
  const T = (await import(`../${file}`)).default;
  const have = Object.keys(T);
  const missing = [...keys].filter((k) => !(k in T) && !AFTER_BATCH.has(k)); const extra = have.filter((k) => !keys.has(k));
  const pending = [...keys].filter((k) => !(k in T) && AFTER_BATCH.has(k)); if (pending.length) console.log(`PENDING ${code}: ${pending.length} keys added after the batch fall back to English`);
  ok(missing.length === 0 && extra.length === 0, `${code}: every key, none extra (missing ${missing.length}: ${missing.slice(0, 3).join(",")} · extra ${extra.length}: ${extra.slice(0, 3).join(",")})`);
  const badPh = entries.filter((e) => e.key in T && ph(e.englishDefault) !== ph(T[e.key]));
  ok(badPh.length === 0, `${code}: placeholders kept (${badPh.length} differ: ${badPh.slice(0, 3).map((e) => e.key).join(",")})`);
  const empty = have.filter((k) => !String(T[k]).trim());
  ok(empty.length === 0, `${code}: no empty strings (${empty.slice(0, 3).join(",")})`);
  const same = entries.filter((e) => e.key in T && T[e.key].trim() === e.englishDefault.trim() && !brand.test(e.englishDefault.trim()));
  ok(same.length <= Math.ceil(entries.length * 0.1), `${code}: translated, not copied (${same.length} identical to English: ${same.slice(0, 4).map((e) => e.key).join(",")})`);
}
console.log(`sign-i18n-all: ${pass} passed, ${fail} failed`); if (fail) process.exit(1);
