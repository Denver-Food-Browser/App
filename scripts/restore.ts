#!/usr/bin/env bun

/* oxlint-disable eslint/no-console */

/**
 * Restore Directus from backup: database + schema
 */

// Get the backup directory from command line arguments
const [, , backupDir] = process.argv

if (!backupDir) {
  console.error('❌ Error: No backup directory specified')
  console.log('\nUsage: bun run cms:restore <backup-directory>')
  console.log('Example: bun run cms:restore cms/backups/20260302-143045')
  console.log('\nAvailable backups:')

  // List available backups
  const backupsDir = './cms/backups'
  const entries = await Array.fromAsync(
    new Bun.Glob('*').scan({ cwd: backupsDir }),
  )

  const EMPTY = 0
  if (entries.length === EMPTY) {
    console.log('  (none found)')
  } else {
    const sortedEntries = entries.toSorted().toReversed() // Most recent first

    // Load all metadata in parallel
    const metadataPromises = sortedEntries.map(async (entry) => {
      const metadataPath = `${backupsDir}/${entry}/metadata.json`
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON file is untyped
        const metadata = await Bun.file(metadataPath).json()
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- JSON file is untyped
        return { entry, date: new Date(metadata.date).toLocaleString() }
      } catch {
        return { entry, date: null }
      }
    })

    const results = await Promise.all(metadataPromises)

    // Display results
    for (const result of results) {
      if (result.date) {
        console.log(`  - ${result.entry} (${result.date})`)
      } else {
        console.log(`  - ${result.entry}`)
      }
    }
  }

  const ERROR_CODE = 1
  process.exit(ERROR_CODE)
}

// Resolve backup path
let resolvedBackupDir: string
if (backupDir.startsWith('./') || backupDir.startsWith('/')) {
  resolvedBackupDir = backupDir
} else if (backupDir.includes('/')) {
  resolvedBackupDir = backupDir
} else {
  // Just a timestamp, assume it's in cms/backups
  resolvedBackupDir = `./cms/backups/${backupDir}`
}

// Check if backup exists
const schemaFile = `${resolvedBackupDir}/schema.yaml`
const databaseDir = `${resolvedBackupDir}/database`

console.log(`📥 Restoring Directus from backup: ${resolvedBackupDir}\n`)
console.log('⚠️  WARNING: This will REPLACE your current database and schema!')
console.log('   Make sure you have a backup of your current state.\n')

// Check files exist
const schemaExists = await Bun.file(schemaFile).exists()
const databaseExists = await Bun.file(`${databaseDir}/data.db`).exists()

if (!schemaExists || !databaseExists) {
  console.error('❌ Error: Backup files not found')
  if (!schemaExists) {
    console.error(`   Missing: ${schemaFile}`)
  }
  if (!databaseExists) {
    console.error(`   Missing: ${databaseDir}/data.db`)
  }
  process.exit(1)
}

// 1. Stop Directus to ensure database isn't locked
console.log('🛑 Stopping Directus...')
const stopProc = Bun.spawn(['docker', 'compose', 'stop', 'directus'], {
  cwd: './cms',
  stderr: 'inherit',
  stdout: 'inherit',
})
await stopProc.exited

// 2. Restore database by copying files
console.log('🗄️  Restoring database...')

// Remove current database
const rmProc = Bun.spawn(['rm', '-rf', './cms/database'], {
  stderr: 'inherit',
  stdout: 'inherit',
})
await rmProc.exited

// Copy backup database
const cpProc = Bun.spawn(['cp', '-r', databaseDir, './cms/database'], {
  stderr: 'inherit',
  stdout: 'inherit',
})

let exitCode = await cpProc.exited
if (exitCode !== 0) {
  console.error('❌ Database restore failed')
  process.exit(exitCode)
}

console.log('✅ Database restored\n')

// 3. Start Directus
console.log('🔄 Starting Directus...')
const startProc = Bun.spawn(['docker', 'compose', 'start', 'directus'], {
  cwd: './cms',
  stderr: 'inherit',
  stdout: 'inherit',
})

exitCode = await startProc.exited
if (exitCode !== 0) {
  console.error('❌ Start failed')
  process.exit(exitCode)
}

console.log('\n✨ Restore completed successfully!')
console.log(`   Restored from: ${resolvedBackupDir}`)
