interface Env { DB: D1Database }

type Msg = { id:number; from_name:string; to_name:string|null; content:string; created_at:number; read_by:string }

const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comms Hub</title><style>
:root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#000;color:#eee;font:14px/1.35 system-ui,sans-serif;height:100dvh;display:flex;flex-direction:column}
header{padding:10px 12px;border-bottom:1px solid #222;display:flex;justify-content:space-between;align-items:center}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
#status{font-size:12px;color:#aaa;display:flex;gap:6px;align-items:center}.dot{width:9px;height:9px;border-radius:50%;background:#f66}.ok{background:#3f6}.stale{background:#fb3}
#log{flex:1;overflow:auto;padding:10px}.m{margin:0 0 8px;white-space:pre-wrap}.t{color:#999;margin-right:7px}.h{font-weight:700}
form{position:sticky;bottom:0;background:#060606;border-top:1px solid #222;padding:8px;display:grid;gap:7px}
.row{display:flex;gap:8px}select,input,textarea,button{background:#111;color:#eee;border:1px solid #333;border-radius:6px;padding:8px}textarea{width:100%;min-height:72px;resize:vertical}button{min-width:78px}
@media (max-width:640px){.row{flex-wrap:wrap}select,input,button{flex:1}}
</style></head><body>
<header><div><b>Comms Hub</b></div><div id="status"><span id="dot" class="dot"></span><span id="stat">connecting…</span></div></header>
<div id="log" class="mono"></div>
<form id="f"><div class="row"><select id="to"><option>All</option></select><input id="from" value="David" placeholder="From"><button>Send</button></div><textarea id="content" placeholder="Message"></textarea></form>
<script>
const logEl=document.getElementById('log'),toEl=document.getElementById('to'),fromEl=document.getElementById('from'),contentEl=document.getElementById('content'),dot=document.getElementById('dot'),stat=document.getElementById('stat');
let lastSeen=0,lastOk=0,first=true,audioCtx;
const atBottom=()=>logEl.scrollTop+logEl.clientHeight>=logEl.scrollHeight-20;
const fmt=t=>new Date(t).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
function ding(){audioCtx=audioCtx||new (window.AudioContext||window.webkitAudioContext)();const now=audioCtx.currentTime,o=audioCtx.createOscillator(),o2=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=440;o2.frequency.value=660;o.type=o2.type='sine';g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(0.07,now+.02);g.gain.exponentialRampToValueAtTime(0.0001,now+.15);o.connect(g);o2.connect(g);g.connect(audioCtx.destination);o.start(now);o2.start(now);o.stop(now+.16);o2.stop(now+.16)}
function msg(m){const d=document.createElement('div');d.className='m';const t=document.createElement('span');t.className='t';t.textContent='['+fmt(m.created_at)+']';const h=document.createElement('span');h.className='h';h.textContent=m.from_name+(m.to_name?' → '+m.to_name:'');const c=document.createElement('div');c.textContent=m.content;d.append(t,h,c);logEl.appendChild(d)}
async function refreshParticipants(){const r=await fetch('/participants');if(!r.ok)return;const names=await r.json();const keep=toEl.value;toEl.innerHTML='<option>All</option>';for(const n of names){const o=document.createElement('option');o.textContent=n;toEl.appendChild(o)};toEl.value=[...toEl.options].some(o=>o.value===keep)?keep:'All'}
async function poll(){try{const r=await fetch('/read?since='+lastSeen);if(!r.ok)throw new Error();const ms=await r.json();const stick=atBottom();for(const m of ms){msg(m);if(m.created_at>lastSeen)lastSeen=m.created_at}if(!first&&ms.length)ding();if(stick||first)logEl.scrollTop=logEl.scrollHeight;first=false;lastOk=Date.now();dot.className='dot ok';stat.textContent='ok '+new Date(lastOk).toLocaleTimeString()}catch{dot.className='dot';stat.textContent='error '+new Date().toLocaleTimeString()}}
setInterval(()=>{if(lastOk&&Date.now()-lastOk>10000){dot.className='dot stale';stat.textContent='stale '+new Date(lastOk).toLocaleTimeString()}},1000);
document.getElementById('f').onsubmit=async e=>{e.preventDefault();const from=fromEl.value.trim(),content=contentEl.value.trim(),to=toEl.value==='All'?null:toEl.value;if(!from||!content)return;const r=await fetch('/post',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({from,to,content})});if(r.ok)contentEl.value='';};
contentEl.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')document.getElementById('f').requestSubmit()});
poll();refreshParticipants();setInterval(poll,3000);setInterval(refreshParticipants,30000);
</script></body></html>`;

const json = (x: unknown, status = 200) => new Response(JSON.stringify(x), { status, headers: { 'content-type': 'application/json' } });

export default {
  async fetch(req: Request, env: Env) {
    const u = new URL(req.url);
    if (u.pathname === '/') return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
    if (u.pathname === '/post' && req.method === 'POST') {
      let b: any; try { b = await req.json(); } catch { return json({ ok:false, error:'bad json' }, 400); }
      const from = typeof b?.from === 'string' ? b.from.trim() : '';
      const content = typeof b?.content === 'string' ? b.content.trim() : '';
      const to = b?.to === null ? null : typeof b?.to === 'string' ? b.to.trim() : undefined;
      if (!from || !content || to === undefined) return json({ ok:false, error:'invalid body' }, 400);
      const r = await env.DB.prepare('INSERT INTO messages(from_name,to_name,content,created_at,read_by) VALUES(?1,?2,?3,?4,\'\')').bind(from, to || null, content, Date.now()).run();
      return json({ ok: true, id: r.meta.last_row_id });
    }
    if (u.pathname === '/read' && req.method === 'GET') {
      const since = Number(u.searchParams.get('since')); const s = Number.isFinite(since) ? since : 0;
      const r = await env.DB.prepare('SELECT id,from_name,to_name,content,created_at,read_by FROM messages WHERE created_at>?1 ORDER BY created_at ASC').bind(s).all<Msg>();
      return json(r.results || []);
    }
    if (u.pathname === '/unread' && req.method === 'GET') {
      const as = (u.searchParams.get('as') || '').trim(); if (!as) return json({ ok:false, error:'missing as' }, 400);
      const like = `%,${as},%`;
      const r = await env.DB.prepare('SELECT id,from_name,to_name,content,created_at,read_by FROM messages WHERE (to_name IS NULL OR to_name=?1) AND read_by NOT LIKE ?2 ORDER BY created_at ASC').bind(as, like).all<Msg>();
      for (const m of r.results || []) {
        const next = (m.read_by || '') + `,${as},`;
        await env.DB.prepare('UPDATE messages SET read_by=?1 WHERE id=?2').bind(next, m.id).run();
      }
      return json(r.results || []);
    }
    if (u.pathname === '/participants' && req.method === 'GET') {
      const r = await env.DB.prepare('SELECT DISTINCT from_name FROM messages ORDER BY from_name').all<{from_name:string}>();
      return json((r.results || []).map(x => x.from_name));
    }
    return new Response('Not found', { status: 404 });
  }
};
