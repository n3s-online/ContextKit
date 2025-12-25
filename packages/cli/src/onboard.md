# ContextKit

Your goal: Configure this project's CLAUDE.md/AGENTS.md with relevant context snippets.

## Workflow

1. **Explore the project** - Check package.json, config files, etc. to identify the tech stack
2. **Search for snippets** - `contextkit search "nextjs" --json`
3. **Preview if needed** - `contextkit snippet <id>` to see full content
4. **Select relevant ones** - `contextkit select <id> <id> ...`
5. **Generate output** - `contextkit generate`
6. **Update context file** - Add the generated content to CLAUDE.md or AGENTS.md

## Commands

| Command | Description |
|---------|-------------|
| `search <query>` | Find snippets by topic (use `--json` for structured output) |
| `snippet <id>` | View a single snippet's full content |
| `select <id...>` | Add snippets to this project |
| `deselect <id...>` | Remove snippets from this project |
| `list` | Show currently selected snippets |
| `generate` | Output combined markdown for all selected snippets |
| `doctor` | Diagnose issues |

## Tips

- Search for frameworks, languages, conventions, and tools you see in the project
- Select snippets in priority order (they combine in selection order)
- Use `--json` flag for machine-readable output
