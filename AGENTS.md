# Agent Operating Rules

This repository is developed by Codex agents. Follow these rules for every task:

- Create a task branch before changing files.
- Do not commit directly to `main` or `trunk`.
- Commit at meaningful step boundaries.
- Create a Draft PR early.
- Leave PR comments with test results, review results, findings, and mitigation steps.
- Convert the PR to Ready For Review after implementation is complete.
- Run a final review before merge.
- Merge only when the final review has no blocking issues.
- Record specification changes and design decisions in `docs/`.
- Keep decisions documented so work can continue consistently across sessions.
- Do not copy protected names, logos, characters, maps, or enemy designs from existing games.
- Keep TypeScript strict and keep gameplay state transitions testable.
- Centralize gameplay constants where practical.
- Prefer Three.js official APIs and avoid dependencies unless the design document explains why.
- When behavior changes, update docs and tests in the same task step.

Current task branch: `codex/dark-souls-mvp`.
