# PWA CONSOLIDATION BUILD SPEC
## Physics of Faith → Unified Dashboard PWA
### April 20, 2026 | For: Codex / Claude Code / GitHub Copilot

---

## GOAL
Consolidate all POF 2828 tools into ONE PWA that syncs across 3 laptops + 2 phones via Cloudflare D1.

## SOURCE REPO
`D:\GitHub\Physics_of_faith` — this is the base. Vite + React + TypeScript + Tailwind.

## CURRENT VIEWS (already built)
- ClipboardView (slots, history, search, AI tab)
- TTSView (text-to-speech)
- PromptsView (prompt library)
- NotesView
- CalendarView
- AIHubView
- ResearchView

## VIEWS TO ADD

### 1. DeepCrawl View
Embed `https://deepcrawl-gui.pages.dev/` in an iframe OR port the HTML to a React component.
Features: Single page scrape, Spider crawler, SearXNG integration, Bulk Research, AI enhancement toggle.
Source HTML available at: `D:\GitHub\deepcrawl` (check for latest)

### 2. Search View  
Embed `https://search.dlowehomelab.com/` (SearXNG instance) in an iframe.
Should be searchable from within the PWA.

## SYNC ARCHITECTURE

### Local Tier (already exists)
- `server/sync_server.py` runs on each machine (port 3456)
- SQLite DB at `server/data/clipboard.db`
- Clipboard monitor thread watches Windows clipboard via ctypes
- REST API: /api/clips, /api/notes, /api/bookmarks, /api/prompts, /api/tasks, /api/projects

### Cloud Tier (needs building)
- Cloudflare Worker at `clipsync-api.davidokc28.workers.dev` (exists, needs update)
- D1 database for persistent storage
- Same REST API surface as local tier
- Auth: simple bearer token per device (no user accounts needed)

### Sync Logic
- PWA tries local first (port 3456), falls back to Cloudflare
- See `src/lib/api.ts` — API_LOCAL and API_CLOUD constants
- Set API_CLOUD to the Cloudflare Worker URL
- On write: write to local AND push to cloud
- On read: prefer local, merge from cloud on app open
- Conflict resolution: last-write-wins by `updated_at` timestamp
- Device ID: generate once on first launch, store in localStorage

### Multi-Device Support
- 3 laptops (Windows, each running sync_server.py locally)
- 2 phones (PWA only, cloud-only mode — no local server)
- All devices share same D1 database via Cloudflare Worker

## BILL INTEGRATION (AI Tab)

### Bill Server
- Runs on localhost:8420 (same machine as sync_server)
- `/bil/clipboard` — POST clipboard events for learning
- `/bil/clipboard/predict` — GET predictions based on current context
- `/bil/rank` — POST search results for re-ranking

### AI Tab in ClipboardView
- Already has tab='ai' placeholder
- Should call Bill's predict endpoint and show ranked suggestions
- "What you'll probably want next" based on time of day, recent activity, keywords
- Falls back gracefully if Bill server is not running

## EMBEDDED PAGES (iframe approach)

### How to add a new page
Each embedded page gets a sidebar entry and an iframe view:
```tsx
// In Shell.tsx sidebar
{ icon: Search, label: 'Search', view: 'search' }
{ icon: Globe, label: 'DeepCrawl', view: 'deepcrawl' }

// New view component
export function SearchView() {
  return <iframe src="https://search.dlowehomelab.com/" className="w-full h-full border-0" />
}
```

## CLOUDFLARE WORKER API (D1 backend)

### Existing Resources
- Worker: `clipsync-api.davidokc28.workers.dev`
- D1 binding needed (create if not exists)
- Schema: mirror sync_server.py SQLite schema exactly

### Endpoints (same as local)
- GET/POST /api/clips
- GET/POST /api/notes  
- GET/POST /api/bookmarks
- GET/POST /api/prompts
- GET/POST /api/tasks
- GET/POST /api/projects
- PUT /api/clips/:id, etc.
- DELETE /api/clips/:id, etc.
- POST /api/sync — bulk sync endpoint (device sends all changes since last sync)

## BRANDING
- App name: "POF 2828" (shown in header)
- Theme: dark (#050505 background, #d4af37 gold accents, #f59e0b amber)
- Font: monospace headers, Inter body
- No "Physics of Faith" in visible UI — just POF 2828

## PWA MANIFEST
- name: "POF 2828 Dashboard"
- short_name: "POF 2828"  
- display: standalone
- background_color: #050505
- theme_color: #d4af37
- icons: use existing from public/

## DEPLOYMENT
- Build: `npm run build` (Vite)
- Deploy: `npx wrangler pages deploy dist`
- Target: clipsync-clipboard.pages.dev (or new project name)
- Custom domain: TBD

## PRIORITY ORDER
1. Get Cloudflare Worker D1 API working (clone sync_server schema)
2. Wire API_CLOUD in api.ts to the Worker URL  
3. Add sync logic (write-through to cloud)
4. Add DeepCrawl iframe view
5. Add SearXNG search iframe view
6. Add Bill predict endpoint to AI tab
7. PWA manifest + install support
8. Test multi-device sync

## FILES TO READ FIRST
- `src/lib/api.ts` — API layer (local + cloud)
- `src/views/ClipboardView.tsx` — main clipboard UI
- `src/components/Shell.tsx` — sidebar + navigation
- `server/sync_server.py` — local backend (the schema IS the spec)
- `CODEX_BUILD_SPEC.md` — previous build instructions (may be outdated, this file supersedes)

## DO NOT
- Do NOT change the clipboard monitoring logic in sync_server.py
- Do NOT remove any existing views
- Do NOT change the port numbers (3456 local, 8420 Bill)
- Do NOT add user authentication — this is single-user, token-only
- Do NOT use localStorage for data storage — use the API layer only


---

## PWA PANEL ARCHITECTURE (Added April 20, 2026)

### Individual PWA Panels (in `pwa-panels/`)
Each is a standalone HTML file that can be installed as an individual PWA:

| Panel | File | Purpose |
|-------|------|---------|
| Clipboard | clipboard3.html | Clipboard history, slots, search, AI predictions |
| TTS Engine | tts-engine.html | Text-to-speech — DO NOT TOUCH, it works |
| Prompts | prompt_picker.html | Prompt library with categories and shortcuts |
| Research | research.html | Deep research + crawling tools |
| Task/Calendar | task-calendar.html | Task management and calendar |
| Hub | hub.html | Central navigation hub |
| Nexus Dashboard | nexus-dashboard.html | Dashboard view |
| Theophysics Hub | theophysics-hub.html | Theophysics-specific command center |

### Each panel talks to:
- **Local:** sync_server.py on port 3456 (SQLite backend)
- **Cloud:** Cloudflare Worker D1 API (when local unavailable)
- **Bill:** localhost:8420 for AI predictions (clipboard, search ranking)

### PWA Install Requirements
Each panel should be installable as a standalone PWA. The manifest.webmanifest and sw.js already exist in pwa-panels/.

## AI-HUB INTEGRATION (in `ai-hub/`)

### What AI-HUB Does
AutoHotkey v2 system that provides GLOBAL keyboard shortcuts on Windows:
- `Ctrl+Alt+Z` = Prompt Menu (select text first)
- `Ctrl+Space` = Smart Fix (grammar/spelling/coherence)
- `Ctrl+Alt+G` = Show/Hide GUI
- `Ctrl+Alt+A` = Quick AI Chat with selected text
- `Ctrl+Shift+Q` = Save selection as Markdown

### THE CONTRACT: Prompts Must Match
When a prompt is created in the Prompts PWA (prompt_picker.html), it must also be available via AI-HUB hotkey. The source of truth is the prompts API (`/api/prompts`).

**How it works:**
1. User creates prompt in PWA (name: "Summarize", shortcut: "P/sum", template: "...")
2. sync_server stores it in SQLite + pushes to Cloudflare D1
3. AI-HUB reads from `config/prompts.json` (synced from the same API)
4. User types shortcut anywhere on system → AI-HUB fires the prompt

**Build requirement:** Add a sync mechanism so AI-HUB's `config/prompts.json` stays in sync with the `/api/prompts` endpoint. Either:
- AI-HUB polls the API on startup and every 5 minutes
- Or sync_server writes to both SQLite AND the AI-HUB config file on every prompt change

### AI-HUB Files
- `AI-HUB.ahk` — entry point, launches ClipSync Bridge + TTS
- `hub_core.ahk` — main GUI, hotkeys, hotstrings, AI chat (2507 lines)
- `config/prompts.json` — prompt library (must sync with API)
- `config/hotkeys.ini` — keyboard shortcut definitions
- `config/settings.ini` — user preferences
- `modules/` — additional AHK modules

## DO NOT TOUCH
- tts-engine.html — it works
- AI-HUB hotkey bindings (Ctrl+Alt+Z, Ctrl+Space, etc.) — muscle memory
- Port numbers: 3456 (sync), 8420 (Bill)
