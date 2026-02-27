# Vault Triage App

A web UI for processing messy Obsidian vaults with embedded AI chat.

## Project Overview

Read `docs/SPEC.md` for the full product specification.
Read `docs/ARCHITECTURE.md` for technical decisions.

## Development Workflow

This project uses Vibe Kanban for task orchestration. Each task should:
1. Have clear acceptance criteria
2. Be completable in a single session
3. Include tests where appropriate
4. Update documentation as needed

## Code Standards

- **TypeScript** everywhere (strict mode, no `any`)
- **ESLint + Prettier** for formatting
- **Conventional commits** (feat:, fix:, docs:, chore:, test:, refactor:)
- **Tests** for business logic (unit) and critical paths (integration)
- Use `vitest` for testing
- Prefer named exports over default exports
- Use path aliases (`@server/`, `@client/`, `@shared/`)

## Architecture

- **Monorepo** with npm workspaces (`packages/client`, `packages/server`, `packages/shared`)
- **Frontend:** React 19 + Vite 6 + TailwindCSS 4 + shadcn/ui + TanStack Query
- **Backend:** Node.js 20 + Express 4
- **AI:** Anthropic Claude API via `@anthropic-ai/sdk` (server-side only)
- **No database** — all state in filesystem (`.vault-triage/` directory in vault)
- **REST API** — see `docs/ARCHITECTURE.md` for endpoint list

## Key Commands

```bash
npm install              # Install all workspace dependencies
npm run dev              # Start client + server in dev mode
npm run build            # Build all packages
npm run lint             # Lint all packages
npm run test             # Run tests across all packages
npm run typecheck        # Run tsc --noEmit across all packages
```

## Directory Structure

```
vault-triage-app/
├── packages/
│   ├── client/          # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── pages/        # Route pages
│   │   │   ├── hooks/        # Custom React hooks
│   │   │   ├── lib/          # Utilities
│   │   │   └── main.tsx      # Entry point
│   │   └── vite.config.ts
│   ├── server/          # Express backend
│   │   ├── src/
│   │   │   ├── routes/       # Express route handlers
│   │   │   ├── services/     # Business logic (scanner, triage, ai)
│   │   │   ├── middleware/   # Express middleware
│   │   │   └── index.ts      # Entry point
│   │   └── tsconfig.json
│   └── shared/          # Shared types and utilities
│       └── src/
│           └── types.ts      # Shared TypeScript interfaces
├── package.json         # Workspace root
├── tsconfig.base.json   # Shared TS config
└── docs/
    ├── SPEC.md
    ├── ARCHITECTURE.md
    └── TASKS.md
```

## Important Patterns

- **File operations must be logged** to `.vault-triage/actions.json` for undo support
- **Deletes are soft** — files move to `.vault-triage/trash/`
- **AI calls go through server** — never expose API key to client
- **Scan results are cached** in `.vault-triage/scan-cache.json`
- **Triage sessions persist** in `.vault-triage/session.json`

## Current Phase

**Phase 1: Project Setup** — see `docs/TASKS.md` for full task list
