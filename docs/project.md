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
- **Snippet command**: Fetch a single snippet by ID for detailed preview
- **Select command**: Add one or more snippets to the current project's configuration
- **Deselect command**: Remove one or more snippets from the current project's configuration
- **List command**: Show all snippets currently selected for the project
- **Generate command**: Output the combined markdown content for all selected snippets
- **Doctor command**: Run diagnostics to verify database, embeddings, and project config are working
- **JSON output**: All commands support `--json` flag for machine-readable output

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
│   │   │   │   ├── snippet.ts
│   │   │   │   ├── select.ts
│   │   │   │   ├── deselect.ts
│   │   │   │   ├── list.ts
│   │   │   │   ├── generate.ts
│   │   │   │   └── doctor.ts
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
2. Use `contextkit search "<query>" --json` to find relevant snippets (e.g., "typescript", "nextjs", "aws")
3. Use `contextkit snippet <id>` to preview a specific snippet's full content
4. Use `contextkit select <id>` to add snippets to this project
5. Use `contextkit list` to see currently selected snippets
6. Use `contextkit generate` to output the combined markdown
7. Update CLAUDE.md and/or AGENTS.md with the generated content

TIPS:
- Search for frameworks, languages, deployment targets, and coding conventions
- Select snippets in order of importance (they will be combined in selection order)
- Use `contextkit doctor` if you encounter any issues

BOOTSTRAP: Add this section to the top of CLAUDE.md to help future agents:

    # ContextKit

    This project uses ContextKit for context management.
    - Run `contextkit list` to see active snippets
    - Run `contextkit search "<topic>" --json` to find additional context
    - Run `contextkit doctor` to diagnose issues
```

#### `contextkit search "<query>"`

Searches snippets by semantic similarity. Supports `--json` flag for machine-readable output.

**Human-readable output:**

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

**JSON output (recommended for AI agents):**

```
$ contextkit search "typescript strict mode" --json
```

```json
{
  "query": "typescript strict mode",
  "count": 3,
  "results": [
    {
      "id": "abc123",
      "title": "typescript-strict",
      "tags": ["typescript", "config"],
      "content": "## TypeScript Configuration\n\nUse strict mode with the following tsconfig settings...",
      "score": 0.92
    },
    {
      "id": "def456",
      "title": "typescript-eslint",
      "tags": ["typescript", "eslint", "linting"],
      "content": "## ESLint for TypeScript\n\nConfigure ESLint with typescript-eslint plugin...",
      "score": 0.85
    },
    {
      "id": "ghi789",
      "title": "type-safety-patterns",
      "tags": ["typescript", "patterns"],
      "content": "## Type Safety Patterns\n\nPrefer unknown over any...",
      "score": 0.78
    }
  ]
}
```

#### `contextkit snippet <id>`

Fetches a single snippet by ID for detailed preview. Useful when an agent wants to re-read a snippet found earlier.

**Human-readable output:**

```
$ contextkit snippet abc123

=== typescript-strict (abc123) ===
Tags: typescript, config
Created: 2024-01-10T08:00:00Z
Updated: 2024-01-15T10:30:00Z

---
## TypeScript Configuration

Use strict mode with the following tsconfig settings:

{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true
  }
}
---
```

**JSON output:**

```
$ contextkit snippet abc123 --json
```

```json
{
  "id": "abc123",
  "title": "typescript-strict",
  "tags": ["typescript", "config"],
  "content": "## TypeScript Configuration\n\nUse strict mode with the following tsconfig settings:\n\n{\n  \"compilerOptions\": {\n    \"strict\": true,\n    \"noUncheckedIndexedAccess\": true,\n    \"noImplicitReturns\": true\n  }\n}",
  "createdAt": "2024-01-10T08:00:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

#### `contextkit select <id...>`

Adds one or more snippets to the project configuration. Supports `--json` flag.

```
$ contextkit select abc123

Added "typescript-strict" to project.
Currently selected: 1 snippet(s)
```

```
$ contextkit select abc123 def456 ghi789

Added 3 snippets to project:
  - typescript-strict (abc123)
  - typescript-eslint (def456)
  - type-safety-patterns (ghi789)
Currently selected: 3 snippet(s)
```

```
$ contextkit select abc123 def456 --json
```

```json
{
  "action": "added",
  "snippets": [
    { "id": "abc123", "title": "typescript-strict" },
    { "id": "def456", "title": "typescript-eslint" }
  ],
  "totalSelected": 2
}
```

#### `contextkit deselect <id...>`

Removes one or more snippets from the project configuration. Supports `--json` flag.

```
$ contextkit deselect abc123

Removed "typescript-strict" from project.
Currently selected: 0 snippet(s)
```

```
$ contextkit deselect abc123 def456 ghi789

Removed 3 snippets from project:
  - typescript-strict (abc123)
  - typescript-eslint (def456)
  - type-safety-patterns (ghi789)
Currently selected: 0 snippet(s)
```

```
$ contextkit deselect abc123 def456 --json
```

```json
{
  "action": "removed",
  "snippets": [
    { "id": "abc123", "title": "typescript-strict" },
    { "id": "def456", "title": "typescript-eslint" }
  ],
  "totalSelected": 0
}
```

#### `contextkit list`

Shows currently selected snippets. Supports `--json` flag.

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

```
$ contextkit list --json
```

```json
{
  "projectPath": "/Users/will/projects/my-app",
  "configPath": ".contextkit/config.json",
  "count": 2,
  "snippets": [
    {
      "id": "abc123",
      "title": "typescript-strict",
      "tags": ["typescript", "config"],
      "selectedAt": "2024-01-15T10:30:00Z"
    },
    {
      "id": "xyz789",
      "title": "nextjs-app-router",
      "tags": ["nextjs", "react", "routing"],
      "selectedAt": "2024-01-15T10:31:00Z"
    }
  ]
}
```

#### `contextkit generate`

Outputs the combined markdown content. Supports `--json` flag.

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

```
$ contextkit generate --json
```

```json
{
  "snippetIds": ["abc123", "xyz789"],
  "snippetTitles": ["typescript-strict", "nextjs-app-router"],
  "content": "<!-- Managed by ContextKit - Do not edit this section manually -->\n<!-- Snippets: typescript-strict, nextjs-app-router -->\n\n## TypeScript Configuration\n\nUse strict mode with the following tsconfig settings...\n\n## Next.js App Router\n\nWhen working with the App Router...\n\n<!-- End Managed Section -->"
}
```

#### `contextkit doctor`

Runs diagnostics to verify ContextKit is working properly. Useful for debugging. Supports `--json` flag.

```
$ contextkit doctor

=== CONTEXTKIT DIAGNOSTICS ===

[✓] Database
    Location: ~/.local/share/contextkit/contextkit.db
    Status: Connected
    Snippets: 42

[✓] Embeddings
    Model: all-MiniLM-L6-v2
    Status: Loaded
    Test query: OK (responded in 120ms)

[✓] Project Config
    Path: /Users/will/projects/my-app/.contextkit/config.json
    Status: Valid
    Selected snippets: 2
    All snippet IDs exist: Yes

=== ALL CHECKS PASSED ===
```

**Example with issues:**

```
$ contextkit doctor

=== CONTEXTKIT DIAGNOSTICS ===

[✓] Database
    Location: ~/.local/share/contextkit/contextkit.db
    Status: Connected
    Snippets: 42

[✓] Embeddings
    Model: all-MiniLM-L6-v2
    Status: Loaded
    Test query: OK (responded in 120ms)

[✗] Project Config
    Path: /Users/will/projects/my-app/.contextkit/config.json
    Status: Invalid
    Error: Snippet "old-snippet-id" not found in database

=== 1 CHECK FAILED ===

Run `contextkit deselect old-snippet-id` to fix, or delete .contextkit/config.json to reset.
```

```
$ contextkit doctor --json
```

```json
{
  "status": "healthy",
  "checks": {
    "database": {
      "ok": true,
      "location": "~/.local/share/contextkit/contextkit.db",
      "snippetCount": 42
    },
    "embeddings": {
      "ok": true,
      "model": "all-MiniLM-L6-v2",
      "latencyMs": 120
    },
    "projectConfig": {
      "ok": true,
      "path": "/Users/will/projects/my-app/.contextkit/config.json",
      "selectedCount": 2,
      "missingSnippets": []
    }
  }
}
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
