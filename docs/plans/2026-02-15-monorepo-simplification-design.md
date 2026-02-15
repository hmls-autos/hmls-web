# Monorepo Simplification Design

**Date:** 2026-02-15 **Status:** Approved **Approach:** Conservative Cleanup

## Overview

Simplify the hmls-web monorepo by removing unused packages, redundant configuration files, and
outdated documentation while preserving all functional code and the existing Deno workspace
structure.

## Motivation

The current monorepo contains:

- Two unused packages (`packages/proto/`, `packages/shared/`) with no imports in any app
- Outdated documentation files (`CONTRIBUTING.md`, `DEVELOPMENT.md`) with information that conflicts
  with or duplicates `CLAUDE.md`
- Redundant configuration (`apps/web/deno.json` when web uses Bun/package.json primarily)

This creates confusion for developers and makes the project harder to understand.

## Scope

### What We'll Remove

1. **`packages/proto/`** - Contains only `agent.proto` file, not imported anywhere
2. **`packages/shared/`** - Has types for websocket/entities, but no imports found in apps
3. **`CONTRIBUTING.md`** - Branch strategy and commit conventions (already covered in CLAUDE.md)
4. **`DEVELOPMENT.md`** - Setup instructions (outdated, references old `bun` commands instead of
   `deno task`)
5. **`apps/web/deno.json`** - Redundant since web app uses `package.json` and Bun as primary tooling

### What We'll Update

1. **Root `deno.json`** - Remove `packages/` references from workspace array
2. **`CLAUDE.md`** - Update architecture section to reflect removed packages

### What Stays Intact

- All three apps (web, api, diagnostic-agent)
- Root `deno.json` for workspace coordination
- App-specific `deno.json` files for api and diagnostic-agent
- All `node_modules/` directories (required for Deno npm compatibility)
- `docs/plans/` directory (useful historical context)
- All `.env.example`, `docker-compose.yml`, GitHub workflows

## Implementation Steps

### Deletion Order (Safest First)

1. **Remove documentation files** (zero code impact)
   - Delete `CONTRIBUTING.md`
   - Delete `DEVELOPMENT.md`

2. **Remove unused packages** (verified no imports)
   - Delete `packages/shared/` directory
   - Delete `packages/proto/` directory

3. **Remove redundant config**
   - Delete `apps/web/deno.json`

4. **Update workspace configuration**
   - Edit root `deno.json`: remove packages from workspace array
   - Result: `"workspace": ["./apps/web", "./apps/api", "./apps/diagnostic-agent"]`

5. **Update documentation**
   - Edit `CLAUDE.md`: Remove references to `packages/` in architecture section
   - Update project structure to show current reality

### Verification Steps

After each change, verify:

- Run `deno task check:api` - ensure API still type-checks
- Run `deno task check:diagnostic` - ensure diagnostic agent still type-checks
- Run `deno task typecheck:web` - ensure web still type-checks
- Check git status is clean (except our intentional deletions)

### Rollback Plan

Since we're only deleting files, git can restore everything with:

```bash
git checkout HEAD -- packages/ CONTRIBUTING.md DEVELOPMENT.md apps/web/deno.json
```

## Expected Outcomes

### File System Changes

- Remove 2 directories: `packages/proto/`, `packages/shared/`
- Remove 3 files: `CONTRIBUTING.md`, `DEVELOPMENT.md`, `apps/web/deno.json`
- Modify 2 files: `deno.json` (workspace array), `CLAUDE.md` (architecture docs)

### Benefits

1. **Clearer structure** - No unused packages confusing developers
2. **Single source of truth** - All dev guidance in CLAUDE.md
3. **Reduced cognitive load** - Fewer files to understand what's actually used
4. **Accurate documentation** - Architecture section matches reality

### No Impact On

- Build processes (all `deno task` commands work the same)
- Deployments (Deno Deploy config unchanged)
- CI/CD (workflows already updated)
- Development workflow (no used code removed)

### Success Criteria

- ✅ All type checks pass (`check:api`, `check:diagnostic`, `typecheck:web`)
- ✅ No import errors when running dev servers
- ✅ Documentation accurately reflects project structure
- ✅ Workspace only lists actual apps (no packages)
- ✅ Commit is clean with clear message

### Post-Cleanup Structure

```
hmls-web/
├── apps/
│   ├── web/              # Next.js (no deno.json)
│   ├── api/              # Deno agent
│   └── diagnostic-agent/ # Deno agent
├── docs/
│   └── plans/            # Historical context
├── .github/
│   └── workflows/
├── deno.json             # Workspace: 3 apps only
├── CLAUDE.md             # Single source of truth
└── docker-compose.yml
```

## Architecture Updates for CLAUDE.md

The architecture section should be updated to:

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
```

## Risk Assessment

**Risk Level:** Low

- Only removing unused code and documentation
- All critical paths (builds, deployments, CI) remain unchanged
- Easy rollback via git
- No dependency changes

## Next Steps

1. Create implementation plan using writing-plans skill
2. Execute cleanup in safe order
3. Run verification suite
4. Commit with message: `chore: simplify monorepo structure - remove unused packages and docs`
