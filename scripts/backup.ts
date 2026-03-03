#!/usr/bin/env bun

/* Enable top-level await */
export {};

/**
 * Complete Directus backup: schema snapshot + database dump
 */

// Generate timestamp in YYYYMMDD-HHMMSS format
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, "-")
  .replace(/:/g, "")
  .slice(0, 15); // Format: YYYYMMDD-HHMMSS

const backupDir = `./cms/backups/${timestamp}`;

console.log(`💾 Creating complete Directus backup: ${timestamp}\n`);

// Create backup directory
const mkdirProc = Bun.spawn(["mkdir", "-p", backupDir], {
  stdout: "inherit",
  stderr: "inherit",
});
await mkdirProc.exited;

// 1. Create schema snapshot
console.log("📸 Creating schema snapshot...");
const snapshotPath = `/snapshots/${timestamp}-schema.yaml`;
const snapshotProc = Bun.spawn(
  [
    "docker",
    "compose",
    "exec",
    "-T",
    "directus",
    "npx",
    "directus",
    "schema",
    "snapshot",
    snapshotPath,
  ],
  {
    cwd: "./cms",
    stdout: "inherit",
    stderr: "inherit",
  },
);

let exitCode = await snapshotProc.exited;
if (exitCode !== 0) {
  console.error("❌ Schema snapshot failed");
  process.exit(exitCode);
}

// Move snapshot to backup directory
const mvSnapshotProc = Bun.spawn(
  [
    "mv",
    `./cms/snapshots/${timestamp}-schema.yaml`,
    `${backupDir}/schema.yaml`,
  ],
  {
    stdout: "inherit",
    stderr: "inherit",
  },
);
await mvSnapshotProc.exited;

console.log("✅ Schema snapshot created\n");

// 2. Copy SQLite database file
console.log("🗄️  Backing up database...");
const dbCopyProc = Bun.spawn(
  ["cp", "-r", "./cms/database", `${backupDir}/database`],
  {
    stdout: "inherit",
    stderr: "inherit",
  },
);

exitCode = await dbCopyProc.exited;
if (exitCode !== 0) {
  console.error("❌ Database backup failed");
  process.exit(exitCode);
}

console.log("✅ Database backed up\n");

// Create backup metadata
const metadata = {
  timestamp,
  date: now.toISOString(),
  type: "full",
  contents: {
    schema: "schema.yaml",
    database: "database/",
  },
};

await Bun.write(
  `${backupDir}/metadata.json`,
  JSON.stringify(metadata, null, 2),
);

console.log(`✨ Backup completed successfully!`);
console.log(`   Location: ${backupDir}`);
console.log(`   Schema: ${backupDir}/schema.yaml`);
console.log(`   Database: ${backupDir}/database/`);
