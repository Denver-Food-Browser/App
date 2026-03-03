#!/bin/bash

# iOS Device Selection and Booting (macOS only)
# This script handles iOS simulator selection, booting, and launching Tauri
# Called by dev.ts after common setup is complete

set -e

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
  echo ""
  echo "❌ iOS development requires macOS"
  exit 1
fi

echo "📱 Detecting available iOS simulators..."

# Get list of available iOS simulators (iPhone only)
# Note: We trim trailing spaces from device names
BOOTED_DEVICES=$(xcrun simctl list devices | grep -E "iPhone.*\(Booted\)" | sed -E 's/^[[:space:]]+//; s/ \(([A-F0-9-]+)\) \(Booted\)[[:space:]]*$/|\1/')
AVAILABLE_DEVICES=$(xcrun simctl list devices | grep -E "iPhone" | grep -v "unavailable" | sed -E 's/^[[:space:]]+//; s/ \(([A-F0-9-]+)\) \(.*\)[[:space:]]*$/|\1/')

# If there's exactly one booted device, use it automatically
if [ ! -z "$BOOTED_DEVICES" ]; then
  BOOTED_COUNT=$(echo "$BOOTED_DEVICES" | wc -l | tr -d ' ')
else
  BOOTED_COUNT=0
fi

if [ "$BOOTED_COUNT" -eq 1 ]; then
  SELECTED_DEVICE_NAME=$(echo "$BOOTED_DEVICES" | cut -d'|' -f1)
  SELECTED_DEVICE_ID=$(echo "$BOOTED_DEVICES" | cut -d'|' -f2)
  echo "✅ Using already booted simulator: $SELECTED_DEVICE_NAME"
else
  # Present device selection
  echo ""
  echo "Available iOS Simulators:"
  echo ""

  # Create arrays for device names and IDs
  i=1
  while IFS='|' read -r name id; do
    if [ ! -z "$name" ]; then
      # Check if this device is booted
      if echo "$BOOTED_DEVICES" | grep -q "$id"; then
        echo "  $i) $name (Booted)"
      else
        echo "  $i) $name"
      fi
      eval "DEVICE_NAME_$i=\"$name\""
      eval "DEVICE_ID_$i=\"$id\""
      i=$((i+1))
    fi
  done <<< "$AVAILABLE_DEVICES"

  DEVICE_COUNT=$((i-1))

  echo ""
  read -p "Select a device (1-$DEVICE_COUNT): " DEVICE_CHOICE

  # Validate input
  if ! [[ "$DEVICE_CHOICE" =~ ^[0-9]+$ ]] || [ "$DEVICE_CHOICE" -lt 1 ] || [ "$DEVICE_CHOICE" -gt "$DEVICE_COUNT" ]; then
    echo "❌ Invalid selection. Exiting."
    exit 1
  fi

  # Get selected device
  eval "SELECTED_DEVICE_NAME=\$DEVICE_NAME_$DEVICE_CHOICE"
  eval "SELECTED_DEVICE_ID=\$DEVICE_ID_$DEVICE_CHOICE"
fi

# Check if selected device is booted, if not boot it
DEVICE_STATUS=$(xcrun simctl list devices | grep "$SELECTED_DEVICE_ID" | grep -o "(Booted)" || echo "")
if [ -z "$DEVICE_STATUS" ]; then
  echo ""
  echo "🔄 Booting $SELECTED_DEVICE_NAME..."
  if xcrun simctl boot "$SELECTED_DEVICE_ID" 2>&1; then
    # Wait for simulator to fully boot
    sleep 3
    echo "✅ Simulator booted!"
  else
    echo "❌ Failed to boot simulator."
    exit 1
  fi
fi

# Start Tauri iOS dev server
echo ""
echo "📱 Starting Tauri iOS dev server..."
echo ""

cd client

# Trap Ctrl+C for cleanup
cleanup() {
  echo ""
  echo "🛑 Stopping iOS dev server..."
  if [ ! -z "$TAURI_PID" ]; then
    kill $TAURI_PID 2>/dev/null || true
  fi
  # Clean up temp files
  rm -f /tmp/tauri_ios_vite_ready /tmp/tauri_ios_cargo_ready /tmp/tauri_ios_app_deployed /tmp/tauri_ios_ready_shown
  exit
}
trap cleanup INT TERM

# Clean up any previous state files
rm -f /tmp/tauri_ios_vite_ready /tmp/tauri_ios_cargo_ready /tmp/tauri_ios_app_deployed /tmp/tauri_ios_ready_shown

# Check if Vite is already running (it usually is since dev.ts starts it first)
if curl -sf http://localhost:1420 > /dev/null 2>&1; then
  touch /tmp/tauri_ios_vite_ready
fi

# Start Tauri with selected device and monitor output
bun run tauri ios dev "$SELECTED_DEVICE_NAME" 2>&1 | while IFS= read -r line; do
  echo "$line"

  # Check if Vite is ready
  if echo "$line" | grep -q "Local:.*http://localhost:1420"; then
    touch /tmp/tauri_ios_vite_ready
  fi

  # Check if Tauri finished compiling
  if echo "$line" | grep -qE "(Finished|finished).*(dev|debug)"; then
    touch /tmp/tauri_ios_cargo_ready
  fi

  # iOS: Look for app launch (check for process ID or log filtering which indicates app is running)
  if echo "$line" | grep -qE "(com\.denverfoodbrowser\.app: [0-9]+|Filtering the log data|Watching.*for changes)"; then
    touch /tmp/tauri_ios_app_deployed
  fi

  # Show ready message
  if [ -f /tmp/tauri_ios_vite_ready ] && [ -f /tmp/tauri_ios_cargo_ready ] && [ -f /tmp/tauri_ios_app_deployed ] && [ ! -f /tmp/tauri_ios_ready_shown ]; then
    touch /tmp/tauri_ios_ready_shown
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✨ Development environment ready!"
    echo ""
    echo "📱 App deployed and running on iOS simulator: $SELECTED_DEVICE_NAME"
    echo "   • Web Browser: http://localhost:1420"
    echo "   • Directus Admin: http://localhost:8055"
    echo ""
    echo "🔍 Web Inspector:"
    echo "   1. Open Safari"
    echo "   2. Go to Develop > Simulator > $SELECTED_DEVICE_NAME > localhost"
    echo "   (If Develop menu is hidden: Safari > Settings > Advanced > Show Develop menu)"
    echo ""
    echo "💡 Press Ctrl+C to stop all services"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
  fi
done &

TAURI_PID=$!

# Wait for the Tauri process
wait $TAURI_PID
