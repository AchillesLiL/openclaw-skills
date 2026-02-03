#!/usr/bin/env bash
set -euo pipefail

# Kaspa Wallet CLI - Standalone Installer
# Installs from npm - no local SDK required

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=== Kaspa Wallet CLI Installer ==="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js not found. Install Node.js >= 20.13.1"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//')
echo "Node.js version: $NODE_VERSION"

# Install dependencies
echo ""
echo "Installing dependencies from npm..."
cd "$ROOT_DIR"
npm install

chmod +x "$ROOT_DIR/kaswallet.sh"

echo ""
echo "=== Installation complete ==="
echo ""
echo "Usage:"
echo "  ./kaswallet.sh help"
echo "  ./kaswallet.sh balance --address kaspa:..."
echo "  ./kaswallet.sh node-info"
echo ""
echo "For sending, set environment variables:"
echo "  export KASPA_MNEMONIC='your 12-24 word seed phrase'"
echo "  ./kaswallet.sh send --to kaspa:... --amount 0.5 --dry-run"
