#!/usr/bin/env bun

/* Enable top-level await */
export {};

/**
 * Cross-platform Directus seed runner
 * Handles authentication and runs seed scripts in sequence
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL || "http://localhost:8055";

// Read password securely from stdin (hidden input)
async function readPassword(promptText: string): Promise<string> {
  process.stdout.write(promptText);

  // Use stty to disable echo for password input
  const sttyProc = Bun.spawn(["stty", "-echo"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  await sttyProc.exited;

  // Read password
  const password = prompt("") || "";

  // Re-enable echo
  const sttyProc2 = Bun.spawn(["stty", "echo"], {
    stdin: "inherit",
    stdout: "inherit",
    stderr: "inherit",
  });
  await sttyProc2.exited;

  process.stdout.write("\n");
  return password;
}

// Get credentials from environment or prompt user
async function getCredentials() {
  const email =
    process.env.DIRECTUS_ADMIN_EMAIL || prompt("Enter admin email:");
  const password =
    process.env.DIRECTUS_ADMIN_PASSWORD ||
    (await readPassword("Enter admin password: "));

  if (!email || !password) {
    console.error(
      "❌ Error: Admin credentials are required.\n" +
        "   Set DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD environment variables,\n" +
        "   or run the script interactively to be prompted.",
    );
    process.exit(1);
  }

  return { email, password };
}

// Authenticate with Directus
async function authenticate(email: string, password: string): Promise<string> {
  console.log("🔐 Authenticating with Directus...");

  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Authentication failed: ${error}`);
  }

  const { data } = await res.json();
  console.log("✅ Authenticated\n");

  return data.access_token;
}

// Get list of seed files to run
async function getSeedFiles(): Promise<string[]> {
  const seedDir = "./cms/seed";
  const files = await Array.fromAsync(
    new Bun.Glob("*.ts").scan({ cwd: seedDir }),
  );

  return files.sort(); // Run in alphanumerical order
}

// Main seed function
async function main() {
  console.log("🌱 Directus Seed Runner\n");

  // Get credentials
  const { email, password } = await getCredentials();

  // Authenticate
  let accessToken: string;
  try {
    accessToken = await authenticate(email, password);
  } catch (error) {
    console.error(`❌ ${error}`);
    process.exit(1);
  }

  // Get seed files
  const seedFiles = await getSeedFiles();

  if (seedFiles.length === 0) {
    console.log("📭 No seed files found in cms/seed/");
    process.exit(0);
  }

  console.log(`📋 Found ${seedFiles.length} seed file(s):\n`);
  for (const file of seedFiles) {
    console.log(`   - ${file}`);
  }
  console.log("");

  // Run each seed file
  for (const file of seedFiles) {
    console.log(`🌱 Running seed: ${file}`);

    try {
      const seedModule = await import(`../cms/seed/${file}`);

      if (typeof seedModule.default !== "function") {
        console.error(
          `   ⚠️  Skipped: ${file} does not export a default function`,
        );
        continue;
      }

      await seedModule.default({
        accessToken,
        directusUrl: DIRECTUS_URL,
      });

      console.log(`   ✅ Completed: ${file}\n`);
    } catch (error) {
      console.error(`   ❌ Failed: ${file}`);
      console.error(`   Error: ${error}\n`);
      process.exit(1);
    }
  }

  console.log("✨ All seeds completed successfully!");
}

main().catch((error) => {
  console.error("❌ Seed runner failed:", error);
  process.exit(1);
});
