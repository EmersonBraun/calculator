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

const waitFor = async (url, init) => {
  let lastError;
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(url, init);
      if (response.ok) return response;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw lastError || new Error(`Timed out waiting for ${url}`);
};

const up = await run(["compose", "up", "--build", "-d"]);
if (up.code !== 0) throw new Error(`docker compose failed: ${up.stderr || up.stdout}`);
try {
  const health = await waitFor("http://127.0.0.1:4174/healthz");
  const result = await waitFor("http://127.0.0.1:4174/api/calculate", {
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
