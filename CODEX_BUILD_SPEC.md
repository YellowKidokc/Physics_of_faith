# POF 2828 Dashboard — Codex Build Spec

## Repo
- **GitHub**: https://github.com/YellowKidokc/pof2828-dashboard
- **Local**: `C:/Users/lowes/Downloads/Kimi_Agent_Unified Search Across Panels/app/`
- **Stack**: Vite + React 19 + TypeScript + shadcn/ui (Radix + Tailwind)
- **State**: `useDashboardStore.ts` hook, localStorage with `pof2828_*` key prefix
- **All types**: `src/types/index.ts` (already has AI types: `AiProvider`, `AiRole`, `ChatTurn`, `AiStreamCallbacks`)
- **Views already defined** in types: `dashboard | clipboard | files | tags | notes | ai | settings | axioms | prompts | research | calendar | custom`

## Available shadcn/ui Components (already installed)
accordion, alert-dialog, alert, avatar, badge, button, button-group, calendar, card, carousel, chart, checkbox, collapsible, command, context-menu, dialog, drawer, dropdown-menu, empty, field, form, hover-card, input, input-group, input-otp, kbd, label, menubar, navigation-menu, pagination, popover, progress, radio-group, resizable, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner (toast), spinner, switch, table, tabs, textarea, toggle, toggle-group, tooltip

## Existing Data Types (all in src/types/index.ts)
```ts
ClipboardItem { id, content, title?, tags[], pinned, slot?, createdAt, updatedAt, source? }
Note { id, title, content, tags[], createdAt, updatedAt, folder? }
Tag { id, name, color, count, items[] }
FileItem { id, name, path, folder, size, createdAt, tags[] }
Bookmark { id, title, url, category, tags[], createdAt }
Task { id, title, done, due?, time?, priority, project?, desc?, alarm?, createdAt, doneAt? }
Project { id, name, color }
Prompt { id, name, short, template, category, categoryLabel, color }
CustomPage { id, title, html, createdAt, updatedAt }
SearchResult { id, type, title, subtitle?, content?, tags[], matchedOn[], score }
```

## Existing AI Types (already in types/index.ts)
```ts
type AiProvider = 'anthropic' | 'openai' | 'ollama'
type AiRole = 'interface' | 'logic' | 'copilot'
type AiRoleRouting = 'shared' | 'split'
interface ChatTurn { role: 'user' | 'assistant'; content: string }
interface AiStreamCallbacks { onToken, onComplete, onError }
```

## Storage Keys (already in useDashboardStore.ts)
```ts
pof2828_clips, pof2828_notes, pof2828_tags, pof2828_files,
pof2828_bookmarks, pof2828_tasks, pof2828_projects, pof2828_summaries,
pof2828_prompts, pof2828_custom_pages, pof2828_settings, pof2828_current_view
```

---

# BUILD TASKS (4 features)

---

## 1. AI Chat Panel

Build a full AI chat panel accessible from the `ai` view in the sidebar.

### Requirements
- **Streaming chat** with token-by-token rendering
- **Multi-provider support**: OpenAI, xAI/Grok (OpenAI-compatible at `https://api.x.ai/v1`), Anthropic, Ollama (local)
- **Provider/model selector** dropdown at top of chat panel (use shadcn Select)
- **API key entry** in Settings view, stored in `localStorage` as `pof2828_ai_keys` (object: `{ openai: string, anthropic: string, xai: string }`)
- **Conversation history** stored in `localStorage` as `pof2828_conversations`
- **Conversation list** sidebar (or drawer) showing past conversations with titles
- **Auto-title** conversations after first exchange (ask the AI to title it, or use first 50 chars)
- **System prompt** configurable per conversation, default: "You are a personal AI assistant integrated into the POF 2828 Dashboard. You have access to the user's clipboard, notes, tasks, bookmarks, and axioms."
- **Prompt library integration**: User can click any prompt from the Prompts panel to inject it into the chat input
- **Context injection**: Button to attach current clipboard items, selected notes, or tasks as context to the message
- **Markdown rendering** in assistant messages (use a lightweight renderer, or just `white-space: pre-wrap` with code block detection)
- **Stop generation** button while streaming

### Architecture
- Direct browser-side API calls (no backend needed for personal use)
- For OpenAI/xAI: `fetch('https://api.openai.com/v1/chat/completions', { stream: true })` or `fetch('https://api.x.ai/v1/chat/completions', { stream: true })`
- For Anthropic: `fetch('https://api.anthropic.com/v1/messages', { stream: true })` — note: requires `anthropic-dangerous-direct-browser-access: true` header
- Parse SSE stream manually or use Vercel AI SDK (`ai` + `@ai-sdk/react` packages) — Vercel AI SDK is preferred if it works without a server
- Store each conversation as: `{ id: string, title: string, messages: ChatTurn[], provider: AiProvider, model: string, systemPrompt: string, createdAt: string, updatedAt: string }`

### UI Layout
- Use the existing `ai` ViewType
- Left sidebar: conversation list (use shadcn ScrollArea)
- Main area: chat messages with user/assistant bubbles (right-aligned user, left-aligned assistant)
- Bottom: input bar with Send button, attachment menu (clips/notes/tasks), prompt picker
- Top bar: provider Select, model Select, settings gear icon

---

## 2. Page Builder (AI-Powered)

The dashboard already has a `CustomPage` type (`{ id, title, html, createdAt, updatedAt }`) and a `custom` view. Extend this so the AI can build pages.

### Requirements
- **AI page generation**: User describes what they want ("build me a kanban board", "make a habit tracker", "create a reading list"), AI generates the full HTML/CSS/JS
- **Page builder UI**:
  - Text input: "Describe the page you want..."
  - "Generate" button that sends the description to the AI with a system prompt instructing it to output a single self-contained HTML document
  - Live preview in an iframe (sandboxed)
  - "Save" button that stores it as a CustomPage
  - "Edit" button to regenerate or manually edit the HTML
- **Template gallery**: Pre-built page templates the user can start from (Kanban, Habit Tracker, Reading List, Pomodoro Timer, Daily Journal)
- **Page management**: List of saved custom pages, rename, delete, duplicate
- **Inter-page communication**: Custom pages rendered in iframes can use `postMessage` to send data back to the dashboard (e.g., a custom page could send a task to the tasks panel)

### System Prompt for Page Builder
```
You are a page builder AI. When the user describes a page, generate a SINGLE self-contained HTML file.
Rules:
- All CSS must be inline in a <style> tag
- All JS must be inline in a <script> tag
- Do not use any external CDN links
- Use modern CSS (grid, flexbox, custom properties)
- Use a dark theme with these colors: bg #09090b, card #1c1c1e, accent #3b82f6, text #fafafa
- Make it responsive
- Output ONLY the HTML, no explanation
```

---

## 3. Comms Dispatcher

A communication hub that routes messages and actions between the dashboard, AI agents, MCP, and external systems.

### Requirements
- **Message bus** in the dashboard store:
  - New storage key: `pof2828_comms`
  - Messages: `{ id: string, from: string, to: string, type: 'task' | 'note' | 'clip' | 'command' | 'chat' | 'status', payload: any, timestamp: string, read: boolean }`
  - Sources/destinations: `'user' | 'ai' | 'mcp' | 'page' | 'system'`
- **Comms panel** (new view or sub-panel of AI view):
  - Inbox: unread messages from AI, MCP, custom pages
  - Outbox: messages sent by user
  - Filters by type, source
  - Action buttons: "Route to Notes", "Route to Tasks", "Route to Clipboard", "Reply"
- **AI dispatch**: When the AI detects an actionable item in chat (a task, a note, a bookmark), it can dispatch it to the appropriate panel via the comms bus. For example:
  - AI says "I'll add that to your tasks" → dispatches `{ type: 'task', payload: { title: '...', priority: '2' } }` → auto-creates the task
  - AI says "Saving this note" → dispatches `{ type: 'note', payload: { title: '...', content: '...' } }`
- **Custom page → dashboard**: iframes can `postMessage({ type: 'comms', payload: {...} })` to send data to the comms bus
- **Status feed**: Running log of all dispatched actions (like a system activity feed)

### AI Tool Calling
When the AI is chatting, include function/tool definitions so it can call dashboard actions:
```ts
const dashboardTools = [
  { name: 'add_task', description: 'Add a task to the task list', parameters: { title: string, priority?: '1'|'2'|'3'|'4', due?: string, project?: string } },
  { name: 'add_note', description: 'Save a note', parameters: { title: string, content: string, folder?: string, tags?: string[] } },
  { name: 'add_clip', description: 'Save to clipboard', parameters: { content: string, title?: string, tags?: string[] } },
  { name: 'add_bookmark', description: 'Save a bookmark', parameters: { title: string, url: string, category?: string } },
  { name: 'search_dashboard', description: 'Search across all dashboard data', parameters: { query: string } },
  { name: 'get_tasks', description: 'Get current tasks', parameters: { project?: string, done?: boolean } },
  { name: 'get_notes', description: 'Get notes', parameters: { folder?: string } },
  { name: 'build_page', description: 'Build a custom HTML page', parameters: { description: string } },
  { name: 'send_comms', description: 'Send a message through the comms bus', parameters: { to: string, type: string, payload: any } },
]
```

When the AI response includes a tool call, the dashboard should:
1. Execute the action (add_task → call the store's addTask method)
2. Log it to the comms bus
3. Show a toast notification (sonner)
4. Display the result in the chat

---

## 4. MCP Server

Build a standalone MCP (Model Context Protocol) server that exposes the dashboard's data to Claude CLI and other MCP clients.

### Requirements
- **Standalone Node.js server** (separate from the Vite app) in a `/mcp-server/` directory
- Uses `@modelcontextprotocol/sdk` package
- Communicates via **stdio** (for Claude CLI integration)
- Reads/writes the same localStorage data by reading a JSON export file that the dashboard writes to disk, OR by connecting to a shared SQLite database, OR by running an HTTP bridge

### Recommended Architecture (simplest)
Since the dashboard runs in the browser and MCP runs in Node.js, bridge them:

**Option A — File-based sync (simplest)**:
- Dashboard has an "MCP Sync" toggle in Settings
- When enabled, dashboard writes all data to a JSON file at a known path every 30 seconds: `~/.pof2828/dashboard-data.json`
- MCP server reads from and writes to this file
- Dashboard watches the file for changes (via polling) and reloads

**Option B — HTTP bridge**:
- Dashboard runs a tiny HTTP server (or use the Cloudflare Worker)
- MCP server calls HTTP endpoints to read/write data

### MCP Tools to Expose
```ts
// Clipboard
{ name: 'pof2828_add_clip', description: 'Add item to clipboard', inputSchema: { content: string, title?: string, tags?: string[] } }
{ name: 'pof2828_get_clips', description: 'Get clipboard items', inputSchema: { search?: string, limit?: number } }
{ name: 'pof2828_delete_clip', description: 'Delete clipboard item', inputSchema: { id: string } }

// Notes
{ name: 'pof2828_add_note', description: 'Create a note', inputSchema: { title: string, content: string, folder?: string, tags?: string[] } }
{ name: 'pof2828_get_notes', description: 'Get notes', inputSchema: { search?: string, folder?: string } }
{ name: 'pof2828_update_note', description: 'Update a note', inputSchema: { id: string, title?: string, content?: string } }

// Tasks
{ name: 'pof2828_add_task', description: 'Add a task', inputSchema: { title: string, priority?: string, due?: string, project?: string, desc?: string } }
{ name: 'pof2828_get_tasks', description: 'Get tasks', inputSchema: { project?: string, done?: boolean } }
{ name: 'pof2828_complete_task', description: 'Mark task as done', inputSchema: { id: string } }

// Bookmarks
{ name: 'pof2828_add_bookmark', description: 'Save a bookmark', inputSchema: { title: string, url: string, category?: string } }
{ name: 'pof2828_get_bookmarks', description: 'Get bookmarks', inputSchema: { search?: string, category?: string } }

// Search
{ name: 'pof2828_search', description: 'Search across all dashboard data (clips, notes, tasks, bookmarks, axioms, prompts)', inputSchema: { query: string } }

// Prompts
{ name: 'pof2828_get_prompts', description: 'Get prompt library', inputSchema: { category?: string } }

// Comms
{ name: 'pof2828_send_message', description: 'Send a message through the dashboard comms bus', inputSchema: { to: string, type: string, payload: object } }
{ name: 'pof2828_get_messages', description: 'Get comms messages', inputSchema: { unread?: boolean, from?: string } }

// Pages
{ name: 'pof2828_build_page', description: 'Generate and save a custom HTML page', inputSchema: { title: string, description: string } }
{ name: 'pof2828_get_pages', description: 'Get custom pages', inputSchema: {} }
```

### MCP Resources to Expose
```ts
{ uri: 'pof2828://dashboard/stats', name: 'Dashboard Stats', description: 'Counts of clips, notes, tasks, etc.' }
{ uri: 'pof2828://axioms/all', name: 'All Axioms', description: 'Complete axiom chain data' }
{ uri: 'pof2828://prompts/all', name: 'Prompt Library', description: 'All prompts organized by category' }
```

### Claude CLI Integration
After building, add to Claude's MCP config (`~/.claude/claude_desktop_config.json` or settings):
```json
{
  "mcpServers": {
    "pof2828": {
      "command": "node",
      "args": ["C:/Users/lowes/Downloads/Kimi_Agent_Unified Search Across Panels/mcp-server/index.js"]
    }
  }
}
```

---

## 5. Simple Web Search Panel

Add a search bar to the `research` view that opens web search results.

### Requirements
- **Search input** with a "Search" button
- **Opens Google search** in a new tab: `window.open('https://www.google.com/search?q=' + encodeURIComponent(query))`
- **Optional filter toggles** (off by default, collapsible):
  - Site filter: text input (e.g., "arxiv.org")
  - File type: select (PDF, DOCX, XLSX, any)
  - These append `site:` and `filetype:` to the Google query string
- **Search history**: Store recent searches in `pof2828_searches` localStorage key
- **Quick actions**: "Search Exa" button (opens Exa.ai with query), "Smart Crawler" button (opens user's crawler at `https://smart-crawler.davidokc28.workers.dev/`)
- Keep it simple. This is NOT a full search engine — just a smart search bar that builds Google dork strings.

---

## 6. Firebase Public Edition (for sharing with others)

Build a Firebase-backed version of the dashboard that anyone can use by simply visiting a URL and signing in with Google. This is a **separate deployment** from the Cloudflare version — same React app, different backend.

### Architecture
```
Same React codebase
├── Cloudflare version (David's — localStorage + future D1/KV)
└── Firebase version (public — Firestore + Google Auth)
```

Use an environment variable `VITE_BACKEND=firebase|local` to switch between:
- `local` (default): current localStorage behavior, no auth
- `firebase`: Firestore for data, Google Sign-In for auth

### Firebase Setup
- **Firebase Hosting**: serves the PWA (replaces Cloudflare Pages for this deployment)
- **Firestore**: stores all user data under `users/{uid}/` collections
- **Firebase Auth**: Google Sign-In (one tap)
- **No Cloudflare, no Workers, no KV** — fully self-contained on Firebase free tier

### Data Structure in Firestore
```
users/{uid}/
  ├── clips/        (same ClipboardItem shape)
  ├── notes/        (same Note shape)
  ├── tasks/        (same Task shape)
  ├── projects/     (same Project shape)
  ├── bookmarks/    (same Bookmark shape)
  ├── prompts/      (same Prompt shape)
  ├── pages/        (same CustomPage shape)
  ├── tags/         (same Tag shape)
  └── settings/     (user preferences doc)
```

### Storage Adapter Pattern
Create `src/storage/index.ts`:
```ts
// Storage adapter interface — localStorage and Firestore implement the same API
interface StorageAdapter {
  getItems<T>(collection: string): Promise<T[]>
  setItem<T>(collection: string, id: string, data: T): Promise<void>
  deleteItem(collection: string, id: string): Promise<void>
  onSnapshot<T>(collection: string, callback: (items: T[]) => void): () => void
}

// src/storage/local.ts — wraps current localStorage logic
// src/storage/firebase.ts — wraps Firestore calls
// Chosen by VITE_BACKEND env var
```

### Auth UI
- If `VITE_BACKEND=firebase`, show a login screen before the dashboard
- "Sign in with Google" button (use `signInWithPopup` from Firebase Auth)
- After sign-in, load their data from Firestore
- Sign-out button in Settings

### Offline Support
- Firestore has built-in offline persistence (`enablePersistence()`)
- Works offline, syncs when back online — same behavior as localStorage but with cloud backup

### Firebase Config
Add `src/firebase.ts`:
```ts
import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  // These are filled in by the person deploying — NOT secret
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)
```

### Firestore Security Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Deployment
```bash
npm install firebase
npm run build
firebase init  # select Hosting + Firestore
firebase deploy
```

### .env.example for Firebase version
```
VITE_BACKEND=firebase
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:123456:web:abc
```

---

## 7. Agent Setup Prompt (for anyone to self-deploy)

Include this file in the repo as `SETUP_WITH_AI.md`. It's a prompt that anyone can paste into Claude, ChatGPT, or any AI agent to walk them through deploying their own instance.

### File: SETUP_WITH_AI.md
```markdown
# Deploy Your Own POF 2828 Dashboard

Paste this entire prompt into Claude, ChatGPT, or any AI assistant.
They will walk you through every step.

---

## PROMPT START

I want to deploy my own copy of the POF 2828 Dashboard — a personal
productivity PWA with clipboard, notes, tasks, bookmarks, prompts,
and AI chat. I want it hosted on Firebase (free tier) with Google
Sign-In so my data syncs across my devices.

Here's what I need you to help me do, step by step:

### Step 1: Prerequisites
- Make sure I have Node.js installed (v18+)
- Install Firebase CLI: `npm install -g firebase-tools`
- Log in: `firebase login`

### Step 2: Get the code
- Clone the repo: `git clone https://github.com/YellowKidokc/pof2828-dashboard.git`
- `cd pof2828-dashboard && npm install`

### Step 3: Create Firebase project
- Go to https://console.firebase.google.com
- Click "Add project", name it whatever I want
- Disable Google Analytics (not needed)
- Once created, click the web icon (</>) to register a web app
- Copy the firebaseConfig object — I'll need it next

### Step 4: Enable services
- In Firebase Console → Authentication → Sign-in method → Enable Google
- In Firebase Console → Firestore Database → Create database → Start in production mode

### Step 5: Configure the app
- Copy `.env.example` to `.env`
- Set `VITE_BACKEND=firebase`
- Paste my Firebase config values into the VITE_FIREBASE_* variables

### Step 6: Deploy Firestore security rules
- Run: `firebase init firestore`
- Replace the rules file content with:
  ```
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /users/{userId}/{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```
- Run: `firebase deploy --only firestore:rules`

### Step 7: Build and deploy
- `npm run build`
- `firebase init hosting` (public directory: `dist`, single-page app: Yes)
- `firebase deploy --only hosting`

### Step 8: Done!
- Firebase will give me a URL like `https://my-project.web.app`
- Open it, sign in with Google, start using it
- Install it as a PWA on my phone for app-like experience

### If I want AI chat to work:
- Go to Settings in the dashboard
- Paste my OpenAI or xAI API key
- Keys are stored in my browser only, never sent to the server

## PROMPT END
```

---

## General Rules

1. **DO NOT replace localStorage** — it is the offline fallback. Add API layer on top if needed, never remove localStorage.
2. **Use existing shadcn/ui components** — do not install new UI libraries. Everything needed is already installed.
3. **Follow existing patterns** — look at how `useDashboardStore.ts` manages state. New features should add to the same hook or create companion hooks that follow the same pattern.
4. **Storage key prefix**: All new localStorage keys must start with `pof2828_`
5. **Type everything** — add new types to `src/types/index.ts`
6. **Toast notifications** — use sonner (already installed) for success/error feedback
7. **Dark theme** — the dashboard uses dark mode. All new UI must match.
8. **No external CDNs in custom pages** — everything self-contained
9. **Existing prompt library** has 160+ prompts (Core 8, Extended, Chains, Ops, Custom). The AI chat must be able to use these prompts.
10. **Existing axiom data** in `src/data/axioms.ts` — full chain from A1.1 through the framework. AI should be able to reference axioms.
