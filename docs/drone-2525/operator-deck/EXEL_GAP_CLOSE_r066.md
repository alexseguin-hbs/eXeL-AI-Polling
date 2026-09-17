# Gap close vs eXeL r0.060 review — landed as r.066

Doctrine they reviewed stays r.060. File HEAD is r.066 so we do not pretend 0.061 overwrote history.

| Gap | Status |
|---|---|
| 1 Transport interface | commIn + linkSend. LOCAL tab, LAN WebRTC, BT optional |
| 2 HOST / JOIN | HOST REHEARSAL → room code + WIFI offer box. JOIN pastes offer |
| 3 BT not promised | Feature-detect only |
| 4 REQ/GRANT + envelope | commEnv + seen-set + ACK + SNAPSHOT field |
| 5 1v1–9v9 networked | Still labels. Next: qualify 1v1 two-phone |
| 6 CH0 \|\| 1 | Fixed. chNum() keeps 0 |
| 7 BUILD constant | BUILD.revision everywhere; no 0.058 left |
| 8 decide → ev | decide() emits canonical event |
| 9 Distributed hash UI | Not two-phone MATCH yet |
| 10 7.77 MB ceiling | Budget constant. File ~105 KB |
| 11 Visible COMM | ROOM + PATH + RTT + peers |
| 12 Provenance | SOLO HI-2 vs PEER HI-2 on record |
| 13 Scope | Comms/evidence. Scoring left alone |

Acceptance test (two phones) is the next loop, not claimed done.
