# Calculator agent rules

## Mission

Build the calculator as a small, reliable artifact. The
product is a stateless React/TypeScript client backed by a Go REST service.
Optimize for correctness, clarity, accessibility, and an easy review.

## Non-negotiables

- Keep the product scope limited to the calculator contract in `docs/api-contract.md`.
- Validate every untrusted input at the API boundary and in the client before submission.
- Use decimal libraries, never binary floating-point for calculator results.
- Keep errors structured with stable machine-readable codes.
- Do not add a database, authentication, history, analytics, LLM call, payment behavior, or speculative framework.
- Do not include secrets, private workspace files, or application documents.
- Do not publish or deploy without explicit human approval.
- Preserve user-entered values after recoverable errors.
- Every new behavior needs a focused automated test and a runnable verification path.

## Source of truth

- `docs/api-contract.md`, `PRODUCT.md`, and `DESIGN.md` define the approved scope.
- `docs/api-contract.md` is the implementation contract for frontend and backend.
- `PRODUCT.md` and `DESIGN.md` define the approved UI direction.
- `CLAUDE.md` contains commands and repository navigation.
- If documents disagree, stop and ask Sol/Emerson; do not silently reinterpret scope.

## Ownership and workflow

Sol owns sequencing, contract integration, review, and final evidence.

- Luna backend may edit only `backend/**` and backend-specific tests/config.
- Luna frontend may edit only `frontend/**` and frontend-specific tests/config.
- Shared root files, contract docs, Docker, scripts, and verification config are Sol-owned unless explicitly delegated.
- Never edit a file concurrently with another agent.
- Work in this order: contract → required operations → optional operations → UI polish → Docker/evidence → adversarial review.

## Quality gates

Before calling the work complete, run the exact commands in `CLAUDE.md`, the
real endpoint smoke checks, the container smoke checks, and the real-browser
review at 375px and desktop width. A browser screenshot is supporting evidence,
not human visual approval. Keep the run in `AWAITING_HUMAN_APPROVAL` until
Emerson reviews the UI.

Use `go fmt`, `go vet`, strict TypeScript, deterministic tests, and separate
frontend/backend coverage. Never hide a coverage gap with a broad exclusion.

## Communication

Record AI-assisted prompts in `PROMPTS.md`. Report changed files, commands,
criterion-level evidence, unresolved gaps, and the next human action. Do not
claim completion from a passing build alone.
