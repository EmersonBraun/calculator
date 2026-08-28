# Calculator project

Read [`AGENTS.md`](./AGENTS.md) before changing files.

## Layout

```text
backend/       Go REST service and domain tests
frontend/      React + TypeScript client and UI tests
docs/          API contract, product/design context, ADRs, threat model
scripts/       real endpoint, Docker, and browser evidence checks
.codex/        project verification contract and run evidence
```

## Local commands

```bash
cd backend && go test ./... && go vet ./...
cd frontend && npm test -- --run --coverage && npm run typecheck && npm run build
docker compose config
node scripts/verify-endpoint.mjs
node scripts/verify-docker.mjs
```

Run the shared harness from the project directory:

```bash
node /Users/rebecabraun/workspace/EmersonBraun/doc-bridge/bin/ak-verify.js run --config .codex/verification.json --json
```

The browser evidence check deliberately remains pending until a real browser
review is performed and Emerson approves the visual result.

## Implementation defaults

- Go `net/http` plus `github.com/shopspring/decimal`.
- React + TypeScript + Vite plus `decimal.js` for client-side validation/display.
- Vitest and Testing Library for frontend behavior.
- No runtime agent, model, database, or external service.

## Review focus

Check decimal exactness, stable error codes, operand arity, malformed JSON,
divide-by-zero, negative square root, keyboard navigation, mobile layout,
loading/error recovery, and Docker-to-API wiring.
