# ADR 0003: No runtime LLM or agent layer

**Status:** Accepted  
**Date:** 2026-08-28

## Context

The user asked to use AgentsKit practices as reference, but the Sezzle prompt
requests a deterministic calculator and has a tight delivery window.

## Decision

Use the relevant reliability practices—explicit contracts, deterministic
validation, stable errors, focused tests, evidence, and human review—without
adding an LLM or agent runtime to the product. Development prompts are recorded
in `PROMPTS.md` for transparency.

## Consequences

The solution stays small and reproducible. It does not claim agent behavior or
AI capability that the take-home does not require.
