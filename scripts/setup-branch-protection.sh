#!/bin/bash
# Sets up branch protection rules for main branch
# Requires: gh CLI authenticated with admin access
#
# Usage: ./scripts/setup-branch-protection.sh

set -e

REPO="hmls-autos/hmls-web"

echo "Setting up branch protection for 'main' branch..."

gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  "/repos/$REPO/branches/main/protection" \
  -f required_status_checks='{"strict":true,"contexts":["Lint & Type Check","Build"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
  -f restrictions=null \
  -f allow_force_pushes=false \
  -f allow_deletions=false

echo "✓ Branch protection enabled for 'main'"
echo ""
echo "Rules applied:"
echo "  - Require PR before merging"
echo "  - Require 1 approval"
echo "  - Dismiss stale reviews on new commits"
echo "  - Require status checks: Lint & Type Check, Build"
echo "  - No force pushes"
echo "  - No branch deletion"
echo "  - Admins must follow rules (no bypass)"
