// Minimal resolve hook: let bare Node run the app's extensionless relative TS imports.
export async function resolve(spec, ctx, next) {
  try { return await next(spec, ctx); }
  catch (e) {
    if (/^\.{1,2}\//.test(spec) && !/\.[a-z0-9]+$/i.test(spec)) {
      try { return await next(spec + '.ts', ctx); } catch { return await next(spec + '.tsx', ctx); }
    }
    throw e;
  }
}
