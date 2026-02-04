#!/bin/bash
# Gateway auto-restart wrapper
# Restarts openclaw gateway if it crashes, with exponential backoff
# Designed for tmux: tmux new-session -d -s gateway './scripts/gateway-loop.sh'

set -euo pipefail

MAX_RESTARTS=1000
RESTART_DELAY=1
BACKOFF_MAX=10

restarts=0
delay=$RESTART_DELAY

while true; do
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting openclaw gateway (restart #$restarts)..."

    openclaw gateway
    exit_code=$?

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Gateway exited with code $exit_code"

    # If clean exit (SIGTERM/SIGINT), don't restart
    if [[ $exit_code -eq 0 || $exit_code -eq 130 || $exit_code -eq 143 ]]; then
        echo "Clean shutdown detected. Exiting."
        exit 0
    fi

    restarts=$((restarts + 1))

    if [[ $restarts -ge $MAX_RESTARTS ]]; then
        echo "ERROR: Max restarts ($MAX_RESTARTS) reached. Giving up."
        echo "Check logs and restart manually."
        exit 1
    fi

    echo "Restarting in ${delay}s... (Ctrl-C to stop)"
    sleep $delay

    # Exponential backoff (cap at BACKOFF_MAX)
    delay=$((delay * 2))
    if [[ $delay -gt $BACKOFF_MAX ]]; then
        delay=$BACKOFF_MAX
    fi
done
