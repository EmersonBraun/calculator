# AI-assisted development log

This log is maintained as part of the take-home deliverable. It records the
purpose and verification of prompts used during development; it is not runtime
product behavior.

| ID | Role | Prompt purpose | Human verification |
| --- | --- | --- | --- |
| P-001 | Sol/orchestrator | Convert the approved take-home requirements into a minimal contract, ADRs, and issue slices. | Emerson reviewed and approved the PRD and local issue plan. |
| P-002 | Luna/backend | Implement the documented Go API and decimal domain with tests in the backend scope only. | Sol reviewed the implementation; Go tests, vet, endpoint smoke, and 94.6% backend statements passed. |
| P-003 | Luna/frontend | Implement the documented React client with accessible responsive UI and tests in the frontend scope only. | Sol reviewed the implementation; 13 frontend tests, typecheck, build, and 95.29% frontend statements passed. |
| P-004 | Sol/reviewer | Run adversarial review against arithmetic, contract, Docker, accessibility, and evidence gates. | Docker and real browser checks passed; human visual approval remains the only open gate. |
