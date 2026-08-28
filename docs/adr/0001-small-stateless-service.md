# ADR 0001: Small stateless service

**Status:** Accepted  
**Date:** 2026-08-28

## Context

The project needs a complete full-stack path within a deliberately small scope.
There is no product requirement for persistence, accounts, history, or
background work.

## Decision

Use a stateless Go `net/http` service with a pure calculator domain and a React
client. Keep transport, domain, and UI concerns separate without introducing a
framework or service abstraction that has only one implementation.

## Alternatives considered

- A database-backed history feature: outside the requested behavior and adds
  failure modes with no review value.
- A web framework: useful at larger scale, but unnecessary for two endpoints.
- One full-stack runtime: less aligned with the explicit Go preference.

## Consequences

The artifact is easy to run and inspect, with no persistence concerns. It does
not demonstrate auth, scaling, or production deployment because those are not
part of this exercise.
