# POF 2828 — Unified Dashboard PWA
## Physics of Faith | David Lowe | April 2026

---

## What This Is
All-in-one PWA dashboard: Clipboard (with AI predictions), TTS Engine, Prompts, Notes, Research, Calendar, DeepCrawl, SearXNG search. Syncs across 3 laptops + 2 phones via Cloudflare D1.

## Stack
- **Frontend:** Vite + React + TypeScript + Tailwind
- **Local Backend:** `server/sync_server.py` (port 3456) — SQLite, clipboard monitor, REST API
- **AI Layer:** Bill (BIL) on port 8420 — behavioral intelligence, clipboard predictions
- **Cloud Backend:** Cloudflare Worker + D1 (clipsync-api.davidokc28.workers.dev)

## Quick Start

### One-shot (Windows)
```bat
install.bat
```
Checks Python/Node/AutoHotkey, runs `npm install` + `npm run build`, seeds
`ai-hub\config\settings.ini`, installs optional Python deps, and writes
`start_pof.bat` / `stop_pof.bat` launchers. Prompts you (y/N) to add a
Startup shortcut so the whole stack comes up at login.

### Manual
```bash
# Install frontend deps
npm install

# Start local sync server (clipboard monitor + API)
cd server && python sync_server.py

# Start Bill (behavioral intelligence) — optional
cd D:\BIL\behavioral-intelligence-layer-OBS-Plugin-Final-Claude
python -m bil.bil_server

# Dev mode
npm run dev

# Build + Deploy
npm run build
npx wrangler pages deploy dist
```

## DO NOT TOUCH
- **TTS Engine** (`src/views/TTSView.tsx`) — it works, leave it alone
- **Port numbers** — 3456 (sync server), 8420 (Bill)
- **Clipboard monitor logic** in sync_server.py

## Build Spec
See `PWA_BUILD_SPEC.md` for full consolidation instructions including:
- Cloudflare D1 sync architecture
- Multi-device support (3 laptops + 2 phones)
- DeepCrawl GUI + SearXNG embedding ✅
- Bill AI prediction integration ✅
- Separately-installable PWAs (Clipboard, TTS, Prompts, Research, Links) talking to the main Cloudflare app

## Views
| View | Status | Notes |
|------|--------|-------|
| Clipboard | ✅ Working | Narrowed to 300px + Bill predictions in AI tab |
| TTS | ✅ Working | DO NOT TOUCH |
| Prompts | ✅ Working | |
| Notes | ✅ Working | |
| Calendar | ✅ Working | |
| AI Hub | ✅ Working | Bill wired at `/bil/clipboard/predict` (Clipboard AI tab) |
| Research | 🔧 Partial | |
| DeepCrawl | ✅ Working | Embeds `deepcrawl-gui.pages.dev` |
| Search | ✅ Working | Embeds `search.dlowehomelab.com` |

## API Endpoints (Local — port 3456)
- `/api/clips` — CRUD + auto-capture from Windows clipboard
- `/api/notes` — CRUD
- `/api/bookmarks` — CRUD
- `/api/prompts` — CRUD
- `/api/tasks` — CRUD
- `/api/projects` — CRUD

## Bill Endpoints (port 8420)
- `POST /bil/web` — learn from browser behavior
- `POST /bil/clipboard` — learn from clipboard events
- `POST /bil/rank` — re-rank search results
- `GET /bil/clipboard/predict` — get clipboard predictions
- `GET /bil/status` — model stats
