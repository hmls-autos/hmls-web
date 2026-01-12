#!/usr/bin/env bun
/**
 * Syncs the version from root package.json to all workspace packages.
 *
 * Usage:
 *   bun run scripts/sync-versions.ts        # Sync versions
 *   bun run scripts/sync-versions.ts --check # Check if versions are in sync (for CI)
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dirname, "..");
const CHECK_MODE = process.argv.includes("--check");

interface PackageJson {
  name: string;
  version: string;
  [key: string]: unknown;
}

function readPackageJson(path: string): PackageJson {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writePackageJson(path: string, pkg: PackageJson): void {
  writeFileSync(path, JSON.stringify(pkg, null, 2) + "\n");
}

interface ConfigFile {
  path: string;
  type: "package.json" | "deno.json";
}

function getWorkspacePackages(): ConfigFile[] {
  const packages: ConfigFile[] = [];
  const workspaceDirs = ["apps", "packages"];

  for (const dir of workspaceDirs) {
    const dirPath = join(ROOT_DIR, dir);
    if (!existsSync(dirPath)) continue;

    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Check for package.json first
        const pkgPath = join(dirPath, entry.name, "package.json");
        if (existsSync(pkgPath)) {
          packages.push({ path: pkgPath, type: "package.json" });
          continue;
        }
        // Fall back to deno.json for Deno projects
        const denoPath = join(dirPath, entry.name, "deno.json");
        if (existsSync(denoPath)) {
          packages.push({ path: denoPath, type: "deno.json" });
        }
      }
    }
  }

  return packages;
}

function main() {
  // Read root version
  const rootPkgPath = join(ROOT_DIR, "package.json");
  const rootPkg = readPackageJson(rootPkgPath);
  const targetVersion = rootPkg.version;

  console.log(`Root version: ${targetVersion}\n`);

  // Find all workspace config files
  const configFiles = getWorkspacePackages();

  let hasErrors = false;

  for (const { path: configPath } of configFiles) {
    const pkg = readPackageJson(configPath);
    const relativePath = configPath.replace(ROOT_DIR + "/", "");

    if (pkg.version !== targetVersion) {
      if (CHECK_MODE) {
        console.error(`  ${relativePath}: ${pkg.version} (expected ${targetVersion})`);
        hasErrors = true;
      } else {
        console.log(`  Updating ${relativePath}: ${pkg.version} -> ${targetVersion}`);
        pkg.version = targetVersion;
        writePackageJson(configPath, pkg);
      }
    } else {
      console.log(`  ${relativePath}: ${pkg.version}`);
    }
  }

  if (CHECK_MODE && hasErrors) {
    console.error("\nVersion mismatch detected! Run 'bun run version:sync' to fix.");
    process.exit(1);
  }

  if (!CHECK_MODE) {
    console.log("\nVersions synced successfully!");
  } else {
    console.log("\nAll versions are in sync.");
  }
}

main();
