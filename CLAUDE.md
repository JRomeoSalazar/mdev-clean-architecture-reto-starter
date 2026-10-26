# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

This is a **starter** for a Clean Architecture challenge (expense approval system). It currently contains only the spec, config and acceptance scenarios; there is no `src/` or `tests/` yet. The folder layout is intentionally left to the implementer: evaluation looks at who makes each decision and which way dependencies point.

Source documents (written in Spanish; read them before implementing):
- `ENUNCIADO.md`: business rules, mandatory use cases, technical constraints, grading weights.
- `requirements/expense-approval.feature`: Gherkin acceptance scenarios.
- `README.md`: expected deliverables.

## Commands

Uses Bun (1.2+).

```bash
bun install --frozen-lockfile
bun run typecheck          # tsc --noEmit (includes src and tests)
bun test                   # all tests
bun test path/to/file.test.ts          # single file
bun test -t "name pattern"             # single test by name
bun run start              # runs src/main.ts (the composition root; must be created)
```

## Constraints that shape the design

- `tsconfig.json` is very strict: `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noUnusedLocals/Parameters`. Zero `any` allowed. Path alias `@/*` maps to `src/*`.
- Domain must not depend on HTTP, frameworks, databases or SDKs.
- Use cases take application-owned contracts (DTOs) and reach persistence, notifications, clock and id generation only through ports. In-memory adapters are required, plus an explicit HTTP translation layer and a visible composition root (`src/main.ts`).
- Expected outcomes (e.g. forbidden actor, already resolved, missing rejection reason) are modeled explicitly as results, not exceptions. Validate data shape at the edges; enforce rules in the domain.
- Amounts are integers in euro **cents**. The `ENUNCIADO.md` thresholds (100 € / 1,000 €) are 10000 / 100000 cents. Categories: `travel`, `meals`, `equipment`, `training`, `personal`.
- Approval routing: `personal` is auto-rejected; <= 100 € auto-approved; <= 1,000 € needs `manager`; > 1,000 € needs `finance`. Nobody resolves their own request; resolved requests are immutable; manual rejection requires a reason; any resolution notifies the employee.
- The deliverable must also include a short written explanation of what happens if the expense is saved but the notification fails (outbox implementation not required).
- Tests are required at three levels: domain, use cases, and HTTP controllers.
