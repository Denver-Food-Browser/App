#!/usr/bin/env bun

/* oxlint-disable eslint/no-console */

/**
 * Cross-platform Directus snapshot creator with timestamp
 * Runs inside the Docker container
 */

// Generate timestamp in YYYYMMDD-HHMMSS format
const TIMESTAMP_LENGTH = 15 // YYYYMMDD-HHMMSS format length
const TIMESTAMP_START_INDEX = 0

const now = new Date()
const timestamp = now
  .toISOString()
  .replace(/T/, '-')
  .replaceAll(':', '')
  .slice(TIMESTAMP_START_INDEX, TIMESTAMP_LENGTH) // Format: YYYYMMDD-HHMMSS

const snapshotFilename = `${timestamp}.yaml`
const snapshotPath = `/snapshots/${snapshotFilename}`

console.log(`📸 Creating Directus snapshot: snapshots/${snapshotFilename}`)

// Run the snapshot command inside the Directus Docker container
const proc = Bun.spawn(
  [
    'docker',
    'compose',
    'exec',
    'directus',
    'npx',
    'directus',
    'schema',
    'snapshot',
    snapshotPath,
  ],
  {
    cwd: './cms',
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  },
)

const SUCCESS_EXIT_CODE = 0

const exitCode = await proc.exited

if (exitCode === SUCCESS_EXIT_CODE) {
  console.log(
    `✅ Snapshot created successfully: cms/snapshots/${snapshotFilename}`,
  )
} else {
  console.error(`❌ Snapshot creation failed with exit code ${exitCode}`)
}

process.exit(exitCode)
