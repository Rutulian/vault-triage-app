# Architecture

## Tech Stack Decisions

### Frontend: React + Vite + TailwindCSS

**Why React + Vite:**
- Vite is fast, zero-config for TypeScript, excellent DX
- React is the boring/reliable choice with the largest ecosystem
- SPA is sufficient — no SSR needed for a local tool

**Why TailwindCSS:**
- Rapid UI prototyping, no CSS file sprawl
- Consistent design tokens out of the box
- Pairs well with component-based architecture

**UI Library:** shadcn/ui — copy-paste components, no dependency lock-in, built on Radix primitives for accessibility.

**State Management:** React context + useReducer for app state. No Redux — the app state is simple enough. TanStack Query for server state.

### Backend: Node.js + Express

**Why Node.js:**
- TypeScript everywhere (shared types between frontend/backend)
- Good filesystem APIs for vault operations
- Simple to set up, well-understood

**Why Express:**
- Boring, battle-tested, minimal
- Easy to add middleware (CORS, error handling)
- Large ecosystem of middleware

**API Style:** REST. The operations are CRUD-like (scan vault, get notes, apply actions). No need for GraphQL complexity.

### AI Integration: Anthropic Claude API (via SDK)

**Why Claude:**
- Strong at text understanding and classification
- Good at following structured instructions
- `@anthropic-ai/sdk` is well-maintained

**Model:** claude-sonnet-4-20250514 for suggestions (fast + cheap). No local embeddings for MVP — keep it simple.

**Pattern:** Backend proxies all AI calls. Frontend never talks to AI directly. This keeps the API key server-side and allows us to control prompts.

### Infrastructure: Monorepo with npm workspaces

**Why monorepo:**
- Shared TypeScript types between frontend and backend
- Single `npm install`, single repo to manage
- Simple for a small project

**Structure:**
```
vault-triage-app/
├── packages/
│   ├── client/          # React frontend (Vite)
│   ├── server/          # Express backend
│   └── shared/          # Shared types and utilities
├── package.json         # Workspace root
├── tsconfig.base.json   # Shared TS config
└── docs/
```

## System Architecture

```
┌─────────────────────────────────────────────────┐
│                   Browser                        │
│  ┌─────────────────────────────────────────────┐│
│  │         React SPA (Vite)                    ││
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ ││
│  │  │ Dashboard │ │ Triage   │ │ Chat Panel  │ ││
│  │  │  View     │ │  View    │ │             │ ││
│  │  └──────────┘ └──────────┘ └─────────────┘ ││
│  └──────────────────┬──────────────────────────┘│
└─────────────────────┼───────────────────────────┘
                      │ HTTP/REST
┌─────────────────────┼───────────────────────────┐
│            Express Server                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Vault    │ │ Triage   │ │ AI Service       │ │
│  │ Scanner  │ │ Engine   │ │ (Claude proxy)   │ │
│  └────┬─────┘ └──────────┘ └───────┬──────────┘ │
│       │                             │             │
└───────┼─────────────────────────────┼─────────────┘
        │                             │
   ┌────┴─────┐                ┌──────┴──────┐
   │ Obsidian │                │ Anthropic   │
   │ Vault    │                │ API         │
   │ (fs)     │                └─────────────┘
   └──────────┘
```

## API Design

### Vault Endpoints

```
POST   /api/vault/connect       # Set vault path, validate it exists
GET    /api/vault/status         # Get vault health summary
POST   /api/vault/scan           # Trigger full scan (returns job ID)
GET    /api/vault/scan/:id       # Poll scan progress
```

### Notes Endpoints

```
GET    /api/notes                # List notes (paginated, filterable)
GET    /api/notes/:path          # Get single note with content + metadata
GET    /api/notes/:path/suggestions  # Get AI suggestions for a note
```

### Triage Endpoints

```
POST   /api/triage/start         # Start triage session (returns queue)
GET    /api/triage/next           # Get next note to triage
POST   /api/triage/action         # Apply an action (move, rename, tag, delete)
GET    /api/triage/history        # Get action history (for undo)
POST   /api/triage/undo/:id       # Undo a specific action
```

### Chat Endpoints

```
POST   /api/chat                 # Send message, get AI response (streaming)
```

## Key Design Decisions

### 1. File Operations Are Atomic + Reversible

Every file action (move, rename, delete) is:
- Logged to an actions journal (JSON file in vault's `.vault-triage/` folder)
- Reversible via undo endpoint
- Validated before execution (check target doesn't exist, etc.)

Delete operations move to `.vault-triage/trash/` rather than truly deleting.

### 2. Scanning Is a Background Job

Vault scanning can be slow for large vaults. The scan endpoint returns a job ID, and the client polls for progress. Scan results are cached in `.vault-triage/scan-cache.json`.

### 3. AI Suggestions Are On-Demand

We don't pre-generate suggestions for all notes. When a note is presented for triage, the frontend requests suggestions. This avoids burning API credits on notes the user might skip.

### 4. Session Persistence

Triage progress is stored in `.vault-triage/session.json` inside the vault. This means progress survives server restarts and is tied to the vault, not the app instance.

### 5. No Database

All state is stored in the filesystem:
- Scan cache: `.vault-triage/scan-cache.json`
- Action history: `.vault-triage/actions.json`
- Session state: `.vault-triage/session.json`
- Trash: `.vault-triage/trash/`

This keeps the app simple and makes the state portable with the vault.

### 6. Single Vault at a Time

MVP supports one vault per server instance. Multi-vault support can come later.

## Open Questions Resolved

| Question | Decision |
|----------|----------|
| Node.js vs Python backend? | **Node.js** — shared TypeScript, simpler stack |
| Monorepo vs separate repos? | **Monorepo** with npm workspaces |
| Obsidian plugin compatibility? | **Ignore for MVP** — treat vault as plain markdown files |
| Sync with Obsidian link index? | **Build our own** lightweight link parser |
| Multiple vaults? | **Single vault for MVP** |
| Undo/rollback? | **Yes** — action journal + soft delete |
| Session persistence? | **Yes** — stored in vault's `.vault-triage/` dir |
| Embeddings? | **No embeddings for MVP** — use Claude for similarity via prompts |

## Technology Versions

- Node.js: 20 LTS
- TypeScript: 5.x (strict mode)
- React: 19
- Vite: 6.x
- Express: 4.x
- TailwindCSS: 4.x
- TanStack Query: 5.x
- shadcn/ui: latest
- @anthropic-ai/sdk: latest
