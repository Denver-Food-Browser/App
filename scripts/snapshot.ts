#!/usr/bin/env bun

/* Enable top-level await */
export {};

/**
 * Cross-platform Directus snapshot creator with timestamp
 * Runs inside the Docker container
 */

// Generate timestamp in YYYYMMDD-HHMMSS format
const now = new Date();
const timestamp = now
  .toISOString()
  .replace(/T/, "-")
  .replace(/:/g, "")
  .slice(0, 15); // Format: YYYYMMDD-HHMMSS

const snapshotFilename = `${timestamp}.yaml`;
const snapshotPath = `/snapshots/${snapshotFilename}`;

console.log(`📸 Creating Directus snapshot: snapshots/${snapshotFilename}`);

// Run the snapshot command inside the Directus Docker container
const proc = Bun.spawn(
  [
    "docker",
    "compose",
    "exec",
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
    stdin: "inherit",
  },
);

const exitCode = await proc.exited;

if (exitCode === 0) {
  console.log(
    `✅ Snapshot created successfully: cms/snapshots/${snapshotFilename}`,
  );
} else {
  console.error(`❌ Snapshot creation failed with exit code ${exitCode}`);
}

process.exit(exitCode);
