#!/usr/bin/env bun
/**
 * Creates a release PR with version bump.
 *
 * Flow:
 * 1. Creates release/vX.X.X branch
 * 2. Bumps version in all packages
 * 3. Commits and pushes
 * 4. Creates PR to main
 * 5. After merge, GitHub Action creates the tag
 *
 * Usage:
 *   bun run release patch   # 0.2.0 -> 0.2.1
 *   bun run release minor   # 0.2.0 -> 0.3.0
 *   bun run release major   # 0.2.0 -> 1.0.0
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dirname, "..");

type BumpType = "patch" | "minor" | "major";

function exec(cmd: string, silent = false): string {
  if (!silent) console.log(`$ ${cmd}`);
  return execSync(cmd, { cwd: ROOT_DIR, encoding: "utf-8" }).trim();
}

function bumpVersion(current: string, type: BumpType): string {
  const [major, minor, patch] = current.split(".").map(Number);
  switch (type) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      return `${major}.${minor}.${patch + 1}`;
  }
}

function main() {
  const bumpType = process.argv[2] as BumpType;

  if (!["patch", "minor", "major"].includes(bumpType)) {
    console.error("Usage: bun run release [patch|minor|major]");
    process.exit(1);
  }

  // Check for uncommitted changes
  const status = exec("git status --porcelain", true);
  if (status) {
    console.error("Error: Working directory is not clean. Commit or stash changes first.");
    process.exit(1);
  }

  // Make sure we're up to date with main
  exec("git checkout main", true);
  exec("git pull origin main", true);

  // Read current version
  const pkgPath = join(ROOT_DIR, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);
  const branchName = `release/v${newVersion}`;

  console.log(`\nCreating release: ${currentVersion} -> ${newVersion}\n`);

  // Create release branch
  exec(`git checkout -b ${branchName}`);

  // Update root package.json
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Sync to all packages
  exec("bun run version:sync");

  // Commit changes
  exec("git add -A");
  exec(`git commit -m "chore: release v${newVersion}"`);

  // Push branch
  exec(`git push origin ${branchName}`);

  // Create PR
  const prUrl = exec(
    `gh pr create --title "Release v${newVersion}" --body "$(cat <<'EOF'
## Release v${newVersion}

Bump version from ${currentVersion} to ${newVersion}.

### Changes
Run \`git log v${currentVersion}..HEAD --oneline\` to see changes.

### Checklist
- [ ] Version numbers updated
- [ ] CI passes
- [ ] Ready to release

After merge, a tag will be created automatically.
EOF
)" --base main --head ${branchName}`
  );

  console.log(`\n✓ Release PR created`);
  console.log(`  ${prUrl}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Review and approve the PR`);
  console.log(`  2. Merge to main`);
  console.log(`  3. Tag and Docker image will be created automatically`);
}

main();
