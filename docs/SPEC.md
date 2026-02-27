# Vault Triage App - Product Specification

**Vision**: Web UI for processing messy Obsidian vaults with embedded AI chat

## Problem

Obsidian vaults get messy over time:
- Random notes accumulate in inbox
- No consistent structure or naming
- Duplicate or near-duplicate notes
- Broken links and orphaned files
- Tags inconsistent or unused
- Hard to find what you're looking for

Cleaning up manually is tedious and overwhelming.

## Solution

A web interface that:
1. **Scans** your vault and surfaces issues
2. **Presents** notes for triage (one at a time or batched)
3. **Suggests** actions (rename, move, merge, delete, tag)
4. **Chats** with you to understand context and help decide
5. **Executes** changes with your approval

## User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  VAULT TRIAGE                                    [Settings ⚙️]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  VAULT HEALTH                                                   │
│  ├─ 📁 Notes: 1,247                                            │
│  ├─ 📥 Inbox: 89 (needs triage)                                │
│  ├─ 🔗 Broken links: 23                                        │
│  ├─ 👻 Orphans: 45                                             │
│  └─ 📊 Health score: 67%                                       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CURRENT NOTE                                                ││
│  │ ─────────────                                               ││
│  │ meeting notes 2024-03-15.md                                 ││
│  │                                                             ││
│  │ "Met with Sarah about Q2 planning. Key points:             ││
│  │  - Budget approved for new hire                             ││
│  │  - Launch date moved to April..."                           ││
│  │                                                             ││
│  │ AI SUGGESTION:                                              ││
│  │ Move to: Meetings/2024/                                     ││
│  │ Rename to: 2024-03-15 Q2 Planning with Sarah               ││
│  │ Add tags: #meeting #q2 #planning                            ││
│  │                                                             ││
│  │ [Accept] [Modify] [Skip] [Delete]                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ 💬 Chat: "What folder structure do you use for meetings?"  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### Triage Modes
- **Quick triage**: Simple accept/skip/delete for each note
- **Batch triage**: Group similar notes, apply bulk actions
- **AI triage**: Let AI process with rules, review results

### Analysis
- Duplicate detection (exact and near-duplicate)
- Orphan identification (notes with no links in/out)
- Broken link detection
- Inconsistent naming patterns
- Unused tags
- Empty or stub notes

### Actions
- Move to folder
- Rename (with pattern suggestions)
- Add/remove tags
- Merge with another note
- Archive (move to archive folder)
- Delete (with confirmation)
- Create links to related notes

### AI Chat
- Understand your organizational preferences
- Suggest folder structures
- Help decide what to keep vs delete
- Learn from your decisions over time

## MVP Scope (v0.1)

1. **Connect to vault** (local folder path)
2. **Scan and analyze** (find inbox, orphans, broken links)
3. **Basic triage UI** (one note at a time, accept/skip/delete)
4. **AI suggestions** (rename, move, tag recommendations)
5. **Execute actions** (actually move/rename files)

## Success Criteria

- [ ] Can process 100 inbox notes in under 30 minutes
- [ ] AI suggestions are helpful >80% of the time
- [ ] No data loss (safe file operations)
- [ ] Works with vaults up to 10,000 notes

## Open Questions to Resolve in Architecture

- Tech stack: Node.js vs Python backend?
- Monorepo vs separate repos?
- How to handle Obsidian plugins that modify behavior?
- Sync with Obsidian's internal link index?
- Support for multiple vaults?
- Undo/rollback for actions?
- Progress persistence across sessions?
- Embeddings: local vs API?
