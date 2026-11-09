/**
 * Reproducible Node ESM loader for frontend unit tests importing .ts with
 * extensionless relative paths and `@/` aliases (Next path alias).
 */
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function tryFile(abs) {
  if (fs.existsSync(abs) && fs.statSync(abs).isFile()) return abs;
  return null;
}

function resolveCandidates(baseDir, specifier) {
  let target;
  if (specifier.startsWith('@/')) {
    target = path.join(FRONTEND_ROOT, specifier.slice(2));
  } else if (specifier.startsWith('.') || specifier.startsWith('/')) {
    target = path.isAbsolute(specifier) ? specifier : path.resolve(baseDir, specifier);
  } else {
    return null;
  }
  const exts = ['', '.ts', '.tsx', '.js', '.mjs', '.json'];
  for (const e of exts) {
    const hit = tryFile(target + e);
    if (hit) return hit;
  }
  const idx = tryFile(path.join(target, 'index.ts')) || tryFile(path.join(target, 'index.js'));
  return idx;
}

export async function resolve(specifier, context, nextResolve) {
  const parent = context.parentURL ? fileURLToPath(context.parentURL) : process.cwd();
  const baseDir = path.dirname(parent);
  const hit = resolveCandidates(baseDir, specifier);
  if (hit) {
    return { shortCircuit: true, url: pathToFileURL(hit).href };
  }
  return nextResolve(specifier, context);
}
