<!-- SPACESUIT:BEGIN AGENTS -->
{{SPACESUIT_BASE_AGENTS}}
<!-- SPACESUIT:END -->

<!-- ============================================================ -->
<!-- YOUR CUSTOMIZATIONS BELOW                                     -->
<!-- Everything below this line is yours. Spacesuit won't touch it.-->
<!-- ============================================================ -->

## 🖥️ Gateway Deployment

**Decision:** Run gateway via `tmux` + `gateway-loop.sh` (auto-restart with exponential backoff).

**Commands:**
| Command | What it does |
|---------|-------------|
| `make lfg` | 🚀 Install/update skills + start gateway in tmux |
| `make start` | Start gateway in tmux (skip skill sync) |
| `make stop` | Stop the gateway |
| `make restart` | Stop + start |
| `make status` | Check if running |
| `make logs` | Attach to tmux session (view logs) |

**Manual restart:** `make restart`
**Attach to see logs:** `tmux attach -t gateway` (or whatever SESSION_NAME is set to)

## 🗣️ Channel Conventions

<!-- Map your channels to directories/purposes here. Example:
| Channel | Purpose | Primary Directory |
|---------|---------|-------------------|
| `#general` | Main discussion | `~/workspace/` |
| `#project-x` | Project X | `~/code/project-x/` |
-->

## 🚦 LLM Routing

<!-- If you use multiple coding agents (Codex, Claude Code, etc.), document routing here.
Example:
**Default:** 80% Codex, 20% Claude for cost optimization.
-->

## 🎯 Custom Feedback Signals

<!-- Document your human's communication style signals here. Example:
| Signal | Meaning | Your Action |
|--------|---------|-------------|
| "bro" | Missed the mark | Stop, re-read, course correct |
-->
