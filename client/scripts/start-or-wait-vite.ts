#!/usr/bin/env bun

/**
 * Smart Vite starter: starts Vite if not running, or waits for it if already running
 * Cross-platform (works on macOS, Linux, Windows)
 */

const PORT = 1420;
const CHECK_INTERVAL = 2000; // 2 seconds

async function checkViteRunning(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${PORT}`, {
      signal: AbortSignal.timeout(1000),
    });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

async function waitForVite(): Promise<void> {
  console.log(`✅ Vite dev server already running on port ${PORT}`);
  console.log('   Waiting for it to stay available...');

  while (true) {
    const isRunning = await checkViteRunning();
    if (!isRunning) {
      console.error('⚠️  Vite dev server stopped');
      process.exit(1);
    }
    await Bun.sleep(CHECK_INTERVAL);
  }
}

async function startVite(): Promise<void> {
  console.log(`🚀 Starting Vite dev server on port ${PORT}...`);

  const proc = Bun.spawn(['bun', 'run', 'dev'], {
    stdout: 'inherit',
    stderr: 'inherit',
    stdin: 'inherit',
  });

  const exitCode = await proc.exited;
  process.exit(exitCode);
}

async function main() {
  const isRunning = await checkViteRunning();

  if (isRunning) {
    await waitForVite();
  } else {
    await startVite();
  }
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
