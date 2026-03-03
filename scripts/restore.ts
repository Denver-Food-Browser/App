#!/usr/bin/env bun

/* Enable top-level await */
export {};

/**
 * Restore Directus from backup: database + schema
 */

// Get the backup directory from command line arguments
const backupDir = process.argv[2];

if (!backupDir) {
  console.error("❌ Error: No backup directory specified");
  console.log("\nUsage: bun run cms:restore <backup-directory>");
  console.log("Example: bun run cms:restore cms/backups/20260302-143045");
  console.log("\nAvailable backups:");

  // List available backups
  const backupsDir = "./cms/backups";
  const entries = await Array.fromAsync(
    new Bun.Glob("*").scan({ cwd: backupsDir }),
  );

  if (entries.length === 0) {
    console.log("  (none found)");
  } else {
    entries.sort().reverse(); // Most recent first
    for (const entry of entries) {
      // Check if it's a directory with metadata
      const metadataPath = `${backupsDir}/${entry}/metadata.json`;
      try {
        const metadata = await Bun.file(metadataPath).json();
        console.log(`  - ${entry} (${new Date(metadata.date).toLocaleString()})`);
      } catch {
        console.log(`  - ${entry}`);
      }
    }
  }

  process.exit(1);
}

// Resolve backup path
let resolvedBackupDir: string;
if (backupDir.startsWith("./") || backupDir.startsWith("/")) {
  resolvedBackupDir = backupDir;
} else if (backupDir.includes("/")) {
  resolvedBackupDir = backupDir;
} else {
  // Just a timestamp, assume it's in cms/backups
  resolvedBackupDir = `./cms/backups/${backupDir}`;
}

// Check if backup exists
const schemaFile = `${resolvedBackupDir}/schema.yaml`;
const databaseDir = `${resolvedBackupDir}/database`;

console.log(`📥 Restoring Directus from backup: ${resolvedBackupDir}\n`);
console.log(
  "⚠️  WARNING: This will REPLACE your current database and schema!",
);
console.log("   Make sure you have a backup of your current state.\n");

// Check files exist
const schemaExists = await Bun.file(schemaFile).exists();
const databaseExists = await Bun.file(`${databaseDir}/data.db`).exists();

if (!schemaExists || !databaseExists) {
  console.error("❌ Error: Backup files not found");
  if (!schemaExists) console.error(`   Missing: ${schemaFile}`);
  if (!databaseExists) console.error(`   Missing: ${databaseDir}/data.db`);
  process.exit(1);
}

// 1. Stop Directus to ensure database isn't locked
console.log("🛑 Stopping Directus...");
const stopProc = Bun.spawn(["docker", "compose", "stop", "directus"], {
  cwd: "./cms",
  stdout: "inherit",
  stderr: "inherit",
});
await stopProc.exited;

// 2. Restore database by copying files
console.log("🗄️  Restoring database...");

// Remove current database
const rmProc = Bun.spawn(["rm", "-rf", "./cms/database"], {
  stdout: "inherit",
  stderr: "inherit",
});
await rmProc.exited;

// Copy backup database
const cpProc = Bun.spawn(["cp", "-r", databaseDir, "./cms/database"], {
  stdout: "inherit",
  stderr: "inherit",
});

let exitCode = await cpProc.exited;
if (exitCode !== 0) {
  console.error("❌ Database restore failed");
  process.exit(exitCode);
}

console.log("✅ Database restored\n");

// 3. Start Directus
console.log("🔄 Starting Directus...");
const startProc = Bun.spawn(["docker", "compose", "start", "directus"], {
  cwd: "./cms",
  stdout: "inherit",
  stderr: "inherit",
});

exitCode = await startProc.exited;
if (exitCode !== 0) {
  console.error("❌ Start failed");
  process.exit(exitCode);
}

console.log("\n✨ Restore completed successfully!");
console.log(`   Restored from: ${resolvedBackupDir}`);
