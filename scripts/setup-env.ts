#!/usr/bin/env bun

/* oxlint-disable eslint/no-console */

import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import { networkInterfaces } from 'node:os'

/**
 * Get the local IP address of the machine
 * @returns {string} The local IP address or 'localhost' as fallback
 */
/* oxlint-disable-next-line eslint/max-statements*/
function getLocalIP(): string {
  const nets = networkInterfaces()

  // Priority order: en0 (macOS WiFi/Ethernet), eth0 (Linux), then any other interface
  const priorityInterfaces = ['en0', 'eth0', 'en1', 'wlan0']

  for (const interfaceName of priorityInterfaces) {
    const iface = nets[interfaceName]
    if (iface) {
      for (const net of iface) {
        // Skip internal (i.e. 127.0.0.1) and non-IPv4 addresses
        if (net.family === 'IPv4' && !net.internal) {
          return net.address
        }
      }
    }
  }

  // Fallback: check all interfaces
  for (const name of Object.keys(nets)) {
    const iface = nets[name]
    if (!iface) continue

    for (const net of iface) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }

  return 'localhost'
}

/**
 * Update or add environment variable in .env file
 * @param {string} filePath - Path to the .env file
 * @param {string} key - Environment variable key
 * @param {string} value - New value for the variable
 */
async function updateEnvVar(
  filePath: string,
  key: string,
  value: string,
): Promise<void> {
  let content = ''

  if (existsSync(filePath)) content = await Bun.file(filePath).text()

  const lines = content.split('\n')
  let found = false

  const updatedLines = lines.map((line) => {
    // Match the key at the start of the line (ignoring whitespace)
    const match = /^\s*([^=\s#]+)\s*=/.exec(line)
    const CAPTURE_GROUP_INDEX = 1
    if (match && match[CAPTURE_GROUP_INDEX] === key) {
      found = true
      return `${key}=${value}`
    }
    return line
  })

  // If key wasn't found, add it at the end
  if (!found) {
    // Add a newline before if content exists and doesn't end with newline
    if (content && !content.endsWith('\n')) {
      updatedLines.push('')
    }
    updatedLines.push(`${key}=${value}`)
  }

  await Bun.write(filePath, updatedLines.join('\n'))
}

/**
 * Update multiple environment variables in a .env file
 * @param {string} filePath - Path to the .env file
 * @param {Object} updates - Object with key-value pairs to update
 */
async function updateEnvFile(
  filePath: string,
  updates: Record<string, string>, // eslint-disable-line @typescript-eslint/prefer-readonly-parameter-types
): Promise<void> {
  for (const [key, value] of Object.entries(updates)) {
    await updateEnvVar(filePath, key, value) // oxlint-disable-line eslint/no-await-in-loop
  }
}

// Main execution
const localIP = getLocalIP()
const directusPort = 8055
const directusURL = `http://${localIP}:${directusPort}`

console.log(`🔍 Detected local IP: ${localIP}`)
console.log(`📝 Configuring environment files for development...`)

// Paths - now relative to project root
const clientEnvPath = resolve(import.meta.dir, '../client/.env')
const cmsEnvPath = resolve(import.meta.dir, '../cms/.env')

// Update client .env
console.log(`\n📄 Updating client/.env`)
await updateEnvFile(clientEnvPath, {
  PUBLIC_API_HOST: directusURL,
})
console.log(`   ✓ PUBLIC_API_HOST=${directusURL}`)

// Update CMS .env
if (existsSync(cmsEnvPath)) {
  console.log(`\n📄 Updating cms/.env`)

  // Build CORS origin - include both the local IP and localhost for flexibility
  const corsOrigins = [
    `tauri://localhost`, // Tauri desktop app
    `http://${localIP}:1420`, // Tauri dev server (mobile simulators)
    `http://localhost:1420`, // Fallback
    `http://${localIP}:3000`, // Alternative port
    `http://localhost:3000`, // Alternative port
  ].join(',')

  await updateEnvFile(cmsEnvPath, {
    CORS_ORIGIN: corsOrigins,
    PUBLIC_CLIENT_URL: `http://${localIP}:1420`,
    PUBLIC_URL: directusURL,
  })

  console.log(`   ✓ PUBLIC_URL=${directusURL}`)
  console.log(`   ✓ CORS_ORIGIN=${corsOrigins}`)
  console.log(`   ✓ PUBLIC_CLIENT_URL=http://${localIP}:1420`)
} else {
  console.log(`\n⚠️  CMS .env not found at ${cmsEnvPath}`)
}

console.log(`\n✅ Environment configuration complete!`)
console.log(`\n💡 Next steps:`)
console.log(`   1. Start Directus: cd cms && docker compose up`)
console.log(`   2. Start client: cd client && bun run tauri:dev`)
console.log(
  `\n💡 Note: If you're using an Android emulator, you may need to manually set:`,
)
console.log(`   PUBLIC_API_HOST=http://10.0.2.2:${directusPort}`)
