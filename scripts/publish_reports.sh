#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

MESSAGE="${1:-Update static reports}"

node scripts/build_static_site.js

git add .github .gitignore README.md docs scripts 日报

if [ -d study ]; then
  git add study
fi

if git diff --cached --quiet; then
  echo "No report/site changes to publish."
  exit 0
fi

git commit -m "$MESSAGE"
git push
