import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createWriteStream } from "node:fs";
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { finished } from "node:stream/promises";
import { setTimeout } from "node:timers/promises";
import { parseEnv } from "node:util";

// Exercise the real CLI, worker/SSR module graph and Vite optimizer.
// Storefront rendering and the Studio connection require separate checks.

const STARTUP_TIMEOUT_MS = 120_000;
const HTTP_TIMEOUT_MS = 60_000;
const FIRST_SSR_REQUEST_TIMEOUT_MS = 120_000;
const READINESS_POLL_INTERVAL_MS = 1000;
const SHUTDOWN_GRACE_MS = 10_000;

const listener = createServer();
listener.listen(0, "127.0.0.1");
await once(listener, "listening");
const { port } = listener.address();
await new Promise((resolve) => listener.close(resolve));

const logDirectory = await mkdtemp(join(tmpdir(), "aspen-dev-runtime-"));
const logPath = join(logDirectory, "dev.raw.log");
const diagnosticsPath =
  process.env.ASPEN_RUNTIME_LOG || join(logDirectory, "dev.log");
const envPath = join(logDirectory, "empty.env");
await writeFile(envPath, "", { mode: 0o600 });
const log = createWriteStream(logPath, { mode: 0o600 });
const child = spawn(
  process.execPath,
  [
    "node_modules/@shopify/cli/bin/run.js",
    "hydrogen",
    "dev",
    "--codegen",
    "--disable-version-check",
    "--entry",
    resolve("scripts/fixtures/runtime-worker.ts"),
    "--env-file",
    envPath,
    "--port",
    String(port),
  ],
  {
    detached: process.platform !== "win32",
    env: { ...process.env, SHOPIFY_CLI_NO_ANALYTICS: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
child.stdout.pipe(log, { end: false });
child.stderr.pipe(log, { end: false });
let spawnError;
child.on("error", (error) => {
  spawnError = error;
});

async function stopDevServer(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const closed = once(child, "close");
  if (process.platform === "win32") {
    const stop = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"]);
    await once(stop, "close");
    // taskkill can exit before the child's piped output has finished draining.
    await closed;
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch (error) {
    if (error.code !== "ESRCH") throw error;
  }
  const result = await Promise.race([
    closed,
    setTimeout(SHUTDOWN_GRACE_MS, "timeout", { ref: false }),
  ]);
  if (result === "timeout") process.kill(-child.pid, "SIGKILL");
  await closed;
}

/** Redact env-sourced secrets and strip query strings from saved diagnostics. */
async function writeSanitizedDiagnostics(logPath, diagnosticsPath) {
  const secretKey = /token|secret|password|api[_-]?key/i;
  const secrets = Object.entries(process.env)
    .filter(([key, value]) => secretKey.test(key) && value)
    .map(([, value]) => value);
  const localEnv = await readFile(".env", "utf8").catch(() => "");
  for (const [key, value] of Object.entries(parseEnv(localEnv))) {
    if (secretKey.test(key) && value) secrets.push(value);
  }
  let diagnostics = await readFile(logPath, "utf8");
  for (const secret of secrets.sort((a, b) => b.length - a.length)) {
    diagnostics = diagnostics.replaceAll(secret, "[REDACTED]");
  }
  diagnostics = diagnostics.replace(
    /https?:\/\/[^\s"'<>]+/g,
    (url) => url.split("?")[0],
  );
  await mkdir(dirname(diagnosticsPath), { recursive: true });
  await writeFile(diagnosticsPath, diagnostics, { mode: 0o600 });
}

try {
  const base = `http://localhost:${port}`;
  const deadline = Date.now() + STARTUP_TIMEOUT_MS;
  let ready = false;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    assert.equal(child.exitCode, null, "Hydrogen dev exited before readiness");
    assert.equal(child.signalCode, null, "Hydrogen dev stopped before readiness");
    try {
      const response = await fetch(`${base}/@vite/client`, {
        signal: AbortSignal.timeout(2000),
      });
      if (response.ok && (await response.text()).includes("createHotContext")) {
        ready = true;
        break;
      }
    } catch {
      // The listener is not ready yet; retry within the bounded startup window.
    }
    await setTimeout(READINESS_POLL_INTERVAL_MS);
  }
  assert.ok(ready, "Hydrogen dev did not serve the Vite client within 120s");

  const entry = await fetch(`${base}/app/entry.client.tsx`, {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  assert.equal(entry.status, 200, "Client entry failed to transform");
  const code = await entry.text();
  assert.match(
    code,
    /hydrateRoot/,
    "Client entry did not contain the app bootstrap",
  );
  const optimizedImport = code.match(/["']([^"']*\/\.vite\/deps\/[^"']+)["']/);
  assert.ok(
    optimizedImport,
    "Client entry did not reference optimized dependencies",
  );
  const dependency = await fetch(new URL(optimizedImport[1], base), {
    signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
  });
  assert.equal(dependency.status, 200, "Optimized dependency failed to load");
  await dependency.arrayBuffer();

  // The first request compiles the full SSR graph, including on slower hosts.
  const worker = await fetch(`${base}/__aspen_runtime_probe`, {
    signal: AbortSignal.timeout(FIRST_SSR_REQUEST_TIMEOUT_MS),
  });
  assert.equal(worker.status, 200, "Oxygen worker/SSR entry failed to execute");
  assert.deepEqual(await worker.json(), {
    serverConfigurationGuard: true,
    html: "<p>Aspen runtime check</p>",
    sanitizedHtml: "<p>safe</p>",
  });
  console.log(
    `${process.version}: Hydrogen worker/SSR, client transform and optimizer passed`,
  );
} catch (error) {
  console.error(`Dev runtime check failed. Diagnostics: ${diagnosticsPath}`);
  throw error;
} finally {
  await stopDevServer(child);
  log.end();
  await finished(log);
  await writeSanitizedDiagnostics(logPath, diagnosticsPath);
}
