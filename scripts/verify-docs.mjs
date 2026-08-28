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
const [design, prompts, contract] = await Promise.all([
  readFile("DESIGN.md", "utf8"), readFile("PROMPTS.md", "utf8"), readFile("docs/api-contract.md", "utf8")
]);
const config = JSON.parse(await readFile(".codex/verification.json", "utf8"));
if (config.project !== "sezzle-calculator-takehome") throw new Error("wrong verification project");
if (config.tracking.required !== false) throw new Error("external tracking must remain disabled");
if (!config.contract.outcomes.every(({ checks }) => checks.length > 0)) throw new Error("unmapped outcome");
if (!design.includes("charcoal calculator") || !design.includes("orange operation keys")) throw new Error("design documentation does not match the implemented calculator");
if (!prompts.includes("Instructions given") || !prompts.includes("Final verification")) throw new Error("AI development steps are incomplete");
if (!contract.includes("64 fractional decimal places")) throw new Error("square-root precision is undocumented");
console.log(JSON.stringify({ status: "passed", evidence: "approved docs and local-only harness contract present" }));
