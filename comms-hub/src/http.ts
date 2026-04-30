import { getUnread, listParticipants, postMessage, readSince } from './db';
import type { Env } from './types';
import { webpage } from './webpage';

const cors = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
  'access-control-allow-headers': 'content-type'
};

const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'content-type': 'application/json', ...cors } });

export async function handleHttp(req: Request, env: Env, u: URL) {
  if (req.method === 'OPTIONS') return new Response('', { headers: cors });
  if (u.pathname === '/') return new Response(webpage, { headers: { 'content-type': 'text/html; charset=utf-8', ...cors } });
  if (u.pathname === '/post' && req.method === 'POST') {
    let b: any; try { b = await req.json(); } catch { return json({ ok: false, error: 'bad json' }, 400); }
    const from = typeof b?.from === 'string' ? b.from.trim() : '';
    const content = typeof b?.content === 'string' ? b.content.trim() : '';
    const to = b?.to === null ? null : typeof b?.to === 'string' ? b.to.trim() : undefined;
    if (!from || !content || to === undefined) return json({ ok: false, error: 'invalid body' }, 400);
    return json({ ok: true, id: await postMessage(env, from, to || null, content) });
  }
  if (u.pathname === '/read' && req.method === 'GET') {
    const raw = Number(u.searchParams.get('since')); const since = Number.isFinite(raw) ? raw : 0;
    return json((await readSince(env, since)).map(({ read_by, ...m }) => m));
  }
  if (u.pathname === '/unread' && req.method === 'GET') {
    const as = (u.searchParams.get('as') || '').trim();
    if (!as) return json({ ok: false, error: 'missing as' }, 400);
    return json((await getUnread(env, as)).map(({ read_by, ...m }) => m));
  }
  if (u.pathname === '/participants' && req.method === 'GET') return json(await listParticipants(env));
  return new Response('Not found', { status: 404, headers: cors });
}
