#!/usr/bin/env bun

/**
 * Cross-platform development script
 * Starts Directus and Tauri dev server for Desktop, Android, or iOS
 */

/* oxlint-disable eslint/no-console */

type Platform = 'desktop' | 'android' | 'ios'

type PlatformConfig = {
  readonly emoji: string
  readonly name: string
  readonly command: readonly string[] | null
}

type ReadyState = {
  vite: boolean
  cargo: boolean
  app: boolean
  messageShown: boolean
}

const DIRECTUS_URL = 'http://localhost:8055/server/health'
const VITE_PORT = 1420
const ARG_PLATFORM_INDEX = 2
const DIRECTUS_CHECK_TIMEOUT = 2000
const MAX_HEALTH_ATTEMPTS = 60
const HEALTH_CHECK_TIMEOUT = 1000
const HEALTH_CHECK_SLEEP = 1000
const ERROR_EXIT_CODE = 1
const SUCCESS_EXIT_CODE = 0

const platformConfig: Record<Platform, PlatformConfig> = {
  android: {
    emoji: '🤖',
    name: 'Android',
    command: ['bun', 'run', 'tauri', 'android', 'dev'],
  },
  desktop: {
    emoji: '🖥️',
    name: 'Desktop',
    command: ['bun', 'run', 'tauri', 'dev'],
  },
  ios: {
    emoji: '📱',
    name: 'iOS',
    command: null,
  },
}

// Platform detection
function getPlatform(): Platform {
  const platformArg = process.argv[ARG_PLATFORM_INDEX] ?? 'desktop'
  return platformArg === 'android' || platformArg === 'ios'
    ? platformArg
    : 'desktop'
}

// Environment setup
async function ensureEnvironmentConfigured(): Promise<void> {
  const envPath = './client/.env'
  const envExists = await Bun.file(envPath).exists()

  if (!envExists) {
    console.log('\n📝 Configuring environment...')
    await Bun.spawn(['bun', 'scripts/setup-env.ts'], {
      stderr: 'inherit',
      stdout: 'inherit',
    }).exited
  } else {
    console.log('\n📝 Environment already configured (skipping setup-env)')
    console.log(
      "   Run 'bun run setup-env' manually if you need to reconfigure",
    )
  }
}

// Directus health check
async function checkDirectusRunning(): Promise<boolean> {
  try {
    const response = await fetch(DIRECTUS_URL, {
      signal: AbortSignal.timeout(DIRECTUS_CHECK_TIMEOUT),
    })
    return response.ok
  } catch {
    return false
  }
}

async function checkHealthEndpoint(): Promise<boolean> {
  try {
    const response = await fetch(DIRECTUS_URL, {
      signal: AbortSignal.timeout(HEALTH_CHECK_TIMEOUT),
    })
    return response.ok
  } catch {
    return false
  }
}

async function waitForDirectusHealth(attempts: number): Promise<void> {
  if (attempts >= MAX_HEALTH_ATTEMPTS) {
    console.error('\n❌ Directus failed to start within 60 seconds')
    process.exit(ERROR_EXIT_CODE)
  }

  const isHealthy = await checkHealthEndpoint()
  if (isHealthy) {
    console.log('\n✅ Directus is ready!')
    return
  }

  process.stdout.write('.')
  await Bun.sleep(HEALTH_CHECK_SLEEP)
  await waitForDirectusHealth(attempts + 1) // oxlint-disable-line eslint/no-magic-numbers
}

async function ensureDirectusRunning(): Promise<void> {
  console.log('\n🔍 Checking Directus status...')
  const isRunning = await checkDirectusRunning()

  if (isRunning) {
    console.log('✅ Directus already running and healthy')
    return
  }

  console.log('\n🐳 Starting Directus (Docker Compose)...')
  await Bun.spawn(['docker', 'compose', 'up', '-d'], {
    cwd: './cms',
    stderr: 'inherit',
    stdout: 'inherit',
  }).exited

  console.log('\n⏳ Waiting for Directus to be ready...')
  await waitForDirectusHealth(0)
}

// iOS platform handler
async function runIOSPlatform(config: PlatformConfig): Promise<void> {
  console.log(`\n${config.emoji} Delegating to iOS-specific script...\n`)

  const iosProc = Bun.spawn(['bash', 'scripts/ios.sh'], {
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  })

  const iosCleanup = (): void => {
    console.log('\n🛑 Stopping iOS dev server...')
    console.log(
      '   (Directus will continue running - use "bun run cms:down" to stop it)',
    )
    iosProc.kill()
    process.exit(SUCCESS_EXIT_CODE)
  }

  process.on('SIGINT', iosCleanup)
  process.on('SIGTERM', iosCleanup)

  const exitCode = await iosProc.exited
  process.exit(exitCode)
}

// Output processing helpers
const checkViteReady = (line: string): boolean =>
  line.includes('Local:') && line.includes(`http://localhost:${VITE_PORT}`)

const checkCargoReady = (line: string): boolean =>
  /(Finished|finished).*(dev|debug)/.test(line)

const checkAppDeployed = (
  line: string,
  platform: Platform,
  cargoReady: boolean,
): boolean => {
  if (platform === 'android') {
    return /(Starting:|Activity.*started|successfully installed)/.test(line)
  }
  return cargoReady
}

const logAndroid = (): void => {
  console.log('🤖 App deployed and running on Android emulator')
  console.log('   • Web Browser: http://localhost:1420')
  console.log('   • Directus Admin: http://localhost:8055')
  console.log('   • Note: Android uses http://10.0.2.2:8055 to reach Directus')
}

const logReadyMessage = (platform: Platform): void => {
  console.log(
    '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
  )
  console.log('✨ Development environment ready!\n')
  if (platform === 'android') {
    logAndroid()
  } else {
    console.log('📱 Development Options:')
    console.log('   • Desktop: Tauri app should be launching now')
    console.log(`   • Web Browser: http://localhost:${VITE_PORT}`)
    console.log('   • Directus Admin: http://localhost:8055')
  }
  console.log('\n💡 Press Ctrl+C to stop all services')
  console.log(
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n',
  )
}

const updateState = (
  state: Readonly<ReadyState>,
  line: string,
  platform: Platform,
): ReadyState => {
  const newState = { ...state }
  if (checkViteReady(line)) newState.vite = true
  if (checkCargoReady(line)) newState.cargo = true
  if (checkAppDeployed(line, platform, newState.cargo)) newState.app = true
  return newState
}

const shouldShowMessage = (state: Readonly<ReadyState>): boolean =>
  state.vite && state.cargo && state.app && !state.messageShown

const processLines = (
  lines: Readonly<string[]>,
  state: Readonly<ReadyState>,
  platform: Platform,
): ReadyState => {
  let currentState = state
  for (const line of lines) {
    console.log(line)
    currentState = updateState(currentState, line, platform)
    if (shouldShowMessage(currentState)) {
      logReadyMessage(platform)
      currentState = { ...currentState, messageShown: true }
    }
  }
  return currentState
}

const decodeBuffer = (
  buffer: Readonly<string>,
  value: Readonly<Uint8Array>, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
): { buffer: string; lines: string[] } => {
  const decoder = new TextDecoder()
  const newBuffer = buffer + decoder.decode(value, { stream: true })
  const lines = newBuffer.split('\n')
  return { lines, buffer: lines.pop() ?? '' }
}

const processBuffer = async (
  reader: Readonly<ReadableStreamDefaultReader<Uint8Array>>, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
  initialState: Readonly<ReadyState>,
  platform: Platform,
): Promise<void> => {
  let buffer = ''
  let state = initialState
  while (true) {
    const { done, value } = await reader.read() // oxlint-disable-line no-await-in-loop
    if (done) break
    const { lines, buffer: newBuffer } = decodeBuffer(buffer, value)
    buffer = newBuffer
    state = processLines(lines, state, platform)
  }
}

const processOutput = async (
  stream: ReadableStream<Uint8Array>, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
  state: Readonly<ReadyState>,
  platform: Platform,
): Promise<void> => {
  const reader = stream.getReader()
  await processBuffer(reader, state, platform)
}

// Desktop/Android platform handler
async function runDesktopOrAndroidPlatform(
  config: PlatformConfig,
  platform: Platform,
): Promise<void> {
  console.log(`\n${config.emoji} Starting Tauri ${config.name} dev server...\n`)

  if (!config.command) process.exit(ERROR_EXIT_CODE)

  const proc = Bun.spawn([...config.command], {
    cwd: './client',
    stderr: 'pipe',
    stdin: 'inherit',
    stdout: 'pipe',
  })

  const readyState: ReadyState = {
    vite: false,
    cargo: false,
    app: false,
    messageShown: false,
  }

  void Promise.all([
    processOutput(proc.stdout, readyState, platform),
    processOutput(proc.stderr, readyState, platform),
  ])

  const cleanup = (): void => {
    console.log('\n🛑 Stopping dev server...')
    console.log(
      '   (Directus will continue running - use "bun run cms:down" to stop it)',
    )
    proc.kill()
    process.exit(SUCCESS_EXIT_CODE)
  }

  process.on('SIGINT', cleanup)
  process.on('SIGTERM', cleanup)

  const exitCode = await proc.exited
  process.exit(exitCode)
}

// Main function
async function main(): Promise<void> {
  const platform = getPlatform()
  const config = platformConfig[platform]

  console.log(
    `🚀 Starting Denver Food Browser development environment (${config.name})...`,
  )

  await ensureEnvironmentConfigured()
  await ensureDirectusRunning()

  if (platform === 'ios') {
    await runIOSPlatform(config)
  } else {
    await runDesktopOrAndroidPlatform(config, platform)
  }
}

// Execute
main().catch((error: unknown) => {
  console.error(
    '❌ Fatal error:',
    error instanceof Error ? error.message : String(error),
  )
  process.exit(ERROR_EXIT_CODE)
})
