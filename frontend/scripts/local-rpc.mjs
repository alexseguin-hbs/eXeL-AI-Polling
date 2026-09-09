// local-rpc.mjs — a REAL Postgres (PGlite, WASM) serving migration 036's RPCs over the PostgREST
// shape supabase-js speaks: POST /rest/v1/rpc/<fn> with a JSON object of named parameters.
// Lets the two-phone Sign Doc live run prove the SQL itself, not a mock. Test scaffolding only.
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

let dbPromise = null;
export function db() {
  if (!dbPromise) dbPromise = (async () => {
    const d = new PGlite();
    // This PGlite build ships no pgcrypto; core Postgres has sha256() and gen_random_uuid(), which is
    // all migration 036 needs. Shim the two pgcrypto calls it makes, strip its `create extension`.
    // WHERE the shim lives matters. Hosted Supabase keeps pgcrypto in the `extensions` schema, so an RPC pinned to
    // `search_path = public, pg_temp` cannot see digest() — that is the operator's 42883 (R-CORE law: reproduce his
    // environment, not our theory of it). SIGN_PGCRYPTO_SCHEMA=extensions puts the shim where Supabase puts it, so a run
    // without migration 038 fails exactly as his phone did. Default `public` keeps every existing proof unchanged.
    const cryptoSchema = (process.env.SIGN_PGCRYPTO_SCHEMA || 'public').trim();
    if (cryptoSchema !== 'public') await d.exec(`create schema if not exists ${cryptoSchema};`);
    await d.exec(`create or replace function ${cryptoSchema}.digest(p text, algo text) returns bytea language sql immutable as $$ select sha256(convert_to(p, 'UTF8')) $$;
      create or replace function ${cryptoSchema}.digest(p bytea, algo text) returns bytea language sql immutable as $$ select sha256(p) $$;
      create or replace function ${cryptoSchema}.gen_random_bytes(n int) returns bytea language sql volatile as $$ select decode(replace(gen_random_uuid()::text, '-', ''), 'hex') $$;`);
    await d.exec(`do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select 1 from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
    end $$;`);
    // Supabase keeps `extensions` on the SESSION search_path, so the migrations CREATE cleanly; only the RPCs' own pinned
    // `search_path = public, pg_temp` hides pgcrypto at CALL time. Reproduce both halves, or 036 fails at apply and the
    // operator's actual failure is never exercised.
    if (cryptoSchema !== 'public') await d.exec(`set search_path = public, ${cryptoSchema};`);
    const dir = path.resolve(process.cwd(), '..', 'supabase', 'migrations');
    // SIGN_MIGRATIONS_UPTO reproduces the OPERATOR'S database, not ours (R-CORE law: fix the class, reproduce the environment).
    // e.g. SIGN_MIGRATIONS_UPTO=037 applies 036+037 only — his state on 2026-09-09, where pgcrypto is off the RPCs' search path.
    const upto = (process.env.SIGN_MIGRATIONS_UPTO || '').trim();
    for (const f of fs.readdirSync(dir).filter((f) => /^03[6-9]_sign/.test(f)).filter((f) => !upto || f.slice(0, 3) <= upto).sort()) {   // 036 and every later Sign Doc migration (037 …), in order
      await d.exec(fs.readFileSync(path.join(dir, f), 'utf8').replace(/^create extension if not exists pgcrypto;\s*$/m, ''));
      console.log('local-rpc: applied', f);
    }
    return d;
  })();
  return dbPromise;
}

const sigCache = new Map();
async function signature(d, fn) {
  if (sigCache.has(fn)) return sigCache.get(fn);
  const r = await d.query(`select pg_get_function_identity_arguments(p.oid) as args from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = $1 limit 1`, [fn]);
  if (!r.rows.length) return null;
  const args = r.rows[0].args.split(',').map((s) => s.trim()).filter(Boolean).map((s) => { const [name, ...type] = s.split(/\s+/); return { name, type: type.join(' ') }; });
  sigCache.set(fn, args); return args;
}

/** Handle one PostgREST-style RPC request. Returns {status, body}. */
export async function rpc(fn, params) {
  const d = await db();
  const args = await signature(d, fn);
  if (!args) return { status: 404, body: { message: `function ${fn} not found`, code: 'PGRST202' } };
  const vals = args.map((a) => {
    const v = params?.[a.name];
    if (v === undefined || v === null) return null;
    return /json/.test(a.type) ? JSON.stringify(v) : String(v);
  });
  const sql = `select ${fn}(${args.map((a, i) => `${a.name} := $${i + 1}::${a.type}`).join(', ')}) as r`;
  try {
    const r = await d.query(sql, vals);
    return { status: 200, body: r.rows[0]?.r ?? null };
  } catch (e) {
    const msg = String(e.message || e);
    return { status: 400, body: { message: msg, code: 'P0001', details: null, hint: null } };
  }
}

/** Node http handler for /rest/v1/rpc/<fn>. Returns true when handled. */
export async function handleHttp(req, res) {
  const m = /^\/rest\/v1\/rpc\/([a-z_0-9]+)/.exec(req.url || '');
  if (!m) return false;
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': 'POST, OPTIONS' }); res.end(); return true; }
  let body = ''; for await (const c of req) body += c;
  let params = {}; try { params = body ? JSON.parse(body) : {}; } catch { /* empty */ }
  const out = await rpc(m[1], params);
  res.writeHead(out.status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(out.body));
  console.log(new Date().toISOString().slice(11, 23), 'rpc', m[1], out.status, JSON.stringify(out.body).slice(0, 100));
  return true;
}
