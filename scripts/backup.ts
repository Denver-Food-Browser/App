#!/usr/bin/env bun

/**
 * Complete Directus backup: schema snapshot + database dump
 */

/* oxlint-disable no-console */

// Generate timestamp in YYYYMMDD-HHMMSS format
const TIMESTAMP_LENGTH = 15 // YYYYMMDD-HHMMSS format length
const TIMESTAMP_START_INDEX = 0

// Generate timestamp in YYYYMMDD-HHMMSS format
const now = new Date()
const timestamp = now
  .toISOString()
  .replace(/T/, '-')
  .replaceAll(':', '')
  .slice(TIMESTAMP_START_INDEX, TIMESTAMP_LENGTH) // Format: YYYYMMDD-HHMMSS

const backupDir = `./cms/backups/${timestamp}`

console.log(`💾 Creating complete Directus backup: ${timestamp}\n`)

// Create backup directory
const mkdirProc = Bun.spawn(['mkdir', '-p', backupDir], {
  stderr: 'inherit',
  stdout: 'inherit',
})
await mkdirProc.exited

// 1. Create schema snapshot
console.log('📸 Creating schema snapshot...')
const snapshotPath = `/snapshots/${timestamp}-schema.yaml`
const snapshotProc = Bun.spawn(
  [
    'docker',
    'compose',
    'exec',
    '-T',
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
    stdout: 'inherit',
  },
)

let exitCode = await snapshotProc.exited
if (exitCode !== 0) {
  console.error('❌ Schema snapshot failed')
  process.exit(exitCode)
}

// Move snapshot to backup directory
const mvSnapshotProc = Bun.spawn(
  [
    'mv',
    `./cms/snapshots/${timestamp}-schema.yaml`,
    `${backupDir}/schema.yaml`,
  ],
  {
    stderr: 'inherit',
    stdout: 'inherit',
  },
)
await mvSnapshotProc.exited

console.log('✅ Schema snapshot created\n')

// 2. Copy SQLite database file
console.log('🗄️  Backing up database...')
const dbCopyProc = Bun.spawn(
  ['cp', '-r', './cms/database', `${backupDir}/database`],
  {
    stderr: 'inherit',
    stdout: 'inherit',
  },
)

exitCode = await dbCopyProc.exited
if (exitCode !== 0) {
  console.error('❌ Database backup failed')
  process.exit(exitCode)
}

console.log('✅ Database backed up\n')

// Create backup metadata
const metadata = {
  contents: {
    schema: 'schema.yaml',
    database: 'database/',
  },
  date: now.toISOString(),
  timestamp,
  type: 'full',
}

const TAB_LENGTH = 2
await Bun.write(
  `${backupDir}/metadata.json`,
  JSON.stringify(metadata, null, TAB_LENGTH),
)

console.log(`✨ Backup completed successfully!`)
console.log(`   Location: ${backupDir}`)
console.log(`   Schema: ${backupDir}/schema.yaml`)
console.log(`   Database: ${backupDir}/database/`)
