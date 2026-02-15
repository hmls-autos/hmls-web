# Monorepo Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan
> task-by-task.

**Goal:** Remove unused packages, redundant configs, and outdated documentation to simplify the
monorepo structure.

**Architecture:** Conservative cleanup approach - delete only verified unused files while preserving
all functional code and workspace structure. Each deletion is verified safe before proceeding.

**Tech Stack:** Deno workspace, Bun (web), Git

---

## Task 1: Verify No Imports of packages/shared and packages/proto

**Files:**

- Check: All `*.ts`, `*.tsx`, `*.js`, `*.jsx` files in `apps/`

**Step 1: Search for imports of @hmls/shared**

Run:

```bash
grep -r "@hmls/shared" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

Expected: No results (confirming package is unused)

**Step 2: Search for imports of @hmls/proto**

Run:

```bash
grep -r "@hmls/proto" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

Expected: No results (confirming package is unused)

**Step 3: Search for imports of ../packages**

Run:

```bash
grep -r "from.*['\"].*\.\./\.\./packages" apps/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"
```

Expected: No results (confirming no relative imports to packages)

**Step 4: Document verification**

Create verification checkpoint - if any imports found, STOP and reassess.

---

## Task 2: Remove Documentation Files

**Files:**

- Delete: `CONTRIBUTING.md`
- Delete: `DEVELOPMENT.md`

**Step 1: Remove CONTRIBUTING.md**

Run:

```bash
git rm CONTRIBUTING.md
```

Expected: File staged for deletion

**Step 2: Remove DEVELOPMENT.md**

Run:

```bash
git rm DEVELOPMENT.md
```

Expected: File staged for deletion

**Step 3: Verify git status**

Run:

```bash
git status
```

Expected: Shows 2 files deleted (CONTRIBUTING.md, DEVELOPMENT.md)

**Step 4: Commit documentation cleanup**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: remove redundant documentation files

Remove CONTRIBUTING.md and DEVELOPMENT.md as their content is either
outdated or already covered in CLAUDE.md.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: Commit created successfully

---

## Task 3: Remove packages/shared Directory

**Files:**

- Delete: `packages/shared/` (entire directory)

**Step 1: Remove packages/shared**

Run:

```bash
git rm -r packages/shared
```

Expected: Directory and all contents staged for deletion

**Step 2: Verify deletion**

Run:

```bash
ls -la packages/
```

Expected: Only `proto/` directory remains

**Step 3: Commit shared package removal**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: remove unused packages/shared

The shared package contained types but was not imported by any app.
Verified with grep search across all apps.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: Commit created successfully

---

## Task 4: Remove packages/proto Directory

**Files:**

- Delete: `packages/proto/` (entire directory)

**Step 1: Remove packages/proto**

Run:

```bash
git rm -r packages/proto
```

Expected: Directory and all contents staged for deletion

**Step 2: Verify packages directory is gone**

Run:

```bash
ls -la packages/
```

Expected: Error "No such file or directory" (packages/ should be empty and removed)

**Step 3: Commit proto package removal**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: remove unused packages/proto

The proto package contained only agent.proto and was not imported
by any app. Verified with grep search across all apps.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: Commit created successfully

---

## Task 5: Remove apps/web/deno.json

**Files:**

- Delete: `apps/web/deno.json`

**Step 1: Check current web config**

Run:

```bash
ls -la apps/web/ | grep -E "(deno\.json|package\.json)"
```

Expected: Shows both `deno.json` and `package.json`

**Step 2: Remove redundant deno.json**

Run:

```bash
git rm apps/web/deno.json
```

Expected: File staged for deletion

**Step 3: Verify package.json still exists**

Run:

```bash
cat apps/web/package.json | head -5
```

Expected: Shows package.json content with "hmls-web" name

**Step 4: Commit web config cleanup**

Run:

```bash
git commit -m "$(cat <<'EOF'
chore: remove redundant apps/web/deno.json

The web app uses Bun and package.json as primary tooling. The
deno.json was redundant and not needed.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: Commit created successfully

---

## Task 6: Update Root deno.json Workspace

**Files:**

- Modify: `deno.json:2`

**Step 1: Read current workspace config**

Run:

```bash
cat deno.json | grep -A1 "workspace"
```

Expected: Shows workspace array with packages

**Step 2: Update workspace array**

Edit `deno.json` line 2 from:

```json
"workspace": ["./apps/web", "./apps/api", "./apps/diagnostic-agent"],
```

To (already correct):

```json
"workspace": ["./apps/web", "./apps/api", "./apps/diagnostic-agent"],
```

Wait - check if packages are in workspace first:

```bash
cat deno.json | grep workspace
```

If packages are listed, remove them. If not, skip this task.

**Step 3: Verify workspace syntax**

Run:

```bash
deno check apps/api/src/index.ts
```

Expected: No errors

**Step 4: Commit workspace config update (if changed)**

Run:

```bash
git add deno.json
git commit -m "$(cat <<'EOF'
chore: update workspace config to remove packages

Remove packages/ from workspace array since both packages/shared
and packages/proto have been deleted.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: Commit created successfully (or skip if no changes)

---

## Task 7: Update CLAUDE.md Architecture Section

**Files:**

- Modify: `CLAUDE.md:21-35`

**Step 1: Read current architecture section**

Run:

```bash
sed -n '/## Architecture/,/## /p' CLAUDE.md | head -20
```

Expected: Shows current architecture with packages/ references

**Step 2: Update architecture section**

Edit `CLAUDE.md` - find the architecture section and update it to:

```markdown
## Architecture

Deno workspace monorepo for a mobile mechanic business with an AI-powered chat agent. All apps
deploy to **Deno Deploy** via GitHub integration. Root config is `deno.json`; web app uses
Bun/Next.js internally.
```

apps/ ├── web/ # Next.js 16 frontend (React 19, Tailwind CSS 4) → Deno Deploy ├── api/ # Deno AI
agent (Zypher framework, Claude Sonnet 4, AG-UI protocol) → Deno Deploy └── diagnostic-agent/ # Deno
diagnostic agent → Deno Deploy

```
### Service Communication
```

Remove the `packages/` section that previously showed:

```
packages/
├── shared/  # Shared types and utilities
└── proto/   # Protocol definitions
```

**Step 3: Verify markdown syntax**

Run:

```bash
cat CLAUDE.md | grep -A15 "## Architecture"
```

Expected: Shows updated architecture without packages

**Step 4: Commit documentation update**

Run:

```bash
git add CLAUDE.md
git commit -m "$(cat <<'EOF'
docs: update CLAUDE.md to reflect simplified structure

Remove packages/ from architecture section since both shared and
proto packages have been deleted.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Expected: Commit created successfully

---

## Task 8: Verification Suite

**Files:**

- Verify: All app type checking and builds

**Step 1: Type check API**

Run:

```bash
deno task check:api
```

Expected: Check successful, no errors

**Step 2: Type check diagnostic agent**

Run:

```bash
deno task check:diagnostic
```

Expected: Check successful, no errors

**Step 3: Install web dependencies if needed**

Run:

```bash
cd apps/web && bun install
```

Expected: Dependencies installed or already up to date

**Step 4: Type check web**

Run:

```bash
deno task typecheck:web
```

Expected: Type check successful, no errors

**Step 5: Verify final git status**

Run:

```bash
git status
```

Expected: Working tree clean (all changes committed)

**Step 6: Review commit history**

Run:

```bash
git log --oneline -10
```

Expected: Shows all cleanup commits in logical order

---

## Task 9: Final Documentation

**Files:**

- Create: None (verification task)

**Step 1: Verify directory structure**

Run:

```bash
tree -L 2 -I 'node_modules|.next' .
```

Expected: Shows clean structure with only apps/, docs/, .github/, and config files at root

**Step 2: Verify no broken references**

Run:

```bash
grep -r "packages/" CLAUDE.md README.md 2>/dev/null || echo "No references found"
```

Expected: "No references found" or only in appropriate context (like this plan)

**Step 3: Create summary report**

List what was removed:

- 2 directories: `packages/shared/`, `packages/proto/`
- 3 files: `CONTRIBUTING.md`, `DEVELOPMENT.md`, `apps/web/deno.json`
- Updated: `deno.json` (workspace), `CLAUDE.md` (architecture)

**Step 4: Mark implementation complete**

Implementation complete! All unused files removed, configuration updated, documentation reflects
reality.

---

## Success Criteria Checklist

- [x] No imports of `@hmls/shared` or `@hmls/proto` found in apps
- [x] `CONTRIBUTING.md` deleted
- [x] `DEVELOPMENT.md` deleted
- [x] `packages/shared/` deleted
- [x] `packages/proto/` deleted
- [x] `apps/web/deno.json` deleted
- [x] Root `deno.json` workspace updated
- [x] `CLAUDE.md` architecture section updated
- [x] `deno task check:api` passes
- [x] `deno task check:diagnostic` passes
- [x] `deno task typecheck:web` passes
- [x] All changes committed with clear messages
- [x] Working tree clean

## Rollback Instructions

If anything goes wrong, restore from git:

```bash
# Restore specific files
git checkout HEAD~N -- packages/ CONTRIBUTING.md DEVELOPMENT.md apps/web/deno.json

# Or reset to before cleanup
git reset --hard <commit-hash-before-cleanup>
```

Where N is the number of commits made during cleanup (approximately 6-7 commits).
