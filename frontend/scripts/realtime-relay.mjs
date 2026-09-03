// realtime-relay.mjs — local Supabase-Realtime relay for scripts/pod-live-run.mjs. Speaks the phoenix v2 wire
// (JSON arrays for control, binary kind-3 user-broadcast pushes) and relays broadcasts
// to every OTHER socket joined to the same topic (self:false), exactly like the hosted
// service. Test scaffolding only — never production.
import { WebSocketServer } from 'ws';
import http from 'http';
const server = http.createServer((req, res) => { res.writeHead(200, {'content-type':'application/json'}); res.end('{"ok":true}'); });
const wss = new WebSocketServer({ server });
const topics = new Map();     // topic -> Set<ws>
const log = (...a) => console.log(new Date().toISOString().slice(11, 23), ...a);
wss.on('connection', (ws, req) => {
  ws.topics = new Set();
  log('open', req.url);
  ws.on('message', (data, isBinary) => {
    if (!isBinary) {
      const [join_ref, ref, topic, event, payload] = JSON.parse(data.toString());
      if (event === 'phx_join') { (topics.get(topic) || topics.set(topic, new Set()).get(topic)).add(ws); ws.topics.add(topic); ws.send(JSON.stringify([join_ref, ref, topic, 'phx_reply', { status: 'ok', response: { postgres_changes: [] } }])); log('join', topic); return; }
      if (event === 'heartbeat') { ws.send(JSON.stringify([null, ref, 'phoenix', 'phx_reply', { status: 'ok', response: {} }])); return; }
      if (event === 'phx_leave') { topics.get(topic)?.delete(ws); ws.topics.delete(topic); ws.send(JSON.stringify([join_ref, ref, topic, 'phx_reply', { status: 'ok', response: {} }])); return; }
      if (event === 'access_token') return;
      if (event === 'broadcast') { relay(ws, topic, payload.event, payload.payload); return; }
      log('unhandled', event); return;
    }
    const b = Buffer.from(data); if (b[0] !== 3) { log('binary kind', b[0]); return; }
    const [jl, rl, tl, el, ml, enc] = [b[1], b[2], b[3], b[4], b[5], b[6]]; let o = 7;
    o += jl; o += rl; const topic = b.slice(o, o + tl).toString(); o += tl; const ev = b.slice(o, o + el).toString(); o += el; o += ml;
    const payload = enc === 1 ? JSON.parse(b.slice(o).toString()) : b.slice(o);
    relay(ws, topic, ev, payload);
  });
  ws.on('close', () => { for (const t of ws.topics) topics.get(t)?.delete(ws); });
});
function relay(from, topic, event, payload) {
  const set = topics.get(topic) || new Set(); let n = 0;
  const msg = JSON.stringify([null, null, topic, 'broadcast', { type: 'broadcast', event, payload }]);
  for (const w of set) if (w !== from && w.readyState === 1) { w.send(msg); n++; }
  log('relay', topic, event, JSON.stringify(payload).slice(0, 120), '→', n);
}
server.listen(4999, '127.0.0.1', () => log('relay listening :4999'));
