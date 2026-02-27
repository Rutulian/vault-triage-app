# Implementation Tasks

Tasks are ordered by dependency. Each is scoped to 1-4 hours.

## Phase 1: Project Setup

### T1.1 — Initialize monorepo and shared config
- Create `package.json` with npm workspaces (`packages/*`)
- Create `tsconfig.base.json` with strict mode
- Create `packages/shared/`, `packages/client/`, `packages/server/`
- Add ESLint + Prettier config at root
- Add `.gitignore`
- **AC:** `npm install` works, `tsc --noEmit` passes across all packages

### T1.2 — Scaffold Express server
- Init `packages/server/` with TypeScript + Express
- Add health check endpoint: `GET /api/health`
- Add dev script with `tsx watch`
- Add basic error handling middleware
- **AC:** Server starts, `GET /api/health` returns 200

### T1.3 — Scaffold React client
- Init `packages/client/` with Vite + React + TypeScript
- Add TailwindCSS 4
- Add shadcn/ui setup (cn util, base components)
- Proxy `/api` to Express server in Vite config
- **AC:** `npm run dev` starts both client and server, page loads

## Phase 2: Vault Connection & Scanning

### T2.1 — Vault connection endpoint
- `POST /api/vault/connect` — accepts `{ path: string }`, validates directory exists and looks like a vault (has `.obsidian/` or `.md` files)
- `GET /api/vault/status` — returns connected vault path and basic stats
- Store vault path in server memory (single vault per instance)
- **AC:** Can connect to a test vault, get status back

### T2.2 — Vault scanner: file indexing
- Walk the vault directory, index all `.md` files
- Extract: file path, title, size, modified date, frontmatter (YAML)
- Skip `.obsidian/`, `.vault-triage/`, and other dot-directories
- Store index in `.vault-triage/scan-cache.json`
- **AC:** Scanning a 100-file test vault completes in <5s, cache file written

### T2.3 — Vault scanner: link & issue detection
- Parse markdown for `[[wikilinks]]` and `[text](links)`
- Detect: broken links, orphan notes, empty notes, inbox items
- Compute health score (% of notes without issues)
- Add results to scan cache
- **AC:** Scanner correctly identifies broken links and orphans in test vault

### T2.4 — Scan as background job
- `POST /api/vault/scan` returns `{ jobId }` immediately
- `GET /api/vault/scan/:id` returns `{ status, progress, result }`
- Use a simple in-memory job tracker (no queue library)
- **AC:** Large scan doesn't block API, progress updates work

## Phase 3: Notes API & Triage Engine

### T3.1 — Notes list and detail endpoints
- `GET /api/notes` — paginated, filterable by: folder, has_issues, type (orphan, broken_links, inbox)
- `GET /api/notes/:path` — return note content, metadata, detected issues
- Read from scan cache for metadata, read file for content
- **AC:** Can list notes, filter by issue type, get note detail

### T3.2 — Triage session management
- `POST /api/triage/start` — create session, build queue of notes to triage (filterable)
- `GET /api/triage/next` — return next untriaged note
- Persist session to `.vault-triage/session.json`
- **AC:** Can start session, get notes one at a time, resume after server restart

### T3.3 — Triage actions: move, rename, tag
- `POST /api/triage/action` — accepts `{ noteId, action, params }`
- Implement: move file, rename file, add/remove frontmatter tags
- Log every action to `.vault-triage/actions.json`
- Update wikilinks in other files when a note is moved/renamed
- **AC:** Move and rename work, links are updated, action is logged

### T3.4 — Triage actions: delete and undo
- Delete moves to `.vault-triage/trash/` (soft delete)
- `GET /api/triage/history` — list past actions
- `POST /api/triage/undo/:id` — reverse a logged action
- **AC:** Delete is reversible, undo restores file to original location

## Phase 4: AI Integration

### T4.1 — AI service setup
- Create AI service module wrapping `@anthropic-ai/sdk`
- Load API key from environment variable
- Create prompt templates for note suggestions
- **AC:** Can call Claude API and get a structured response

### T4.2 — Note suggestion endpoint
- `GET /api/notes/:path/suggestions` — return AI-generated suggestions
- Send note content + vault context (folder structure, existing tags) to Claude
- Parse response into structured suggestions: rename, move, tags
- **AC:** Returns useful suggestions for a test note

### T4.3 — Chat endpoint
- `POST /api/chat` — streaming response
- Maintain conversation history per session
- Include vault context in system prompt (folder structure, current note)
- **AC:** Can have a multi-turn conversation about vault organization

## Phase 5: Frontend UI

### T5.1 — Layout and navigation shell
- App layout: sidebar + main content area
- Router setup (React Router or TanStack Router)
- Vault connection page (enter path, connect button)
- **AC:** Can navigate between pages, connect to vault

### T5.2 — Dashboard view
- Show vault health summary (note count, issues, health score)
- Issue breakdown with counts (orphans, broken links, inbox)
- "Start Triage" button
- **AC:** Dashboard shows accurate vault stats after scan

### T5.3 — Triage view
- Show current note: title, content preview, metadata
- Show AI suggestions (from API)
- Action buttons: Accept suggestion, Skip, Delete
- Progress indicator (X of Y notes triaged)
- **AC:** Can triage through notes, applying actions

### T5.4 — Chat panel
- Slide-out or side panel with chat interface
- Message input, streaming response display
- Context-aware (knows which note you're looking at)
- **AC:** Can chat about current note, get organizational advice

### T5.5 — Action history and undo
- History page or panel showing past actions
- Undo button per action
- **AC:** Can view history and undo actions

## Phase 6: Polish & Testing

### T6.1 — Error handling and edge cases
- Handle: vault disconnected, file moved externally, API errors
- Loading states, empty states, error states in UI
- **AC:** App handles errors gracefully, no crashes

### T6.2 — End-to-end testing
- Test full flow: connect vault → scan → triage → verify files changed
- Test undo flow
- Test with a realistic vault (100+ notes)
- **AC:** Full flow works reliably

### T6.3 — Performance check
- Test with 1,000+ note vault
- Ensure scan completes in reasonable time
- Ensure UI remains responsive during scan
- **AC:** Meets success criteria from spec (100 notes in 30 min)
