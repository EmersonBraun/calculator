# ADR 0002: Decimal strings at the API boundary

**Status:** Accepted  
**Date:** 2026-08-28

## Context

Payments-oriented software must not silently change decimal values through
binary floating-point conversions. JavaScript `number` and Go `float64` would
make that failure easy to introduce.

## Decision

Transport operands and results as decimal strings. Perform arithmetic with
`shopspring/decimal` in Go and `decimal.js` in the client. Enforce documented
input, exponent, and result bounds at the service boundary.

## Consequences

The contract is explicit and exact for ordinary decimal inputs. The client has
slightly more formatting code, and arbitrary-precision values are intentionally
bounded for predictable resource use.
