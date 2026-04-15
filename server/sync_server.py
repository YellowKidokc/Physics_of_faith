"""
POF 2828 — Clipboard Sync Server (Desktop Tier)
Port 3456 — Python backend for POF 2828 PWA
Features: Clips CRUD, Notes CRUD, Bookmarks, Clipboard Monitor
"""
import json, os, sqlite3, threading, time, uuid, ctypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from pathlib import Path

PORT = 3456
BASE = Path(__file__).parent
DB_PATH = BASE / "data" / "clipboard.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

# ── Database ──────────────────────────────────
def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    db = get_db()
    db.executescript("""
    CREATE TABLE IF NOT EXISTS clips (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL DEFAULT '',
        title TEXT DEFAULT '',
        category TEXT DEFAULT 'clipboard',
        pinned INTEGER DEFAULT 0,
        starred INTEGER DEFAULT 0,
        deleted INTEGER DEFAULT 0,
        slot INTEGER DEFAULT NULL,
        tags TEXT DEFAULT '[]',
        fields TEXT DEFAULT '[]',
        categories TEXT DEFAULT '[]',
        ts TEXT DEFAULT (datetime('now')),
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT DEFAULT '',
        content TEXT NOT NULL DEFAULT '',
        tags TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL DEFAULT '',
        title TEXT DEFAULT '',
        description TEXT DEFAULT '',
        tags TEXT DEFAULT '[]',
        category TEXT DEFAULT 'general',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        short TEXT NOT NULL DEFAULT '',
        template TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'custom',
        category_label TEXT NOT NULL DEFAULT 'Custom',
        color TEXT NOT NULL DEFAULT '#f59e0b',
        tags TEXT DEFAULT '[]',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL DEFAULT '',
        color TEXT NOT NULL DEFAULT '#5A5F6E',
        created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL DEFAULT '',
        due TEXT NOT NULL DEFAULT '',
        time TEXT NOT NULL DEFAULT '',
        done INTEGER NOT NULL DEFAULT 0,
        priority TEXT NOT NULL DEFAULT '',
        project TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
    );
    """)
    db.commit()
    return db

DB = init_db()
LOCK = threading.Lock()

# ── Helpers ───────────────────────────────────
def new_id():
    return f"c_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"

def row_to_dict(row):
    if row is None:
        return None
    d = dict(row)
    for k in ('tags', 'fields', 'categories'):
        if k in d and isinstance(d[k], str):
            try:
                d[k] = json.loads(d[k])
            except Exception:
                d[k] = []
    for k in ('pinned', 'starred', 'deleted', 'done'):
        if k in d:
            d[k] = bool(d[k])
    return d

# ── Clipboard Monitor ────────────────────────
def clipboard_monitor():
    """Watch Windows clipboard for new text copies, auto-add to DB."""
    user32 = ctypes.windll.user32
    last_text = ""
    while True:
        try:
            if user32.OpenClipboard(0):
                try:
                    handle = user32.GetClipboardData(13)  # CF_UNICODETEXT
                    if handle:
                        data = ctypes.c_wchar_p(handle)
                        text = data.value or ""
                        if text and text != last_text and len(text.strip()) > 0:
                            last_text = text
                            cid = new_id()
                            now = datetime.utcnow().isoformat() + "Z"
                            with LOCK:
                                DB.execute(
                                    """INSERT OR IGNORE INTO clips
                                    (id,content,title,category,pinned,starred,deleted,slot,tags,fields,categories,ts,created_at,updated_at)
                                    VALUES (?,?,'','clipboard',0,0,0,NULL,'[]','[]','[]',?,?,?)""",
                                    (cid, text, now, now, now)
                                )
                                DB.commit()
                finally:
                    user32.CloseClipboard()
        except Exception:
            pass
        time.sleep(1.0)

# ── HTTP Handler ──────────────────────────────
class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass  # quiet

    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def _json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self._cors()
        self.send_header("Content-Length", len(body))
        self.end_headers()
        self.wfile.write(body)

    def _no_content(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if length == 0:
            return {}
        return json.loads(self.rfile.read(length))

    # ── OPTIONS ───────────────────────────────
    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    # ── GET ───────────────────────────────────
    def do_GET(self):
        parsed = urlparse(self.path)
        p = parsed.path
        qs = parse_qs(parsed.query)

        # GET /api/clips
        if p == "/api/clips":
            limit = int(qs.get("limit", [500])[0])
            with LOCK:
                rows = DB.execute(
                    "SELECT * FROM clips WHERE deleted=0 ORDER BY created_at DESC LIMIT ?",
                    (limit,)
                ).fetchall()
            self._json(200, [row_to_dict(r) for r in rows])

        # GET /api/clips/:id
        elif p.startswith("/api/clips/"):
            cid = p.split("/")[-1]
            with LOCK:
                row = DB.execute("SELECT * FROM clips WHERE id=?", (cid,)).fetchone()
            if row:
                self._json(200, row_to_dict(row))
            else:
                self._json(404, {"error": "not found"})

        # GET /api/notes
        elif p == "/api/notes":
            limit = int(qs.get("limit", [500])[0])
            with LOCK:
                rows = DB.execute(
                    "SELECT * FROM notes ORDER BY updated_at DESC LIMIT ?",
                    (limit,)
                ).fetchall()
            self._json(200, [row_to_dict(r) for r in rows])

        # GET /api/notes/:id
        elif p.startswith("/api/notes/"):
            nid = p.split("/")[-1]
            with LOCK:
                row = DB.execute("SELECT * FROM notes WHERE id=?", (nid,)).fetchone()
            if row:
                self._json(200, row_to_dict(row))
            else:
                self._json(404, {"error": "not found"})

        # GET /api/bookmarks
        elif p == "/api/bookmarks":
            with LOCK:
                rows = DB.execute("SELECT * FROM bookmarks ORDER BY created_at DESC").fetchall()
            self._json(200, [row_to_dict(r) for r in rows])

        # GET /api/prompts
        elif p == "/api/prompts":
            with LOCK:
                rows = DB.execute("SELECT * FROM prompts ORDER BY name").fetchall()
            self._json(200, [row_to_dict(r) for r in rows])

        # GET /api/prompts/:id
        elif p.startswith("/api/prompts/"):
            pid = p.split("/")[-1]
            with LOCK:
                row = DB.execute("SELECT * FROM prompts WHERE id=?", (pid,)).fetchone()
            if row:
                self._json(200, row_to_dict(row))
            else:
                self._json(404, {"error": "not found"})

        # GET /api/tasks
        elif p == "/api/tasks":
            with LOCK:
                rows = DB.execute("SELECT * FROM tasks ORDER BY due, time").fetchall()
            self._json(200, [row_to_dict(r) for r in rows])

        # GET /api/tasks/:id
        elif p.startswith("/api/tasks/"):
            tid = p.split("/")[-1]
            with LOCK:
                row = DB.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
            if row:
                self._json(200, row_to_dict(row))
            else:
                self._json(404, {"error": "not found"})

        # GET /api/projects
        elif p == "/api/projects":
            with LOCK:
                rows = DB.execute("SELECT * FROM projects ORDER BY name").fetchall()
            self._json(200, [row_to_dict(r) for r in rows])

        else:
            self._json(404, {"error": "not found"})

    # ── POST ──────────────────────────────────
    def do_POST(self):
        p = self.path.split("?")[0]
        body = self._read_body()

        # POST /api/clips
        if p == "/api/clips":
            cid = body.get("id") or new_id()
            now = datetime.utcnow().isoformat() + "Z"
            with LOCK:
                DB.execute(
                    """INSERT OR REPLACE INTO clips
                    (id,content,title,category,pinned,starred,deleted,slot,tags,fields,categories,ts,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                    (cid, body.get("content", ""), body.get("title", ""),
                     body.get("category", "clipboard"),
                     int(body.get("pinned", False)), int(body.get("starred", False)),
                     int(body.get("deleted", False)), body.get("slot"),
                     json.dumps(body.get("tags", [])), json.dumps(body.get("fields", [])),
                     json.dumps(body.get("categories", [])),
                     body.get("ts", now), now, now))
                DB.commit()
            self._json(201, {"id": cid})

        # POST /api/notes
        elif p == "/api/notes":
            nid = body.get("id") or new_id()
            now = datetime.utcnow().isoformat() + "Z"
            with LOCK:
                DB.execute(
                    """INSERT OR REPLACE INTO notes
                    (id,title,content,tags,created_at,updated_at)
                    VALUES (?,?,?,?,?,?)""",
                    (nid, body.get("title", ""), body.get("content", ""),
                     json.dumps(body.get("tags", [])), now, now))
                DB.commit()
            self._json(201, {"id": nid})

        # POST /api/bookmarks
        elif p == "/api/bookmarks":
            bid = body.get("id") or new_id()
            now = datetime.utcnow().isoformat() + "Z"
            with LOCK:
                DB.execute(
                    """INSERT OR REPLACE INTO bookmarks
                    (id,url,title,description,tags,category,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?)""",
                    (bid, body.get("url", ""), body.get("title", ""),
                     body.get("description", ""), json.dumps(body.get("tags", [])),
                     body.get("category", "general"), now, now))
                DB.commit()
            self._json(201, {"id": bid})

        # POST /api/prompts
        elif p == "/api/prompts":
            pid = body.get("id") or f"p_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
            now = datetime.utcnow().isoformat() + "Z"
            with LOCK:
                DB.execute(
                    """INSERT OR REPLACE INTO prompts
                    (id,name,short,template,category,category_label,color,tags,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (pid, body.get("name", ""), body.get("short", ""),
                     body.get("template", ""), body.get("category", "custom"),
                     body.get("category_label", "Custom"), body.get("color", "#f59e0b"),
                     json.dumps(body.get("tags", [])), now, now))
                DB.commit()
            self._json(201, {"id": pid})

        # POST /api/tasks
        elif p == "/api/tasks":
            tid = body.get("id") or f"t_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
            now = datetime.utcnow().isoformat() + "Z"
            with LOCK:
                DB.execute(
                    """INSERT OR REPLACE INTO tasks
                    (id,title,due,time,done,priority,project,notes,created_at,updated_at)
                    VALUES (?,?,?,?,?,?,?,?,?,?)""",
                    (tid, body.get("title", ""), body.get("due", ""),
                     body.get("time", ""), int(body.get("done", False)),
                     body.get("priority", ""), body.get("project", ""),
                     body.get("notes", ""), now, now))
                DB.commit()
            self._json(201, {"id": tid})

        # POST /api/projects
        elif p == "/api/projects":
            prid = body.get("id") or f"proj_{int(time.time()*1000)}_{uuid.uuid4().hex[:6]}"
            now = datetime.utcnow().isoformat() + "Z"
            with LOCK:
                DB.execute(
                    """INSERT OR REPLACE INTO projects
                    (id,name,color,created_at)
                    VALUES (?,?,?,?)""",
                    (prid, body.get("name", ""), body.get("color", "#5A5F6E"), now))
                DB.commit()
            self._json(201, {"id": prid})

        else:
            self._json(404, {"error": "not found"})

    # ── PUT ───────────────────────────────────
    def do_PUT(self):
        p = self.path.split("?")[0]
        body = self._read_body()

        # PUT /api/clips/:id
        if p.startswith("/api/clips/"):
            cid = p.split("/")[-1]
            now = datetime.utcnow().isoformat() + "Z"
            sets, vals = [], []
            for k in ("content", "title", "category"):
                if k in body:
                    sets.append(f"{k}=?"); vals.append(body[k])
            for k in ("pinned", "starred", "deleted"):
                if k in body:
                    sets.append(f"{k}=?"); vals.append(int(body[k]))
            if "slot" in body:
                sets.append("slot=?"); vals.append(body["slot"])
            for k in ("tags", "fields", "categories"):
                if k in body:
                    sets.append(f"{k}=?")
                    vals.append(json.dumps(body[k]) if isinstance(body[k], list) else body[k])
            sets.append("updated_at=?"); vals.append(now)
            vals.append(cid)
            with LOCK:
                DB.execute(f"UPDATE clips SET {','.join(sets)} WHERE id=?", vals)
                DB.commit()
            self._json(200, {"id": cid})

        # PUT /api/notes/:id
        elif p.startswith("/api/notes/"):
            nid = p.split("/")[-1]
            now = datetime.utcnow().isoformat() + "Z"
            sets, vals = [], []
            for k in ("title", "content"):
                if k in body:
                    sets.append(f"{k}=?"); vals.append(body[k])
            if "tags" in body:
                sets.append("tags=?")
                vals.append(json.dumps(body["tags"]) if isinstance(body["tags"], list) else body["tags"])
            sets.append("updated_at=?"); vals.append(now)
            vals.append(nid)
            with LOCK:
                DB.execute(f"UPDATE notes SET {','.join(sets)} WHERE id=?", vals)
                DB.commit()
            self._json(200, {"id": nid})

        # PUT /api/prompts/:id
        elif p.startswith("/api/prompts/"):
            pid = p.split("/")[-1]
            now = datetime.utcnow().isoformat() + "Z"
            sets, vals = [], []
            for k in ("name", "short", "template", "category", "category_label", "color"):
                if k in body:
                    sets.append(f"{k}=?"); vals.append(body[k])
            if "tags" in body:
                sets.append("tags=?")
                vals.append(json.dumps(body["tags"]) if isinstance(body["tags"], list) else body["tags"])
            sets.append("updated_at=?"); vals.append(now)
            vals.append(pid)
            with LOCK:
                DB.execute(f"UPDATE prompts SET {','.join(sets)} WHERE id=?", vals)
                DB.commit()
            self._json(200, {"id": pid})

        # PUT /api/tasks/:id
        elif p.startswith("/api/tasks/"):
            tid = p.split("/")[-1]
            now = datetime.utcnow().isoformat() + "Z"
            sets, vals = [], []
            for k in ("title", "due", "time", "priority", "project", "notes"):
                if k in body:
                    sets.append(f"{k}=?"); vals.append(body[k])
            if "done" in body:
                sets.append("done=?"); vals.append(int(body["done"]))
            sets.append("updated_at=?"); vals.append(now)
            vals.append(tid)
            with LOCK:
                DB.execute(f"UPDATE tasks SET {','.join(sets)} WHERE id=?", vals)
                DB.commit()
            self._json(200, {"id": tid})

        else:
            self._json(404, {"error": "not found"})

    # ── DELETE ────────────────────────────────
    def do_DELETE(self):
        p = self.path.split("?")[0]

        if p.startswith("/api/clips/"):
            cid = p.split("/")[-1]
            with LOCK:
                DB.execute("DELETE FROM clips WHERE id=?", (cid,))
                DB.commit()
            self._no_content()

        elif p.startswith("/api/notes/"):
            nid = p.split("/")[-1]
            with LOCK:
                DB.execute("DELETE FROM notes WHERE id=?", (nid,))
                DB.commit()
            self._no_content()

        elif p.startswith("/api/bookmarks/"):
            bid = p.split("/")[-1]
            with LOCK:
                DB.execute("DELETE FROM bookmarks WHERE id=?", (bid,))
                DB.commit()
            self._no_content()

        elif p.startswith("/api/prompts/"):
            pid = p.split("/")[-1]
            with LOCK:
                DB.execute("DELETE FROM prompts WHERE id=?", (pid,))
                DB.commit()
            self._no_content()

        elif p.startswith("/api/tasks/"):
            tid = p.split("/")[-1]
            with LOCK:
                DB.execute("DELETE FROM tasks WHERE id=?", (tid,))
                DB.commit()
            self._no_content()

        elif p.startswith("/api/projects/"):
            prid = p.split("/")[-1]
            with LOCK:
                DB.execute("DELETE FROM projects WHERE id=?", (prid,))
                DB.commit()
            self._no_content()

        else:
            self._json(404, {"error": "not found"})

# ── Main ──────────────────────────────────────
if __name__ == "__main__":
    # Start clipboard monitor daemon thread
    clip_thread = threading.Thread(target=clipboard_monitor, daemon=True)
    clip_thread.start()
    print(f"Clipboard monitor started")

    server = HTTPServer(("0.0.0.0", PORT), Handler)
    print(f"POF 2828 Sync Server running on port {PORT}")
    print(f"DB: {DB_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutdown.")
        server.server_close()
