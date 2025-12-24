## Issue Tracking with bd (beads)

It is important you use these instructions while executing your job as a coding agent. Beads should be your issue tracking software for getting work done.

1. Run `bd quickstart` at the start of every sesson to get context on how to use beads to do issue tracking while doing development work
2. As you find bugs, bad code, refactors that need to happen as you code, feel free to file them as beads.
   Use bd for ALL issue tracking. No markdown TODOs or external trackers.
3. Whenever you finish a bead issue, return to the user and present a menu to the user offering the user what issue (that is ready) they'd like to work on next, commit changes, or something else. Wait for the users response before continuing.
4. Treat beads issue descriptions like the description of a GitHub issue and follow all best practices - include relevant filepaths & line numbers, code snippets, and context about the plan so whoever picks up the issue can ramp up as efficiently as possible. You should specifically format the issue for a coding agent like Claude Code to read.

## When working in plan mode

1. Make sure to a single line in the plan about the first thing the coding agent should do when executing the plan is to document the work in beads (`bd` commands). Split up the work into epics, issues, and properly handle dependencies. Each beads issues description should reference the filepath of the plan.
2. Make sure to include a section in the plan called "High Level Requirements". This should be a concise section that tracks the requirements given by the user or suggested by you, the planner / coding agent. These should not be trivial requirements like "button should be gray" but we want to store the "must-haves" of the plan that the user provides.

# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
