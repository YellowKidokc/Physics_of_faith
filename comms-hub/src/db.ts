import type { Env, Message } from './types';

export async function postMessage(env: Env, from: string, to: string | null, content: string) {
  const r = await env.DB.prepare('INSERT INTO messages(from_name,to_name,content,created_at,read_by) VALUES(?1,?2,?3,?4,\'\')')
    .bind(from, to, content, Date.now()).run();
  return Number(r.meta.last_row_id);
}

export async function readSince(env: Env, since: number) {
  const r = await env.DB.prepare('SELECT id,from_name,to_name,content,created_at,read_by FROM messages WHERE created_at>?1 ORDER BY created_at ASC')
    .bind(since).all<Message>();
  return r.results || [];
}

export async function getUnread(env: Env, as: string) {
  const like = `%,${as},%`;
  const r = await env.DB.prepare('SELECT id,from_name,to_name,content,created_at,read_by FROM messages WHERE (to_name IS NULL OR to_name=?1) AND read_by NOT LIKE ?2 ORDER BY created_at ASC')
    .bind(as, like).all<Message>();
  for (const m of r.results || []) {
    const next = m.read_by ? `${m.read_by}${as},` : `,${as},`;
    await env.DB.prepare('UPDATE messages SET read_by=?1 WHERE id=?2').bind(next, m.id).run();
  }
  return r.results || [];
}

export async function listParticipants(env: Env) {
  const r = await env.DB.prepare('SELECT DISTINCT from_name FROM messages ORDER BY from_name').all<{ from_name: string }>();
  return (r.results || []).map((x) => x.from_name);
}
