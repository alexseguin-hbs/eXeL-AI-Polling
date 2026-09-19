// THE LOBBY + LIGHT-4, HELD TO THE DECK. Two claims, both proven against the carried r.128 rather than asserted:
//   1. INTEROP — the deck's OWN lc4 functions are lifted out of the r.128 HTML and evaluated here; for many
//      team codes they must produce the same alphabet, tokens and round-trips as lib/2525-core/lc4.ts. A token
//      minted on a phone running the deck decodes on a node running the repo, and vice versa.
//   2. THE RULES — rotate refused once authenticated / a second member; roster sorted by peerId; canLaunch in the
//      deck's exact refusal order; a non-host cannot ready up before DIRECT + auth; solo practice is CH0 only.
import fs from 'node:fs';
import { DECK_REV, deckUrl } from './deck-head.mjs';
const R128 = new URL('../../docs/drone-2525/operator-deck/drone-2525_r.128.html', import.meta.url);
import { lc4Seed, lc4Alphabet, lc4Token, lc4Encode, lc4Decode, LC4_CHARS } from '../lib/2525-core/lc4.ts';
import { initLobby, ensureCodes, rotateCodes, markMember, roster, readyCounts, counts, canLaunch, toggleReady, launchSnapshot, roomState, canPracticeAlone, rand6, opaqueSeedId, isCode6, QUALIFIED_MATCH, LOCKED_MATCH } from '../lib/2525-core/lobby.ts';
import { randomIndex, randomDigits } from '../lib/2525-core/random.ts';

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('FAIL:', m); } };

// ── 1 · INTEROP: the deck's own lc4, evaluated ───────────────────────────────────────────────────
const html = fs.readFileSync(deckUrl(import.meta.url), 'utf8');
const lift = (name) => { const m = html.match(new RegExp(`function ${name}\\([^)]*\\)\\{[\\s\\S]*?\\n\\}`)); if (!m) throw new Error(`r.128 lacks ${name}`); return m[0]; };
const deckSrc = ['lc4Seed', 'lc4Rand', 'lc4Alphabet', 'lc4Digits', 'lc4Token', 'lc4Encode', 'lc4Decode'].map(lift).join('\n');
const deck = new Function(`const LC4_CHARS='${LC4_CHARS}';\n${deckSrc}\nreturn {lc4Seed,lc4Alphabet,lc4Token,lc4Encode,lc4Decode};`)();
ok(typeof deck.lc4Alphabet === 'function', 'the deck\'s lc4 functions lift and evaluate');
const CODES = ['000000', '123456', '999999', '250525', '777777', '000001', '654321', '111111', '424242', '360360'];
let agree = 0;
for (const c of CODES) {
  const same = deck.lc4Alphabet(c).join('') === lc4Alphabet(c).join('') && deck.lc4Seed(c) === lc4Seed(c);
  if (same) agree++; else console.log('  DIVERGES at code', c, deck.lc4Alphabet(c).join(''), 'vs', lc4Alphabet(c).join(''));
}
ok(agree === CODES.length, `the repo alphabet matches the deck for ${agree}/${CODES.length} team codes (bit-exact interop)`);
for (const c of ['123456', '000000']) {
  const msg = 'READY BLU 42 SYNC';
  const ours = lc4Encode(msg, c), theirs = deck.lc4Encode(msg, c);
  ok(JSON.stringify(ours) === JSON.stringify(theirs), `encode("${msg}", ${c}) is identical on both sides`);
  ok(deck.lc4Decode(ours, c) === msg && lc4Decode(theirs, c) === msg, `a token from one side decodes on the other (${c})`);
}
ok(lc4Alphabet('123456').join('') !== lc4Alphabet('123457').join(''), 'changing one digit of the secret scrambles the alphabet');
ok(new Set(lc4Alphabet('250525')).size === 36 && lc4Alphabet('250525').slice().sort().join('') === LC4_CHARS, 'the shuffled alphabet is a permutation — nothing lost, nothing doubled');
ok(lc4Token('?', '123456') === null && lc4Encode('A?B', '123456').length === 2, 'characters outside A–Z/0–9 are dropped, never mis-encoded');
ok(lc4Decode(lc4Encode('HELLO WORLD', '654321'), '654321') === 'HELLO WORLD', 'spaces pass through a round-trip');
ok(lc4Decode(lc4Encode('HELLO', '654321'), '000000') !== 'HELLO', 'the wrong secret does not decode the message');

// ── 2 · MINTING through the shared sampler ───────────────────────────────────────────────────────
for (let i = 0; i < 200; i++) { const c = rand6(); if (!isCode6(c) || +c < 100000) { ok(false, `rand6 minted ${c}`); break; } }
ok(true, 'rand6 always mints six digits in 100000..999999 (200 draws)');
ok(/^LC4-B-[0-9A-F]{16}$/.test(opaqueSeedId('BLU')) && /^LC4-R-[0-9A-F]{16}$/.test(opaqueSeedId('RED')), 'seed ids are LC4-B/R- + 16 hex, as the deck mints them');
ok(randomDigits(6).length === 6 && /^\d{6}$/.test(randomDigits(6)), 'randomDigits is six decimal digits');
let hi = 0; for (let i = 0; i < 2000; i++) if (randomIndex(3) === 2) hi++;
ok(hi > 500 && hi < 830, `randomIndex(3) is unbiased (≈1/3 hits: ${hi}/2000)`);
const atl = fs.readFileSync(new URL('../lib/atlantis-package.ts', import.meta.url), 'utf8');
ok(/import \{ randomIndex \} from "@\/lib\/2525-core\/random"/.test(atl) && !/^function randomIndex/m.test(atl), 'atlantis-package reuses the shared sampler instead of its own private copy (one primitive, two consumers)');

// ── 3 · THE RULES, the deck's ────────────────────────────────────────────────────────────────────
const mint = { code: (() => { let i = 0; return () => String(100001 + (i++)); })(), seed: (t) => `LC4-${t[0]}-SEED` };
let s = ensureCodes(initLobby('ROOM01', 'host', { host: true, team: 'BLU' }), mint);
ok(isCode6(s.teamCodes.BLU) && isCode6(s.teamCodes.RED) && s.teamCodes.BLU !== s.teamCodes.RED, 'each team gets its own 6-digit code');
ok(s.seedIds.BLU === 'LC4-B-SEED' && s.seedIds.RED === 'LC4-R-SEED', 'each team gets a seed id');
const s2 = ensureCodes(s, mint);
ok(s2.teamCodes.BLU === s.teamCodes.BLU, 'ensureCodes never replaces a valid code');
s = markMember(s, 'host', 'BLU', false, { auth: true, craft: 'quad', challenge: 0, lane: 0 });
ok(rotateCodes(s, mint).ok === true, 'a lone, unauthenticated host may rotate');
ok(rotateCodes({ ...s, authenticated: true }, mint).note === 'TEAM CODES LOCKED · CREATE NEW ROOM', 'rotate is refused once authenticated');
const two = markMember(s, 'peerB', 'RED', false, { auth: false });
ok(rotateCodes(two, mint).ok === false, 'rotate is refused once a second member is present');
ok(roster(markMember(two, 'aaa', 'RED', true)).map((m) => m.peerId).join(',') === 'aaa,host,peerB', 'the roster is sorted by peerId — identical on every node (it is hashed)');
const DIRECT = { path: 'DIRECT', authenticated: true }, LOCAL = { path: 'LOCAL', authenticated: false };
ok(canLaunch({ ...s, match: LOCKED_MATCH }, DIRECT).note === '9v9 LOCKED', 'canLaunch: 9v9 is locked, first');
ok(canLaunch({ ...s, host: false }, DIRECT).note === 'HOST STARTS', 'canLaunch: only the host starts');
ok(canLaunch({ ...s, match: 3 }, DIRECT).note === 'MULTI-PEER TRANSPORT NOT QUALIFIED', 'canLaunch: 3v3 refused until qualified');
ok(canLaunch(s, LOCAL).note === 'WAIT DIRECT + AUTH', 'canLaunch: needs DIRECT + auth');
ok(canLaunch(s, DIRECT).note === 'WAIT ROSTER', 'canLaunch: needs both teams seated');
let full = markMember(s, 'peerB', 'RED', false, { auth: false });
ok(canLaunch(full, DIRECT).note === 'WAIT TEAM AUTH', 'canLaunch: needs both teams authenticated');
full = markMember(full, 'peerB', 'RED', false, { auth: true });
ok(canLaunch(full, DIRECT).note === 'WAIT BOTH READY', 'canLaunch: needs both teams ready');
full = markMember(markMember(full, 'peerB', 'RED', true, { auth: true }), 'host', 'BLU', true, { auth: true });
ok(canLaunch(full, DIRECT).ok === true && canLaunch(full, DIRECT).note === 'READY', 'canLaunch: READY when 1v1 is seated, authed and ready on DIRECT');
ok(readyCounts(full).BLU.ready === 1 && readyCounts(full).RED.ready === 1 && counts(full).total === 2, 'ready counts per team');
const guest = initLobby('ROOM01', 'host', { host: false, team: 'RED' });
ok(toggleReady(guest, 'peerB', LOCAL, { craft: 'quad', challenge: 0, lane: 0 }).ok === false, 'a guest cannot ready up before DIRECT + auth');
const g2 = toggleReady(guest, 'peerB', DIRECT, { craft: 'quad', challenge: 0, lane: 0 });
ok(g2.ok && g2.state.ready === true && g2.state.members.peerB.ready === true && g2.note === 'RED READY', 'a guest readies up on DIRECT + auth, and the seat records it');
const snap = launchSnapshot(full, { challenge: 0, craft: 'quad' }, 'abc123');
ok(snap.match === 1 && snap.seats.length === 2 && snap.preLaunchHash === 'abc123' && snap.laneClaims.length === 2, 'the launch snapshot carries match, seats, lane claims and the pre-launch hash');
ok(roomState(full).seats[0].peerId === 'host' && roomState(full).phase === 'WAITING', 'room state carries the sorted roster and phase');
ok(canPracticeAlone(0).ok && !canPracticeAlone(1).ok, 'solo practice is CH0 only');
ok(QUALIFIED_MATCH === 1, 'only 1v1 is qualified today; 3v3 and 9v9 wait');

console.log(`\nlobby-2525: ${pass} passed, ${fail} failed · LIGHT-4 bit-exact with r.128 (${agree}/${CODES.length} codes) · the deck\'s room rules, pure · one sampler`);
process.exit(fail ? 1 : 0);
