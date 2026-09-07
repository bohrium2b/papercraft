#!/usr/bin/env bash
set -euo pipefail

echo "==> Installing Ruby gems..."
bundle config set --local without 'production'
bundle install

echo "==> Installing Node.js dependencies..."
pnpm install

echo "==> Done."
