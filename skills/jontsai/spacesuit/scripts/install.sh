#!/usr/bin/env bash
#
# spacesuit install.sh — First-time setup
#
# Copies template files to workspace root, replacing {{SPACESUIT_BASE_*}}
# placeholders with actual base content. Creates necessary directories.
#
# Usage: ./scripts/install.sh [--workspace /path/to/workspace]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SPACESUIT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BASE_DIR="$SPACESUIT_DIR/base"
TMPL_DIR="$SPACESUIT_DIR/templates"

# Default workspace is two levels up from skill dir (skills/spacesuit/ → workspace root)
WORKSPACE="${1:-$(cd "$SPACESUIT_DIR/../.." && pwd)}"

VERSION="$(cat "$SPACESUIT_DIR/VERSION")"

echo "🚀 Spacesuit Installer v${VERSION}"
echo "   Workspace: $WORKSPACE"
echo "   Spacesuit: $SPACESUIT_DIR"
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "$WORKSPACE/memory"
mkdir -p "$WORKSPACE/handoff/pending"
mkdir -p "$WORKSPACE/handoff/completed"
mkdir -p "$WORKSPACE/decisions"
mkdir -p "$WORKSPACE/agents"
mkdir -p "$WORKSPACE/people"
mkdir -p "$WORKSPACE/scripts"
mkdir -p "$WORKSPACE/state"

# Map of template placeholder → base file
declare -A BASE_MAP=(
  ["SPACESUIT_BASE_AGENTS"]="AGENTS.md"
  ["SPACESUIT_BASE_SOUL"]="SOUL.md"
  ["SPACESUIT_BASE_TOOLS"]="TOOLS.md"
  ["SPACESUIT_BASE_HEARTBEAT"]="HEARTBEAT.md"
  ["SPACESUIT_BASE_SECURITY"]="SECURITY.md"
  ["SPACESUIT_BASE_MEMORY"]="MEMORY.md"
)

install_file() {
  local tmpl_name="$1"
  local target_name="$tmpl_name"
  local tmpl_path="$TMPL_DIR/$tmpl_name"
  local target_path="$WORKSPACE/$target_name"

  if [[ -f "$target_path" ]]; then
    echo "  ⏭️  $target_name already exists — skipping (use upgrade.sh to update framework sections)"
    return 0
  fi

  if [[ ! -f "$tmpl_path" ]]; then
    echo "  ⚠️  Template $tmpl_name not found — skipping"
    return 0
  fi

  # Build the target by processing template line-by-line
  # Replace {{SPACESUIT_BASE_*}} placeholders with actual base file content
  local tmp_out
  tmp_out="$(mktemp)"

  while IFS= read -r line || [[ -n "$line" ]]; do
    local replaced=false
    for placeholder in "${!BASE_MAP[@]}"; do
      if [[ "$line" == *"{{${placeholder}}}"* ]]; then
        local base_file="${BASE_MAP[$placeholder]}"
        local base_path="$BASE_DIR/$base_file"
        if [[ -f "$base_path" ]]; then
          cat "$base_path" >> "$tmp_out"
        fi
        replaced=true
        break
      fi
    done
    if ! $replaced; then
      echo "$line" >> "$tmp_out"
    fi
  done < "$tmpl_path"

  mv "$tmp_out" "$target_path"
  echo "  ✅ $target_name — installed"
}

echo ""
echo "📄 Installing workspace files..."

# Install each template
# Install each template (all .md files and Makefile in templates/)
for tmpl in "$TMPL_DIR"/*.md "$TMPL_DIR"/Makefile; do
  if [[ -f "$tmpl" ]]; then
    install_file "$(basename "$tmpl")"
  fi
done

# Install gateway-loop script
if [[ ! -f "$WORKSPACE/scripts/gateway-loop.sh" ]]; then
  if [[ -f "$TMPL_DIR/scripts/gateway-loop.sh" ]]; then
    cp "$TMPL_DIR/scripts/gateway-loop.sh" "$WORKSPACE/scripts/gateway-loop.sh"
    chmod +x "$WORKSPACE/scripts/gateway-loop.sh"
    echo "  ✅ scripts/gateway-loop.sh — installed"
  fi
else
  echo "  ⏭️  scripts/gateway-loop.sh already exists — skipping"
fi

# Write spacesuit version tracker
echo "$VERSION" > "$WORKSPACE/.spacesuit-version"
echo ""
echo "  ✅ .spacesuit-version — v${VERSION}"

# Create a minimal heartbeat-state.json if it doesn't exist
if [[ ! -f "$WORKSPACE/memory/heartbeat-state.json" ]]; then
  cat > "$WORKSPACE/memory/heartbeat-state.json" << 'EOF'
{
  "lastChecks": {},
  "spacesuitVersion": "0.2.0"
}
EOF
  echo "  ✅ memory/heartbeat-state.json — created"
fi

echo ""
echo "🎉 Spacesuit installed! Next steps:"
echo "   1. Edit IDENTITY.md — name your AI"
echo "   2. Edit USER.md — tell it about yourself"
echo "   3. Customize SOUL.md — set the vibe"
echo "   4. Add your tools to TOOLS.md"
echo "   5. Set up your heartbeat checks in HEARTBEAT.md"
echo "   6. Configure Makefile (OPENCLAW_HOME, PORT, SESSION_NAME)"
echo "   7. Run 'make lfg' to start the gateway!"
echo ""
echo "   To upgrade later: ./scripts/upgrade.sh"
