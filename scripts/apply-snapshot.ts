#!/usr/bin/env bun

/**
 * Cross-platform Directus snapshot applicator
 * Runs inside the Docker container
 */

/* oxlint-disable no-console */

// Get the snapshot filename from command line arguments
const [, , snapshotFile] = process.argv

if (!snapshotFile) {
  console.error('❌ Error: No snapshot file specified')
  console.log('\nUsage: bun run cms:apply-snapshot <snapshot-file>')
  console.log(
    'Example: bun run cms:apply-snapshot snapshots/20260302-143045.yaml',
  )
  console.log('\nAvailable snapshots:')

  // List available snapshots
  const snapshotsDir = './cms/snapshots'
  const files = await Array.fromAsync(
    new Bun.Glob('*.yaml').scan({ cwd: snapshotsDir }),
  )

  // oxlint-disable-next-line eslint/no-magic-numbers
  if (files.length === 0) {
    console.log('  (none found)')
  } else {
    files.toSorted().reverse() // Most recent first
    for (const file of files) {
      console.log(`  - ${file}`)
    }
  }

  process.exit(1) // oxlint-disable-line eslint/no-magic-numbers
}

// Resolve the snapshot path - extract just the filename
let filename: string
if (snapshotFile.includes('/')) {
  // Extract filename from path (e.g., "./cms/snapshots/file.yaml" -> "file.yaml")
  const parts = snapshotFile.split('/')
  const lastPart = parts.at(-1) // oxlint-disable-line eslint/no-magic-numbers
  if (!lastPart) {
    throw new Error('Filename not at end of path - is this a directory?')
  }
  filename = lastPart
} else {
  // Already just a filename
  filename = snapshotFile
}

// Path inside the Docker container
const snapshotPath = `/snapshots/${filename}`

console.log(`📥 Applying Directus snapshot from: ${snapshotFile}`)
console.log(`   Container path: ${snapshotPath}`)
console.log(
  '\n⚠️  Warning: This will modify your database schema. Make sure you have a backup!',
)

// Run the schema apply command inside the Directus Docker container
const proc = Bun.spawn(
  [
    'docker',
    'compose',
    'exec',
    'directus',
    'npx',
    'directus',
    'schema',
    'apply',
    snapshotPath,
    '--yes', // Auto-confirm
  ],
  {
    cwd: './cms',
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  },
)

const exitCode = await proc.exited

if (exitCode === 0) {
  console.log(`\n✅ Snapshot applied successfully!`)
} else {
  console.error(`\n❌ Snapshot application failed with exit code ${exitCode}`)
}

process.exit(exitCode)
