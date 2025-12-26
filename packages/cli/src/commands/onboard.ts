import { Command } from "commander";
import { program, output, isJsonOutput, printBlock } from "../index";
import fs from "fs";
import path from "path";

function detectContextFile(): string {
  const cwd = process.cwd();
  const claudeMd = fs.existsSync(path.join(cwd, "CLAUDE.md"));
  const agentsMd = fs.existsSync(path.join(cwd, "AGENTS.md"));

  // Deterministic: prefer CLAUDE.md if both exist
  if (claudeMd) return "CLAUDE.md";
  if (agentsMd) return "AGENTS.md";
  return "AGENTS.md (create it)";
}

const ONBOARD_TEMPLATE = `# ContextKit - AI Agent Onboarding

**Context file:** {{CONTEXT_FILE}}

**Goal**: Add reusable coding patterns to this project's context file.

## Workflow

1. Explore project (package.json, configs) to identify tech stack
2. Search: \`contextkit search "typescript react" --json\`
3. Select: \`contextkit select <id> <id> ...\`
4. Generate: \`contextkit generate\`
5. **Add the ENTIRE output from step 4 to {{CONTEXT_FILE}}**

## Example Session

\`\`\`bash
# 1. Explore the project
Look through the entire project to identify the tech stack.

# 2. Search for relevant snippets
contextkit search "typescript" --json
contextkit search "nextjs" --json
# Output shows: builtin-typescript (score 0.52), builtin-nextjs (score 0.46)

# 3. Select matching snippets
contextkit select builtin-typescript builtin-nextjs
# Output: Added 2 snippets

# 4. Generate the content
contextkit generate
\`\`\`

**Step 4 outputs markdown like this:**

\`\`\`
# ContextKit - Selected Snippets

## TypeScript Project Setup

**ID:** \\\`builtin-typescript\\\`
**Tags:** typescript, javascript

(typescript configuration patterns, tsconfig settings, type safety tips...)

---

## Next.js App Router Best Practices

**ID:** \\\`builtin-nextjs\\\`
**Tags:** nextjs, react, web

(next.js patterns, server vs client components, data fetching...)
\`\`\`

**YOUR TASK: Put the ENTIRE output above into {{CONTEXT_FILE}}.**

This is domain knowledge for future AI agents - NOT instructions about ContextKit.
`;

program
  .command("onboard")
  .description("Show setup guide for AI agents")
  .action(function (this: Command) {
    const cmd = this;
    const contextFile = detectContextFile();
    const guide = ONBOARD_TEMPLATE.replace(
      /\{\{CONTEXT_FILE\}\}/g,
      contextFile
    );

    if (isJsonOutput(cmd)) {
      output(cmd, {
        contextFile,
        guide: guide.trim(),
        commands: [
          { name: "search", args: "<query>", description: "Semantic search" },
          { name: "select", args: "<id...>", description: "Add to selection" },
          { name: "list", args: "", description: "Show selection" },
          { name: "generate", args: "", description: "Output markdown" },
          { name: "doctor", args: "", description: "Health check" },
        ],
      });
    } else {
      printBlock(guide.trim());
    }
  });
