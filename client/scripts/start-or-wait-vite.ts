#!/usr/bin/env bun

/* oxlint-disable eslint/no-console */

/**
 * Smart Vite starter: starts Vite if not running, or waits for it if already running
 * Cross-platform (works on macOS, Linux, Windows)
 */

const PORT = 1420
const CHECK_INTERVAL = 2000 // 2 seconds
const FETCH_TIMEOUT = 1000 // 1 second
const SERVER_ERROR_THRESHOLD = 500

async function checkViteRunning(): Promise<boolean> {
  try {
    const response = await fetch(`http://localhost:${PORT}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    })
    return response.ok || response.status < SERVER_ERROR_THRESHOLD
  } catch {
    return false
  }
}

async function waitForVite(): Promise<void> {
  console.log(`✅ Vite dev server already running on port ${PORT}`)
  console.log('   Waiting for it to stay available...')

  while (true) {
    const isRunning = await checkViteRunning() // eslint-disable-line no-await-in-loop
    if (!isRunning) {
      console.error('⚠️  Vite dev server stopped')
      process.exit(1)
    }
    await Bun.sleep(CHECK_INTERVAL) // eslint-disable-line no-await-in-loop
  }
}

async function startVite(): Promise<void> {
  console.log(`🚀 Starting Vite dev server on port ${PORT}...`)

  const proc = Bun.spawn(['bun', 'run', 'dev'], {
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  })

  const exitCode = await proc.exited
  process.exit(exitCode)
}

async function main() {
  const isRunning = await checkViteRunning()

  if (isRunning) {
    await waitForVite()
  } else {
    await startVite()
  }
}

main().catch((error: unknown) => {
  console.error('Error:', error)
  process.exit(1)
})
