# ContextKit

A local-first tool for managing reusable context snippets for AI coding agents (CLAUDE.md / AGENTS.md files).

---

## Problem Statement

When using AI coding agents (Claude Code, Cursor, etc.), developers maintain context files (CLAUDE.md or AGENTS.md) that provide project-specific instructions. Managing these files is painful because:

1. **Global vs. project-specific tension**: Global config applies everywhere, but most snippets only apply to some projects
2. **Copy-paste drift**: Snippets get duplicated across projects and diverge over time
3. **No discoverability**: Hard to remember what snippets exist when setting up a new project

---

## High-Level Requirements

### Snippet Management (Web App)

- **Create** snippets with title, content (markdown), and tags
- **Read/browse** all snippets with search and tag filtering
- **Update** snippet content with version history tracking
- **Delete** snippets (with confirmation)
- **Markdown editing** with live preview
- Single-user, fully offline operation

### Project Onboarding (CLI)

- **Onboard command**: Output instructions for an AI agent to discover and select relevant snippets
- **Search command**: Query snippets by semantic similarity and return matches with ID, title, and content
- **Select command**: Add a snippet to the current project's configuration
- **Deselect command**: Remove a snippet from the current project's configuration
- **List command**: Show all snippets currently selected for the project
- **Generate command**: Output the combined markdown content for all selected snippets

### Data Flow

1. User creates/manages snippets via web app
2. Snippets are stored in SQLite with vector embeddings generated locally
3. AI coding agent runs CLI to onboard a project
4. CLI searches vector DB, agent selects relevant snippets
5. CLI outputs combined markdown content
6. Agent updates CLAUDE.md/AGENTS.md with the content (CLI does not modify files directly)

---

## Suggested Implementation

### Tech Stack

| Component        | Technology                                          |
| ---------------- | --------------------------------------------------- |
| Web App          | Next.js 14+ (App Router)                            |
| Database         | SQLite (via better-sqlite3)                         |
| Vector Search    | sqlite-vss (SQLite extension for vector similarity) |
| Local Embeddings | Xenova/transformers.js with all-MiniLM-L6-v2 model  |
| CLI              | Node.js with Commander.js                           |
| Markdown Editor  | Monaco Editor or CodeMirror 6 with markdown preview |
| Styling          | Tailwind CSS                                        |
| Monorepo         | Turborepo or npm workspaces                         |

### Project Structure

```
contextkit/
├── packages/
│   ├── web/                 # Next.js web application
│   │   ├── app/
│   │   │   ├── page.tsx           # Snippet list/dashboard
│   │   │   ├── snippets/
│   │   │   │   ├── new/page.tsx   # Create snippet
│   │   │   │   └── [id]/page.tsx  # Edit snippet
│   │   │   └── api/
│   │   │       └── snippets/      # API routes for CRUD
│   │   ├── components/
│   │   │   ├── SnippetEditor.tsx
│   │   │   ├── SnippetList.tsx
│   │   │   ├── MarkdownPreview.tsx
│   │   │   └── TagInput.tsx
│   │   └── lib/
│   │       └── db.ts              # Database client
│   │
│   ├── cli/                 # CLI tool
│   │   ├── src/
│   │   │   ├── index.ts           # Entry point
│   │   │   ├── commands/
│   │   │   │   ├── onboard.ts
│   │   │   │   ├── search.ts
│   │   │   │   ├── select.ts
│   │   │   │   ├── deselect.ts
│   │   │   │   ├── list.ts
│   │   │   │   └── generate.ts
│   │   │   └── lib/
│   │   │       ├── config.ts      # .tool/config.json management
│   │   │       └── db.ts          # Database client
│   │   └── package.json
│   │
│   └── shared/              # Shared code between web and CLI
│       ├── src/
│       │   ├── db/
│       │   │   ├── schema.ts      # Database schema
│       │   │   ├── client.ts      # SQLite client
│       │   │   └── vectors.ts     # Vector search utilities
│       │   ├── embeddings.ts      # Local embedding generation
│       │   └── types.ts           # Shared TypeScript types
│       └── package.json
│
├── package.json             # Workspace root
└── turbo.json               # Turborepo config
```

### Database Schema

```sql
-- Snippets table
CREATE TABLE snippets (
  id TEXT PRIMARY KEY,           -- UUID
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL,            -- JSON array stored as text
  created_at TEXT NOT NULL,      -- ISO timestamp
  updated_at TEXT NOT NULL       -- ISO timestamp
);

-- Snippet versions for history
CREATE TABLE snippet_versions (
  id TEXT PRIMARY KEY,           -- UUID
  snippet_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);

-- Vector embeddings (sqlite-vss virtual table)
CREATE VIRTUAL TABLE snippet_embeddings USING vss0(
  embedding(384)                 -- all-MiniLM-L6-v2 produces 384-dim vectors
);

-- Mapping table for snippet <-> embedding
CREATE TABLE snippet_embedding_map (
  snippet_id TEXT PRIMARY KEY,
  rowid INTEGER NOT NULL,        -- References snippet_embeddings rowid
  FOREIGN KEY (snippet_id) REFERENCES snippets(id) ON DELETE CASCADE
);
```

### CLI Commands

#### `contextkit onboard`

Outputs instructions for an AI coding agent to set up the project.

```
$ contextkit onboard

=== CONTEXTKIT ONBOARDING ===

You are setting up context snippets for this project's CLAUDE.md/AGENTS.md file.

INSTRUCTIONS:
1. Explore this project to identify the tech stack (check package.json, config files, etc.)
2. Use `contextkit search "<query>"` to find relevant snippets (e.g., "typescript", "nextjs", "aws")
3. Use `contextkit select <id>` to add snippets to this project
4. Use `contextkit list` to see currently selected snippets
5. Use `contextkit generate` to output the combined markdown
6. Update CLAUDE.md and/or AGENTS.md with the generated content

TIPS:
- Search for frameworks, languages, deployment targets, and coding conventions
- Select snippets in order of importance (they will be combined in selection order)
```

#### `contextkit search "<query>"`

Searches snippets by semantic similarity.

```
$ contextkit search "typescript strict mode"

Found 3 matching snippets:

[1] typescript-strict (id: abc123)
    Tags: typescript, config
    ---
    ## TypeScript Configuration

    Use strict mode with the following tsconfig settings...
    ---

[2] typescript-eslint (id: def456)
    Tags: typescript, eslint, linting
    ---
    ## ESLint for TypeScript

    Configure ESLint with typescript-eslint plugin...
    ---

[3] type-safety-patterns (id: ghi789)
    Tags: typescript, patterns
    ---
    ## Type Safety Patterns

    Prefer unknown over any...
    ---

Use `contextkit select <id>` to add a snippet to this project.
```

#### `contextkit select <id>`

Adds a snippet to the project configuration.

```
$ contextkit select abc123

Added "typescript-strict" to project.
Currently selected: 1 snippet(s)
```

#### `contextkit deselect <id>`

Removes a snippet from the project configuration.

```
$ contextkit deselect abc123

Removed "typescript-strict" from project.
Currently selected: 0 snippet(s)
```

#### `contextkit list`

Shows currently selected snippets.

```
$ contextkit list

Selected snippets for this project:

1. typescript-strict (abc123)
   Tags: typescript, config

2. nextjs-app-router (xyz789)
   Tags: nextjs, react, routing

Use `contextkit deselect <id>` to remove a snippet.
Use `contextkit generate` to output combined markdown.
```

#### `contextkit generate`

Outputs the combined markdown content.

```
$ contextkit generate

=== GENERATED CLAUDE.md CONTENT ===

<!-- Managed by ContextKit - Do not edit this section manually -->
<!-- Snippets: typescript-strict, nextjs-app-router -->

## TypeScript Configuration

Use strict mode with the following tsconfig settings...

## Next.js App Router

When working with the App Router...

<!-- End Managed Section -->

=== END GENERATED CONTENT ===

Copy the above content into your CLAUDE.md and/or AGENTS.md file.
```

### Project Config File

Stored at `.contextkit/config.json` in the project root:

```json
{
  "version": 1,
  "selectedSnippets": [
    {
      "id": "abc123",
      "title": "typescript-strict",
      "selectedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "xyz789",
      "title": "nextjs-app-router",
      "selectedAt": "2024-01-15T10:31:00Z"
    }
  ]
}
```

### Database Location

SQLite database stored at:

- **macOS**: `~/Library/Application Support/contextkit/contextkit.db`
- **Linux**: `~/.local/share/contextkit/contextkit.db`
- **Windows**: `%APPDATA%/contextkit/contextkit.db`

Both web app and CLI read from the same database file.

### Local Embeddings

Use `@xenova/transformers` to run the `all-MiniLM-L6-v2` model locally:

```typescript
import { pipeline } from "@xenova/transformers";

let embedder: any = null;

export async function getEmbedding(text: string): Promise<number[]> {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const output = await embedder(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}
```

Embeddings are generated:

- When a snippet is created (embed title + tags + content)
- When a snippet is updated (re-embed and replace)

### Web App Pages

#### Dashboard (`/`)

- List all snippets in a card/table view
- Search bar for filtering (client-side for simplicity)
- Tag filter chips
- "New Snippet" button

#### Create Snippet (`/snippets/new`)

- Title input
- Tag input (comma-separated or chip-style)
- Split-pane markdown editor with live preview
- Save button

#### Edit Snippet (`/snippets/[id]`)

- Same as create, pre-populated
- Version history sidebar (collapsible)
- Save button (creates new version)
- Delete button (with confirmation modal)

---

## Future Enhancements (Out of Scope for v1)

- Multi-user support with authentication
- Cloud sync across machines
- Import/export snippets
- Snippet dependencies and hierarchy
- VS Code extension
- Auto-detect tech stack in CLI
- Webhook to auto-update when snippets change
