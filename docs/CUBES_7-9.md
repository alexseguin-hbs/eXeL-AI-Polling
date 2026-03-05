# Cubes 7-9: Ranking, Tokens, Reports — Implementation Details

> **Parent doc:** See `CLAUDE.md` for system architecture, inter-cube dependencies, and infrastructure.

---

## Cubes 7, 9: SCAFFOLDED (stubs only)
- Models, schemas, and route stubs exist
- Service implementations pending

---

## Cube 8 — Token Ledger: IMPLEMENTED
- `TokenService`: session tokens query, user balance, disputes
- 웃 rate table: 59 jurisdictions (9 international + 50 US states)
- Rate lookup API: `GET /tokens/rates`, `GET /tokens/rates/lookup`
- Files: `cubes/cube8_tokens/service.py`, `cubes/cube8_tokens/router.py`, `core/hi_rates.py`, `schemas/token.py`, `models/token_ledger.py`
