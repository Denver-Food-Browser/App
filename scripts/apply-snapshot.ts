#!/usr/bin/env bun

/* Enable top-level await */
export {};

/**
 * Cross-platform Directus snapshot applicator
 * Runs inside the Docker container
 */

// Get the snapshot filename from command line arguments
const snapshotFile = process.argv[2];

if (!snapshotFile) {
  console.error("❌ Error: No snapshot file specified");
  console.log("\nUsage: bun run cms:apply-snapshot <snapshot-file>");
  console.log(
    "Example: bun run cms:apply-snapshot snapshots/20260302-143045.yaml",
  );
  console.log("\nAvailable snapshots:");

  // List available snapshots
  const snapshotsDir = "./cms/snapshots";
  const files = await Array.fromAsync(
    new Bun.Glob("*.yaml").scan({ cwd: snapshotsDir }),
  );

  if (files.length === 0) {
    console.log("  (none found)");
  } else {
    files.sort().reverse(); // Most recent first
    for (const file of files) {
      console.log(`  - ${file}`);
    }
  }

  process.exit(1);
}

// Resolve the snapshot path - extract just the filename
let filename: string;
if (snapshotFile.includes("/")) {
  // Extract filename from path (e.g., "./cms/snapshots/file.yaml" -> "file.yaml")
  const parts = snapshotFile.split("/");
  filename = parts[parts.length - 1];
} else {
  // Already just a filename
  filename = snapshotFile;
}

// Path inside the Docker container
const snapshotPath = `/snapshots/${filename}`;

console.log(`📥 Applying Directus snapshot from: ${snapshotFile}`);
console.log(`   Container path: ${snapshotPath}`);
console.log(
  "\n⚠️  Warning: This will modify your database schema. Make sure you have a backup!",
);

// Run the schema apply command inside the Directus Docker container
const proc = Bun.spawn(
  [
    "docker",
    "compose",
    "exec",
    "directus",
    "npx",
    "directus",
    "schema",
    "apply",
    snapshotPath,
    "--yes", // Auto-confirm
  ],
  {
    cwd: "./cms",
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  },
);

const exitCode = await proc.exited;

if (exitCode === 0) {
  console.log(`\n✅ Snapshot applied successfully!`);
} else {
  console.error(`\n❌ Snapshot application failed with exit code ${exitCode}`);
}

process.exit(exitCode);
