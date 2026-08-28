import { spawn } from "node:child_process";

const port = 18080;
const base = `http://127.0.0.1:${port}`;
const child = spawn("go", ["run", "./cmd/server"], {
  cwd: "backend",
  env: { ...process.env, PORT: String(port) },
  stdio: "ignore",
});

const stop = () => child.kill("SIGTERM");
process.on("exit", stop);
process.on("SIGINT", () => { stop(); process.exit(130); });

try {
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`${base}/healthz`);
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  if (!ready) throw new Error("service did not become ready");

  const health = await fetch(`${base}/healthz`).then((response) => response.json());
  if (health.status !== "ok") throw new Error("health contract failed");

  const calculation = await fetch(`${base}/api/calculate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "add", operands: ["0.1", "0.2"] }),
  });
  const body = await calculation.json();
  if (calculation.status !== 200 || body.result !== "0.3") throw new Error("exact add contract failed");

  const zero = await fetch(`${base}/api/calculate`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ operation: "divide", operands: ["1", "0"] }),
  });
  const zeroBody = await zero.json();
  if (zero.status !== 400 || zeroBody.error?.code !== "DIVISION_BY_ZERO") throw new Error("division error contract failed");

  console.log(JSON.stringify({ status: "passed", evidence: ["healthz", "exact addition", "division-by-zero error"] }));
} finally {
  stop();
}
