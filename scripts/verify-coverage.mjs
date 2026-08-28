import { access, readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

await exec("go", ["test", "./...", "-coverprofile=coverage.out"], { cwd: "backend" });
await access("backend/coverage.out");
await access("frontend/coverage/coverage-summary.json");
const summary = JSON.parse(await readFile("frontend/coverage/coverage-summary.json", "utf8"));
const backend = await readFile("backend/coverage.out", "utf8");
if (!backend.includes("mode: set")) throw new Error("backend coverage profile is missing");
const { stdout: backendReport } = await exec("go", ["tool", "cover", "-func=coverage.out"], { cwd: "backend" });
const backendTotal = Number(backendReport.match(/total:\s+\(statements\)\s+([\d.]+)%/)?.[1] ?? 0);
if (backendTotal < 90) throw new Error(`backend statement coverage is ${backendTotal}%`);
const frontendStatements = summary.total?.statements?.pct ?? 0;
if (frontendStatements < 90) throw new Error(`frontend statement coverage is ${frontendStatements}%`);
console.log(JSON.stringify({ status: "passed", metrics: { backendStatementCoverage: backendTotal, frontendStatementCoverage: frontendStatements } }));
