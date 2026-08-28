import { readFile } from "node:fs/promises";
import { access } from "node:fs/promises";

const required = [
  "AGENTS.md",
  "CLAUDE.md",
  "PRODUCT.md",
  "DESIGN.md",
  "PROMPTS.md",
  "docs/api-contract.md",
  "docs/security/threat-model.md",
  "docs/adr/0001-small-stateless-service.md",
  "docs/adr/0002-decimal-boundary.md",
  "docs/adr/0003-no-runtime-llm.md",
  ".codex/verification.json",
];

for (const path of required) await access(path);
const config = JSON.parse(await readFile(".codex/verification.json", "utf8"));
if (config.project !== "sezzle-calculator-takehome") throw new Error("wrong verification project");
if (config.tracking.required !== false) throw new Error("external tracking must remain disabled");
if (!config.contract.outcomes.every(({ checks }) => checks.length > 0)) throw new Error("unmapped outcome");
console.log(JSON.stringify({ status: "passed", evidence: "approved docs and local-only harness contract present" }));
