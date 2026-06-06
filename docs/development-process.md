# Development Process

This process is intended to be reusable across Codex-led repositories. Project-specific rules can extend it, but should not be mixed into the reusable workflow unless they apply broadly.

## Task Intake

Every task starts as a GitHub issue before implementation begins. This includes tasks mentioned in the current conversation and new tasks discovered while working.

Issues should describe:

- The goal or problem.
- Relevant context.
- Completion criteria.
- Any known dependencies or blocked work.

Use issues for intent and acceptance criteria. Use pull requests for implementation progress, review, and verification.

## Issue and Pull Request Relationship

A pull request may resolve one issue or several related issues when the implementation is naturally shared.

Use explicit links in the PR body:

- `Resolves #...` when the PR fully completes an issue.
- `Refs #...` when the PR contributes to an issue but does not complete it.
- `Related to #...` when the PR is contextually connected.

Avoid forcing all work into one issue. Prefer smaller issues with clear completion criteria, then group them in a PR only when the code or documentation changes belong together.

## Branch and PR Flow

1. Create or switch to a task branch before changing files.
2. Fetch `origin` and merge `origin/main` into the task branch before implementation edits.
3. Create a draft PR early enough that the issue links, checklist, and plan are visible while work is in progress.
4. Keep a task checklist in the PR body and update it as items are completed.
5. Commit at meaningful step boundaries.
6. Leave PR comments with test results, review results, findings, and mitigation steps.
7. Convert the PR to Ready For Review only after implementation and verification are complete.
8. Run a final review before merge.
9. Merge only when the final review has no blocking issues.

## Documentation Rules

Document decisions in the most reusable location that accurately fits the decision:

- Reusable process decisions belong in this document.
- Reusable game-design structure belongs in `game-specification-guide.md`.
- Project-specific technical decisions belong in the project's architecture or testing documents.
- Project-specific game rules, naming, tuning, and scope belong in the project's game design documents.

When behavior changes, update docs and tests in the same task step.

## Testing Expectations

Use test-driven development for gameplay, input, combat, collision, and rendering behavior changes. Write or update a failing test before implementing the behavior.

For documentation-only changes, record that tests were not run because no runtime behavior changed.
