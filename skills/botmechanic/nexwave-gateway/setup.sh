#!/bin/bash
# Nexwave Gateway — Setup Script
# Initializes a Node.js project with Circle Gateway integration files

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="${SCRIPT_DIR}/gateway-app"

echo "🚀 Nexwave Gateway — Setting up Circle Gateway project..."

# Create project directory
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Initialize Node.js project
if [ ! -f package.json ]; then
  npm init -y > /dev/null 2>&1
  npm pkg set type="module" > /dev/null 2>&1
  echo "📦 Initialized Node.js project"
fi

# Install dependencies
echo "📥 Installing dependencies (viem, dotenv)..."
npm install --save viem dotenv > /dev/null 2>&1
echo "✅ Dependencies installed"

# Copy source files from skill directory
for file in abis.js gateway-client.js typed-data.js setup-gateway.js check-balance.js deposit.js transfer.js; do
  if [ -f "${SCRIPT_DIR}/${file}" ]; then
    cp "${SCRIPT_DIR}/${file}" "${APP_DIR}/${file}"
  fi
done

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
  if [ -n "$PRIVATE_KEY" ]; then
    echo "PRIVATE_KEY=${PRIVATE_KEY}" > .env
    echo "✅ Created .env with PRIVATE_KEY from environment"
  else
    echo "PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE" > .env
    echo "⚠️  Created .env — please set your PRIVATE_KEY before running scripts"
  fi
fi

echo ""
echo "✅ Setup complete! Project created at: ${APP_DIR}"
echo ""
echo "Next steps:"
echo "  1. cd ${APP_DIR}"
echo "  2. Edit .env and set your PRIVATE_KEY"
echo "  3. Get testnet USDC from https://faucet.circle.com"
echo "  4. Run: node check-balance.js"
echo "  5. Run: node deposit.js"
echo "  6. Run: node transfer.js"
