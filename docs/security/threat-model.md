# Lightweight threat model

## Assets

- Calculator correctness and API availability.
- Local developer machine and source code.
- User-entered numeric input.

## Trust boundaries

1. Browser input crosses into the Go API.
2. JSON request bodies cross the HTTP parser boundary.
3. Docker networking connects the frontend container to the API container.

## Threats and controls

| Threat | Control |
| --- | --- |
| Malformed or oversized JSON | Content type check, bounded body, strict decode, unknown-field rejection |
| Invalid or non-finite numbers | Decimal-string grammar and size validation before arithmetic |
| Divide by zero or invalid square root | Explicit domain errors with stable codes |
| Resource exhaustion through exponent/result size | Exponent and operand/result bounds |
| Misleading client-only result | API remains source of truth; client validation mirrors contract |
| Cross-origin local development surprises | Narrow development CORS policy, documented local origins |
| Secret leakage | No secrets or private documents in the artifact |

## Accepted limits

This is a local take-home, not a public production service. It has no user
authentication, rate limiting, persistence, TLS termination, or audit log; those
are outside the approved scope and would be required before public deployment.
