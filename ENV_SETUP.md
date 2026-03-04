# Environment Setup Guide

This guide explains how the environment configuration works for the Denver Food Browser app, particularly for mobile development with an API service running in Docker. For video walkthrough, visit https://drive.google.com/file/d/14NLqYK8BmVEM2x-tbu0S7xnTuZ-AndIO/view

## Problems

When developing a mobile app with a backend:

- `localhost` doesn't work in mobile simulators/emulators (they have their own network stack)
- You need to use your machine's local IP address to reach the API
- CORS needs to be configured correctly within the API service
- Port collisions often prevent developers from testing cross-platform simultaneously

## Solutions

This repo features automated environment configuration with a pre-build script that:

1. Detects your local IP address
2. Updates the client `.env` with the correct Directus URL
3. Updates the CMS `.env` with CORS origins and public URLs
4. All processes share a development server (Vite) and an API service (Directus), so that hot-reloaded changes can propagate to web, iOS, and Android at the same time and platform-specific bugs can be caught immediately.

## Usage

### Quick Start

From the **project root**, run:

```bash
# iOS simulator (macOS only)
bun run dev:ios

# Android emulator
bun run dev:android

# Desktop development
bun run dev
```

That's it! This single command:

1. Auto-detects your local IP
2. Configures environment files (skipped if already configured)
3. Starts Directus in Docker if not already running and waits for it to be healthy
4. Starts the Tauri dev server for your chosen platform

**For iOS:** You'll be prompted to select an iPhone simulator. If the selected simulator isn't booted, it will be booted automatically. If exactly one simulator is already booted, it will be used automatically without prompting.

**For Android:** The emulator selection is handled by Tauri's standard prompt.

**Shared Vite Server:** Multiple platforms can share a single Vite dev server. The scripts automatically detect if Vite is already running and reuse it, allowing you to run iOS, Android, and Desktop simultaneously without conflicts.

Press `Ctrl+C` to stop the dev server. **Note:** Directus will continue running in the background. Use `bun run cms:down` to stop it.

### Alternative: Manual Control

If you prefer to control services separately:

```bash
# Setup environment
bun run setup-env

# Start Directus only
bun run cms:up

# In another terminal, start Tauri
bun run tauri:dev
```

## What Gets Updated

### Client `.env`

- `PUBLIC_API_HOST` - Set to `http://<your-local-ip>:8055`

### CMS `.env`

- `PUBLIC_URL` - Set to `http://<your-local-ip>:8055`
- `CORS_ORIGIN` - Set to allow both local IP and localhost on ports 1420 and 3000
- `PUBLIC_CLIENT_URL` - Set to `http://<your-local-ip>:1420`

## Platform-Specific Notes

### iOS Simulator (macOS)

**Requirements:**

- macOS with Xcode installed
- iOS simulator(s) available

**Features:**

- Automatic device selection if only one simulator is booted
- Interactive device picker if no or multiple simulators are booted
- Automatic simulator booting if selected device isn't running
- Works automatically with the detected local IP

**Debugging:**
The dev server shows instructions for using Safari's Web Inspector to debug the iOS app:

1. Open Safari
2. Go to Develop > Simulator > [Device Name] > localhost
3. (If Develop menu is hidden: Safari > Settings > Advanced > Show Develop menu)

### Android Emulator

**Network Configuration:**
Android emulators use `10.0.2.2` as a special alias for the host machine. The app is configured to use this automatically for Android builds. The dev server includes a note about this in the success message.

**Web Development:**
You can also test the app in a web browser at `http://localhost:1420` while the dev server is running.

### Desktop

Works with `http://localhost:1420`. You can test in either:

- The Tauri desktop app (launches automatically)
- A web browser at `http://localhost:1420`

### Physical Devices

For testing on physical devices connected to the same network, the auto-detected IP should work. Ensure:

1. Your device is on the same WiFi network
2. Your firewall allows connections on port 8055 and 1420

## Accessing Environment Variables in Code

In your Svelte components, use SvelteKit's built-in environment module:

```svelte
<script lang="ts">
  import { env } from '$env/dynamic/public';

  const apiHost = env.PUBLIC_API_HOST;

  async function fetchData() {
    const response = await fetch(`${apiHost}/items/your-collection`);
    // ...
  }
</script>
```

## Troubleshooting

### Cannot connect to Directus from simulator

1. Check your local IP:

   ```bash
   # macOS
   ipconfig getifaddr en0

   # Linux
   hostname -I | awk '{print $1}'
   ```

2. Verify Directus is running:

   ```bash
   cd cms
   docker compose up
   ```

3. Test the connection from your host machine:
   ```bash
   curl http://<your-ip>:8055/server/health
   ```

### CORS errors

1. Make sure you ran `bun run setup-env` or restarted your dev server
2. Check `cms/.env` has your IP in `CORS_ORIGIN`
3. Restart the Docker containers:
   ```bash
   cd cms
   docker compose restart
   ```

### Script can't detect IP

If the script shows `localhost` instead of your IP:

1. Check your network connection
2. Manually set the IP in both `.env` files

## Development Workflow

### Standard Development

```bash
# From project root
bun run dev           # Desktop
bun run dev:ios       # iOS (macOS only)
bun run dev:android   # Android
```

These commands start everything you need. When you press `Ctrl+C`, it stops the dev server but **leaves Directus running** for faster restarts.

### Running Multiple Platforms Simultaneously

You can run multiple platforms at the same time so that platform-specific bugs can be caught immediately! They will automatically share:

- A single Vite dev server (port 1420) - client-side hot-module replacement
- A single Directus instance (port 8055) - API service

Example:

```bash
# Terminal 1
bun run dev:ios

# Terminal 2 (after iOS is running)
bun run dev:android

# Terminal 3 (after iOS and Android are running)
bun run dev
```

All platforms will share the same Vite and Directus instances.

### Stopping Services

**Stop dev server only:** Press `Ctrl+C` in the terminal running the dev command.

**Stop Directus:** Directus keeps running in the background for faster restarts. To stop it:

```bash
bun run cms:down
```

**Stop everything:** Press `Ctrl+C` in all dev terminals, then run `bun run cms:down`.

## CMS Management

### Team Collaboration & Schema Management

**Important:** Directus snapshots define the **complete schema state**, not incremental changes. When you apply a snapshot, collections not included in that snapshot will be removed. This has important implications for team collaboration:

**Best Practices:**

1. **Always pull the latest schema before making changes:**

   ```bash
   git pull                                # Get latest snapshot from repo
   bun run cms:backup                      # Backup your local state first
   bun run cms:apply-snapshot <latest.yaml> # Apply team's schema
   ```

2. **Communicate schema changes with your team:**
   - Announce in team chat before modifying collections/fields
   - Coordinate to avoid simultaneous schema changes
   - One person makes schema changes at a time

3. **After making schema changes:**

   ```bash
   bun run cms:snapshot                    # Create new snapshot
   git add cms/snapshots/<new-snapshot>    # Add to git
   git commit -m "Add venues collection"   # Commit with clear message
   git push                                # Share with team
   ```

4. **Before applying a teammate's snapshot:**
   ```bash
   bun run cms:backup                      # Always backup first!
   bun run cms:apply-snapshot <snapshot>   # Then apply
   ```

**Why this matters:** If Developer A creates a `venues` collection, takes a snapshot, and Developer B (working from an older snapshot without `venues`) takes a new snapshot and commits it, the `venues` collection will be lost when anyone applies Developer B's snapshot.

**Recommended Workflow:**

- Use snapshots for version control and deployment
- Always work from the latest snapshot in the repo
- Create backups before applying snapshots
- Communicate schema changes to avoid conflicts

**Version Control:**

- ✅ **Commit snapshots** (`cms/snapshots/*.yaml`) - These are schema definitions and should be tracked in git
- ❌ **Don't commit backups** (`cms/backups/`) - These contain full database data and are in `.gitignore`
- ❌ **Don't commit database** (`cms/database/`) - Local data only, in `.gitignore`

**Best Practice - Isolated snapshot commits:**
Create a dedicated commit for each snapshot to keep schema history clear:

```bash
# Make your schema changes in Directus UI
bun run cms:snapshot

# Commit ONLY the snapshot file
git add cms/snapshots/2026-03-03-1234.yaml
git commit -m "Schema: Add venues collection with location fields"
git push

# Then continue with code changes in separate commits
git add src/routes/venues/
git commit -m "Add venues page component"
git push
```

This keeps your git history clean - schema changes are easy to identify and revert independently from code changes.

### Database Operations

**Create a snapshot (schema only):**

```bash
bun run cms:snapshot
```

Creates a timestamped YAML snapshot of your Directus schema (collections, fields, relations) in `cms/snapshots/`.

**Apply a snapshot:**

```bash
bun run cms:apply-snapshot <filename.yaml>
```

Applies schema from a snapshot. **Warning:** This will remove collections that aren't in the snapshot (though data in existing collections is preserved). Always create a backup before applying snapshots.

**Seed data:**

```bash
bun run cms:seed
```

Runs all seed scripts in `cms/seed/` to populate collections with data. Requires admin credentials (uses environment variables `DIRECTUS_ADMIN_EMAIL` and `DIRECTUS_ADMIN_PASSWORD`, or prompts if not set).

**Create a complete backup (schema + data):**

```bash
bun run cms:backup
```

Creates a timestamped backup in `cms/backups/YYYYMMDD-HHMMSS/` containing:

- `schema.yaml` - Directus schema snapshot
- `database.sql` - Complete PostgreSQL database dump
- `metadata.json` - Backup information

**Restore from backup:**

```bash
bun run cms:restore <backup-directory>
```

Restores both schema and data from a backup. **Warning:** This completely replaces your current database.

Examples:

```bash
bun run cms:restore 20260302-143045
bun run cms:restore cms/backups/20260302-143045
```

If you don't specify a backup directory, it will list all available backups.

### Typical Workflow

**Setting up a new environment:**

```bash
bun run cms:up                          # Start Directus
bun run cms:apply-snapshot schema.yaml  # Apply schema
bun run cms:seed                        # Populate data
```

**Before making schema changes:**

```bash
bun run cms:backup                      # Create backup first!
# Make your changes in the Directus UI
bun run cms:snapshot                    # Save schema changes
```

**Disaster recovery:**

```bash
bun run cms:restore 20260302-143045     # Restore from backup
```

### Seed Scripts

Seed scripts should only insert data, not create schema. Create a file in `cms/seed/` that exports a default function:

```typescript
interface SeedContext {
  accessToken: string
  directusUrl: string
}

export default async function seed(context: SeedContext) {
  const { accessToken, directusUrl } = context

  // Insert data using Directus REST API
  const res = await fetch(`${directusUrl}/items/your_collection`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(yourData),
  })
}
```

Seed scripts run in alphabetical order. Authentication is handled automatically by the seed runner.

## Production Builds

For production, you'll want to:

1. Set `PUBLIC_API_HOST` to your production API URL
2. Update `cms/.env` with your production domain
3. Configure proper CORS origins (not wildcards)

The setup script is designed for development and won't interfere with production environment variables set through your CI/CD pipeline.
