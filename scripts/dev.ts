#!/usr/bin/env bun

/** Enable top-level await */
export {};

/**
 * Cross-platform development script
 * Starts Directus and Tauri dev server for Desktop, Android, or iOS
 */

type Platform = "desktop" | "android" | "ios";

const DIRECTUS_URL = "http://localhost:8055/server/health";
const VITE_PORT = 1420;

// Get platform from command line argument
const platform = (process.argv[2] || "desktop") as Platform;

const platformConfig = {
  desktop: {
    emoji: "🖥️",
    name: "Desktop",
    command: ["bun", "run", "tauri", "dev"] as string[],
  },
  android: {
    emoji: "🤖",
    name: "Android",
    command: ["bun", "run", "tauri", "android", "dev"] as string[],
  },
  ios: {
    emoji: "📱",
    name: "iOS",
    command: null as string[] | null, // Handled by bash script
  },
};

const config = platformConfig[platform];

console.log(
  `🚀 Starting Denver Food Browser development environment (${config.name})...`,
);

// Check if environment is configured
const envPath = "./client/.env";
const envExists = await Bun.file(envPath).exists();

if (!envExists) {
  console.log("\n📝 Configuring environment...");
  await Bun.spawn(["bun", "scripts/setup-env.ts"], {
    stdout: "inherit",
    stderr: "inherit",
  }).exited;
} else {
  console.log("\n📝 Environment already configured (skipping setup-env)");
  console.log("   Run 'bun run setup-env' manually if you need to reconfigure");
}

// Check if Directus is already running
console.log("\n🔍 Checking Directus status...");
let directusRunning = false;

try {
  const response = await fetch(DIRECTUS_URL, {
    signal: AbortSignal.timeout(2000),
  });
  directusRunning = response.ok;
} catch {
  directusRunning = false;
}

if (directusRunning) {
  console.log("✅ Directus already running and healthy");
} else {
  console.log("\n🐳 Starting Directus (Docker Compose)...");

  // Start Docker Compose
  await Bun.spawn(["docker", "compose", "up", "-d"], {
    cwd: "./cms",
    stdout: "inherit",
    stderr: "inherit",
  }).exited;

  // Wait for Directus to be healthy
  console.log("\n⏳ Waiting for Directus to be ready...");
  let attempts = 0;
  const maxAttempts = 60; // 60 seconds timeout

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(DIRECTUS_URL, {
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) {
        console.log("\n✅ Directus is ready!");
        break;
      }
    } catch {
      // Not ready yet
    }

    process.stdout.write(".");
    await Bun.sleep(1000);
    attempts++;
  }

  if (attempts >= maxAttempts) {
    console.error("\n❌ Directus failed to start within 60 seconds");
    process.exit(1);
  }
}

// For iOS, delegate to platform-specific bash script
if (platform === "ios") {
  console.log(`\n${config.emoji} Delegating to iOS-specific script...\n`);

  const iosProc = Bun.spawn(["bash", "scripts/ios.sh"], {
    stdout: "inherit",
    stderr: "inherit",
    stdin: "inherit",
  });

  // For iOS, handle cleanup (just kill the iOS process, leave Directus running)
  const iosCleanup = async () => {
    console.log("\n🛑 Stopping iOS dev server...");
    console.log(
      '   (Directus will continue running - use "bun run cms:down" to stop it)',
    );
    iosProc.kill();
    process.exit(0);
  };

  process.on("SIGINT", iosCleanup);
  process.on("SIGTERM", iosCleanup);

  const exitCode = await iosProc.exited;
  process.exit(exitCode);
}

// Start Tauri dev server for Desktop/Android
console.log(`\n${config.emoji} Starting Tauri ${config.name} dev server...\n`);

const proc = Bun.spawn(config.command!, {
  cwd: "./client",
  stdout: "pipe",
  stderr: "pipe",
  stdin: "inherit",
});

// Track readiness state
let viteReady = false;
let cargoReady = false;
let appDeployed = false;
let readyMessageShown = false;

// Process output line by line
const processOutput = async (stream: ReadableStream<Uint8Array>) => {
  const decoder = new TextDecoder();
  const reader = stream.getReader();

  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        console.log(line);

        // Check if Vite is ready
        if (
          line.includes("Local:") &&
          line.includes(`http://localhost:${VITE_PORT}`)
        ) {
          viteReady = true;
        }

        // Check if Tauri finished compiling
        if (line.match(/(Finished|finished).*(dev|debug)/)) {
          cargoReady = true;
        }

        // Check for app deployment
        if (platform === "android") {
          if (
            line.match(/(Starting:|Activity.*started|successfully installed)/)
          ) {
            appDeployed = true;
          }
        } else {
          // Desktop: Mark as deployed when cargo finishes
          if (cargoReady) {
            appDeployed = true;
          }
        }

        // Show ready message
        if (viteReady && cargoReady && appDeployed && !readyMessageShown) {
          readyMessageShown = true;
          console.log("");
          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          );
          console.log("✨ Development environment ready!");
          console.log("");

          if (platform === "android") {
            console.log("🤖 App deployed and running on Android emulator");
            console.log("   • Web Browser: http://localhost:1420");
            console.log("   • Directus Admin: http://localhost:8055");
            console.log(
              "   • Note: Android uses http://10.0.2.2:8055 to reach Directus",
            );
          } else {
            console.log("📱 Development Options:");
            console.log("   • Desktop: Tauri app should be launching now");
            console.log(`   • Web Browser: http://localhost:${VITE_PORT}`);
            console.log("   • Directus Admin: http://localhost:8055");
          }

          console.log("");
          console.log("💡 Press Ctrl+C to stop all services");
          console.log(
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
          );
          console.log("");
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
};

// Process both stdout and stderr
Promise.all([processOutput(proc.stdout), processOutput(proc.stderr)]);

// Handle cleanup on exit (leave Directus running)
const cleanup = async () => {
  console.log("\n🛑 Stopping dev server...");
  console.log(
    '   (Directus will continue running - use "bun run cms:down" to stop it)',
  );
  proc.kill();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

// Wait for process to exit
const exitCode = await proc.exited;
process.exit(exitCode);
