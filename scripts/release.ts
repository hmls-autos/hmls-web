#!/usr/bin/env bun
/**
 * Automates the release process:
 * 1. Bumps version in root package.json
 * 2. Syncs version to all workspace packages
 * 3. Commits the changes
 * 4. Creates and pushes a git tag
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

  // Check we're on main branch
  const branch = exec("git branch --show-current", true);
  if (branch !== "main") {
    console.error(`Error: Must be on 'main' branch. Currently on '${branch}'.`);
    process.exit(1);
  }

  // Read current version
  const pkgPath = join(ROOT_DIR, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const currentVersion = pkg.version;
  const newVersion = bumpVersion(currentVersion, bumpType);

  console.log(`\nBumping version: ${currentVersion} -> ${newVersion}\n`);

  // Update root package.json
  pkg.version = newVersion;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  // Sync to all packages
  exec("bun run version:sync");

  // Commit changes
  exec(`git add -A`);
  exec(`git commit -m "chore: release v${newVersion}"`);

  // Create and push tag
  exec(`git tag v${newVersion}`);
  exec(`git push origin main`);
  exec(`git push origin v${newVersion}`);

  console.log(`\n✓ Released v${newVersion}`);
  console.log(`  https://github.com/spinsirr/hmls/releases/tag/v${newVersion}`);
}

main();
