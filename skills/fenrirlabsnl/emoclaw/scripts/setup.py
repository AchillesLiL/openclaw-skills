#!/usr/bin/env python3
"""First-time setup for the emotion skill.

Creates a venv, installs the emotion_model package, and copies the
config template to the project root.

Usage:
    python skills/emoclaw/scripts/setup.py
    python skills/emoclaw/scripts/setup.py --no-config  # skip config copy
"""

from __future__ import annotations

import shutil
import subprocess
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
SKILL_DIR = SCRIPT_DIR.parent
REPO_ROOT = SKILL_DIR.parent.parent

PACKAGE_DIR = REPO_ROOT / "emotion_model"
VENV_DIR = PACKAGE_DIR / ".venv"
CONFIG_TEMPLATE = SKILL_DIR / "assets" / "emoclaw.yaml"
CONFIG_DEST = REPO_ROOT / "emoclaw.yaml"


def main() -> None:
    skip_config = "--no-config" in sys.argv

    print("Emotion Skill Setup")
    print(f"  Repo root: {REPO_ROOT}")
    print(f"  Package:   {PACKAGE_DIR}")
    print()

    # --- Check that emotion_model package exists ---
    pyproject = PACKAGE_DIR / "pyproject.toml"
    if not pyproject.exists():
        print(
            "ERROR: emotion_model package not found.\n"
            "\n"
            "The emotion skill requires the emotion_model Python package\n"
            "at the project root. Expected to find:\n"
            f"  {pyproject}\n"
            "\n"
            "If you installed via ClawdHub, you also need to clone or copy\n"
            "the emotion_model package into your project root.\n"
            "See SKILL.md for details."
        )
        sys.exit(1)

    # --- Create venv ---
    if VENV_DIR.exists():
        print(f"  Venv already exists at {VENV_DIR.relative_to(REPO_ROOT)}")
    else:
        print(f"  Creating venv at {VENV_DIR.relative_to(REPO_ROOT)}...")
        subprocess.run(
            [sys.executable, "-m", "venv", str(VENV_DIR)],
            check=True,
        )
        print("  Venv created.")

    # --- Install package ---
    pip = VENV_DIR / "bin" / "pip"
    if not pip.exists():
        pip = VENV_DIR / "Scripts" / "pip.exe"  # Windows fallback

    print(f"  Installing emotion_model package (editable)...")
    result = subprocess.run(
        [str(pip), "install", "-e", str(PACKAGE_DIR)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  ERROR: pip install failed:\n{result.stderr}")
        sys.exit(1)
    print("  Package installed.")

    # --- Install dev dependencies ---
    print("  Installing dev dependencies (pytest)...")
    subprocess.run(
        [str(pip), "install", "pytest"],
        capture_output=True,
        text=True,
    )

    # --- Copy config template ---
    if not skip_config:
        if CONFIG_DEST.exists():
            print(f"  Config already exists at {CONFIG_DEST.relative_to(REPO_ROOT)}")
        else:
            shutil.copy2(CONFIG_TEMPLATE, CONFIG_DEST)
            print(f"  Copied config template to {CONFIG_DEST.relative_to(REPO_ROOT)}")
    else:
        print("  Skipping config copy (--no-config)")

    # --- Done ---
    print()
    print("Setup complete!")
    print()
    print("Next steps:")
    print(f"  1. Edit {CONFIG_DEST.relative_to(REPO_ROOT)} to customize for your agent")
    print("  2. Run the bootstrap pipeline:")
    print("     python scripts/bootstrap.py")
    print("  3. Or extract + label + train manually (see SKILL.md)")
    print()
    print("To activate the venv manually:")
    print(f"  source {VENV_DIR.relative_to(REPO_ROOT)}/bin/activate")


if __name__ == "__main__":
    main()
