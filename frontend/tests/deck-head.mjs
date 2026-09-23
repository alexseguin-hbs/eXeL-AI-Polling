// ONE place says which operator-deck revision is HEAD. Every gate that reads the deck (drone-playable, range-2525,
// sequencer-2525, lobby-2525, drone-deck-qa) imports this, so a revision bump cannot leave one gate proving a dead
// file (fleet lens 9B/12A/12B, 2026-09-19). drone-revisions holds README HEAD and the register's last row to the same
// number, and drone-playable holds public/drone-2525/play.html byte-identical to the carried file.
export const DECK_REV = '138';
export const DECK_FILE = `drone-2525_r.${DECK_REV}.html`;
export const deckUrl = (base) => new URL(`../../docs/drone-2525/operator-deck/${DECK_FILE}`, base);
