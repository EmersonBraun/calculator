# Full-stack calculator

Small full-stack calculator built to demonstrate reliable API and UI engineering.
The browser client is React + TypeScript; the API is Go. The service is
stateless and uses decimal strings at the boundary so values such as `0.1 +
0.2` remain exact.

## Run locally

Requirements: Go 1.22+, Node.js 22+, and npm.

```bash
cd backend
go run ./cmd/server
```

In a second terminal:

```bash
cd frontend
npm ci
npm run dev
```

The Vite client defaults to `http://localhost:8080`. Set
`VITE_API_BASE_URL` if the API runs elsewhere.

## Run with Docker

```bash
docker compose up --build
```

Open `http://localhost:4174`. The frontend container proxies `/api` and
`/healthz` to the healthy Go service.

## API examples

```bash
curl http://localhost:8080/healthz

curl -X POST http://localhost:8080/api/calculate \
  -H 'content-type: application/json' \
  -d '{"operation":"percentage","operands":["15","200"]}'
```

The complete request, response, operation, decimal, and error contract is in
[`docs/api-contract.md`](./docs/api-contract.md).

## Quality checks

```bash
cd backend && gofmt -w . && go test ./... && go vet ./...
cd frontend && npm test -- --run --coverage && npm run typecheck && npm run build
cd .. && node scripts/verify-docs.mjs
node scripts/browser-evidence.mjs
```

Coverage is measured independently for the Go and TypeScript layers. The
target is at least 90% statements per layer. The final harness also checks the
real endpoint, Docker wiring, and a real-browser review.

The browser check requires Playwright's Chromium binary. From `frontend`, run
`npx playwright install chromium` once if it is not already available.

## Decisions and limits

The design direction and product boundary are in [`DESIGN.md`](./DESIGN.md)
and [`PRODUCT.md`](./PRODUCT.md). Architectural trade-offs are recorded in
[`docs/adr`](./docs/adr), and the lightweight threat model is in
[`docs/security/threat-model.md`](./docs/security/threat-model.md).

There is intentionally no database, auth, history, payment processing, LLM,
agent runtime, or cloud deployment. These would add scope without supporting
the requested calculator behavior.

Assumptions: arithmetic follows immediate-execution calculator semantics;
operands are decimal strings up to 128 characters; powers accept integer
exponents from −100 to 100; square roots return up to 64 fractional places.
The calculator is designed for one user in a browser and stores no data.

## AI-assisted work

Development prompts and human verification status are recorded in
[`PROMPTS.md`](./PROMPTS.md). No AI runtime is included in the product.

## Submission boundary

This copy is local only. It has not been published, uploaded, or submitted.
