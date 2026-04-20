#!/usr/bin/env bun

/* oxlint-disable eslint/no-console */

/**
 * Cross-platform Directus seed runner
 * Handles authentication and runs seed scripts in sequence
 */

const DIRECTUS_URL = process.env.DIRECTUS_URL ?? 'http://localhost:8055'

// Read password securely from stdin (hidden input)
async function readPassword(promptText: string): Promise<string> {
  process.stdout.write(promptText)

  // Use stty to disable echo for password input
  const sttyProc = Bun.spawn(['stty', '-echo'], {
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  })
  await sttyProc.exited

  // Read password
  const password = prompt('') ?? ''

  // Re-enable echo
  const sttyProc2 = Bun.spawn(['stty', 'echo'], {
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  })
  await sttyProc2.exited

  process.stdout.write('\n')
  return password
}

// Get credentials from environment or prompt user
async function getCredentials() {
  const email = process.env.DIRECTUS_ADMIN_EMAIL ?? prompt('Enter admin email:')
  const password =
    process.env.DIRECTUS_ADMIN_PASSWORD ??
    (await readPassword('Enter admin password: '))

  if (!email || !password) {
    console.error(
      '❌ Error: Admin credentials are required.\n' +
        '   Set DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD environment variables,\n' +
        '   or run the script interactively to be prompted.',
    )
    process.exit(1)
  }

  return { email, password }
}

// Authenticate with Directus
async function authenticate(email: string, password: string): Promise<string> {
  console.log('🔐 Authenticating with Directus...')

  const res = await fetch(`${DIRECTUS_URL}/auth/login`, {
    body: JSON.stringify({ email, password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Authentication failed: ${error}`)
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON response is untyped
  const { data } = await res.json()
  console.log('✅ Authenticated\n')

  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- JSON response is untyped
  return data.access_token
}

// Get list of seed files to run
async function getSeedFiles(): Promise<string[]> {
  const seedDir = './cms/seed'
  const files = await Array.fromAsync(
    new Bun.Glob('*.ts').scan({ cwd: seedDir }),
  )

  return files.toSorted() // Run in alphanumerical order
}

// List seed files to console
function listSeedFiles(seedFiles: readonly string[]): void {
  console.log(`📋 Found ${seedFiles.length} seed file(s):\n`)
  for (const file of seedFiles) {
    console.log(`   - ${file}`)
  }
  console.log('')
}

// Run a single seed file
async function runSeedFile(file: string, accessToken: string): Promise<void> {
  console.log(`🌱 Running seed: ${file}`)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- Dynamic imports are untyped
  const seedModule = await import(`../cms/seed/${file}`)

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- Dynamic imports are untyped
  if (typeof seedModule.default !== 'function') {
    console.error(`   ⚠️  Skipped: ${file} does not export a default function`)
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- Dynamic imports are untyped
  await seedModule.default({
    accessToken,
    directusUrl: DIRECTUS_URL,
  })

  console.log(`   ✅ Completed: ${file}\n`)
}

// Run all seed files sequentially
async function runAllSeeds(
  seedFiles: readonly string[],
  accessToken: string,
): Promise<void> {
  for (const file of seedFiles) {
    try {
      await runSeedFile(file, accessToken) // eslint-disable-line no-await-in-loop
    } catch (error: unknown) {
      console.error(`   ❌ Failed: ${file}`)
      console.error(
        `   Error: ${error instanceof Error ? error.message : String(error)}\n`,
      )
      process.exit(1)
    }
  }
}

// Authenticate and get access token
async function getAccessToken(): Promise<string> {
  const { email, password } = await getCredentials()

  try {
    return await authenticate(email, password)
  } catch (error: unknown) {
    console.error(
      `❌ ${error instanceof Error ? error.message : String(error)}`,
    )
    return process.exit(1)
  }
}

// Main seed function
async function main() {
  console.log('🌱 Directus Seed Runner\n')

  const accessToken = await getAccessToken()
  const seedFiles = await getSeedFiles()

  if (seedFiles.length === 0) {
    console.log('📭 No seed files found in cms/seed/')
    process.exit(0)
  }

  listSeedFiles(seedFiles)
  await runAllSeeds(seedFiles, accessToken)
  console.log('✨ All seeds completed successfully!')
}

main().catch((error: unknown) => {
  console.error('❌ Seed runner failed:', error)
  process.exit(1)
})
