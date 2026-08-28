import { spawn } from "node:child_process";

const run = (args) => new Promise((resolve, reject) => {
  const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout += chunk; });
  child.stderr.on("data", (chunk) => { stderr += chunk; });
  child.on("error", reject);
  child.on("close", (code) => resolve({ code, stdout, stderr }));
});

const up = await run(["compose", "up", "--build", "-d"]);
if (up.code !== 0) throw new Error(`docker compose failed: ${up.stderr || up.stdout}`);
try {
  const health = await fetch("http://127.0.0.1:4173/healthz");
  const result = await fetch("http://127.0.0.1:4173/api/calculate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "percentage", operands: ["15", "200"] }),
  });
  const body = await result.json();
  if (!health.ok || result.status !== 200 || body.result !== "30") throw new Error("container contract failed");
  console.log(JSON.stringify({ status: "passed", evidence: ["container health", "frontend-to-api proxy", "percentage"] }));
} finally {
  await run(["compose", "down"]);
}
