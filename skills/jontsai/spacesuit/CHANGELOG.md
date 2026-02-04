# Changelog

## 0.2.0

- **Added:** `templates/Makefile` — workspace Makefile with `lfg`, `start`, `stop`, `restart`, `status`, `logs`, `skills` targets
- **Added:** `templates/scripts/gateway-loop.sh` — auto-restart wrapper for running gateway in tmux
- **Updated:** AGENTS.md template includes gateway deployment section with tmux commands
- **Updated:** install.sh copies gateway-loop.sh and Makefile during first-time setup
- **Batteries included:** `make lfg` is now the one command to go from zero to running gateway

## 0.1.0

- Initial release: batteries-included workspace framework
- Session protocol, memory system, git workflow, safety rules
- Section-based merging with upgrade support
- Templates for all workspace files
