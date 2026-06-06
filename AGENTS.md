# Agent Operating Rules

This repository is developed by Codex agents. Follow these rules for every task:

- Create a task branch before changing files.
- Do not commit directly to `main` or `trunk`.
- Register every task mentioned in the current conversation and every new task as a GitHub issue before starting implementation, then execute the work by following the corresponding issue.
- Link each task PR to its corresponding issue with `Resolves #...`, `Refs #...`, or `Related to #...`; a PR may resolve multiple related issues when the implementation is naturally shared.
- At the start of every task, before implementation edits, run `git fetch origin` and merge `origin/main` into the task branch. Resolve any conflicts and run the relevant tests before continuing.
- Commit at meaningful step boundaries.
- Create a Draft PR early.
- Use TDD for gameplay, input, combat, collision, and rendering behavior changes: write or update a failing test before implementing the behavior.
- Add a task checklist to the PR body and update checklist items as they are completed.
- Leave PR comments with test results, review results, findings, and mitigation steps.
- Convert the PR to Ready For Review after implementation is complete.
- Run a final review before merge.
- Merge only when the final review has no blocking issues.
- Record specification changes and design decisions in `docs/`.
- Keep decisions documented so work can continue consistently across sessions.
- If a task depends on work from another PR, verify that the commit is reachable from the current branch before testing or reporting completion.
- Do not copy protected names, logos, characters, maps, or enemy designs from existing games.
- Keep TypeScript strict and keep gameplay state transitions testable.
- Centralize gameplay constants where practical.
- Prefer Three.js official APIs and avoid dependencies unless the design document explains why.
- When behavior changes, update docs and tests in the same task step.
- Follow the reusable development process in `docs/development-process.md` and keep project-specific specs separate from reusable guidance.

Current task branch: `codex/dark-souls-mvp`.
