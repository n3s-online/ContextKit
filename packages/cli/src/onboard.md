# ContextKit - AI Agent Integration Guide

## Overview

ContextKit manages reusable code snippets that AI agents can search and include in their context. Snippets are stored in a local SQLite database with vector embeddings for semantic search.

## Quick Start

1. Search for relevant snippets:
   contextkit search "authentication flow"

2. Select useful ones:
   contextkit select <snippet-id>

3. Generate markdown context:
   contextkit generate

## Commands

| Command | Description |
|---------|-------------|
| search <query> | Semantic search for snippets |
| snippet <id> | View a single snippet |
| select <id...> | Add snippets to selection |
| deselect <id...> | Remove from selection |
| list | Show selected snippets |
| generate | Output combined markdown |
| doctor | Check system health |
| onboard | Show this guide |

## CLAUDE.md Integration

Add this to your project's CLAUDE.md:

```markdown
## ContextKit Integration

This project uses ContextKit for reusable code patterns.

**Workflow:**
1. Search: `contextkit search "your query"`
2. Select: `contextkit select <id>`
3. Generate: `contextkit generate`

When implementing features, search for relevant snippets first.
```

## Tips

- Use --json flag for machine-readable output
- Run `contextkit doctor` to verify installation
- Snippets persist across sessions in ~/.local/share/contextkit/

## Troubleshooting

If commands fail, run:
  contextkit doctor

This checks database, embeddings model, and config status.
