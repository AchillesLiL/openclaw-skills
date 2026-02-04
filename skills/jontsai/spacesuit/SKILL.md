# openclaw-spacesuit

**A framework scaffold for OpenClaw workspaces.**

## Metadata

| Field | Value |
|-------|-------|
| **Name** | `spacesuit` |
| **Version** | `0.2.0` |
| **Author** | jontsai |
| **License** | MIT |
| **Category** | framework |
| **Tags** | workspace, scaffold, conventions, memory, git-workflow |

## Description

The Spacesuit is a batteries-included framework layer for OpenClaw workspaces. It provides:

- **Session startup protocol** — security-first file loading order
- **Memory system** — daily logs + curated long-term memory with commit discipline
- **Git workflow** — mandatory pre-commit checks, worktree conventions, parallel agent coordination
- **Safety rules** — pre-action checklist, destructive-action guards, stand-down protocol
- **Priority system** — P0–P5 triage for tasks and incidents
- **Cross-platform handoffs** — structured context transfer between Slack/Discord/Telegram
- **Heartbeat framework** — proactive periodic checks with state tracking
- **Decision logging** — mandatory audit trail for architectural decisions
- **Meta-learning framework** — expert-first research methodology (Dunning-Kruger aware)
- **Security baseline** — secret transmission policy, prompt injection defense, data classification
- **Gateway management** — Makefile with `make lfg` (tmux + auto-restart gateway-loop)
- **One-command startup** — `make lfg` installs skills + launches gateway in tmux

## Installation

```bash
# Install spacesuit
clawhub install spacesuit

# First-time setup (creates workspace files, Makefile, gateway-loop)
./skills/spacesuit/scripts/install.sh

# Start the gateway
make lfg
```

## How It Works

OpenClaw reads hardcoded filenames from the workspace root (`AGENTS.md`, `SOUL.md`, etc.). Since we can't change that loading behavior, Spacesuit uses **section-based merging**:

1. Framework content is wrapped in `<!-- SPACESUIT:BEGIN -->` / `<!-- SPACESUIT:END -->` markers
2. On upgrade, only the content between markers is replaced
3. Everything outside the markers (your customizations) is preserved

## Files Managed

| File | Base Content | User Content |
|------|-------------|--------------|
| `AGENTS.md` | Session protocol, memory, git, safety, priorities | Channel mappings, tool configs, personal rules |
| `SOUL.md` | Core personality scaffold | Personal vibe, human-specific tone |
| `TOOLS.md` | Tool organization guidance | Actual tool configs, credentials refs, API details |
| `HEARTBEAT.md` | Check framework & state tracking | Specific checks to run |
| `IDENTITY.md` | — (template only) | Name, avatar, personality |
| `USER.md` | — (template only) | All about your human |
| `MEMORY.md` | Long-term memory structure | Project notes, personal context |
| `SECURITY.md` | Full security baseline | Contact-specific alert channels |
| `Makefile` | Gateway management (`lfg`, `start`, `stop`, etc.) | Custom targets, port/session config |
| `scripts/gateway-loop.sh` | Auto-restart wrapper (tmux) | Slack alerts, custom hooks |

## Upgrade Path

```bash
# See what would change
./scripts/diff.sh

# Apply upgrade
./scripts/upgrade.sh

# Check version
cat skills/spacesuit/VERSION
```
