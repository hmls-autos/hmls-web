# Contributing to HMLS

Thank you for your interest in contributing to HMLS! This document provides guidelines and information for contributors.

## Branch Strategy (GitHub Flow)

We use GitHub Flow - a simple, trunk-based workflow:

```
main ────●────●────●────●──── (always deployable)
          ↑    ↑    ↑    ↑
feature/a─┘    │    │    │
feature/b──────┘    │    │
fix/bug-x───────────┘    │
feature/c────────────────┘
```

- **`main`** - Production-ready code. Always deployable.
- **`feature/*`** - New features (e.g., `feature/chat-improvements`)
- **`fix/*`** - Bug fixes (e.g., `fix/auth-timeout`)
- **`release/*`** - Release PRs (created by `bun run release`)

### Workflow

1. Create a feature branch from `main`:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create a PR to `main`:
   ```bash
   git push origin feature/my-feature
   # Create PR via GitHub
   ```

4. After review and CI passes, your PR will be merged to `main`.

### Releasing

Releases are created via PR:

```bash
bun run release patch   # Creates release PR
# Review & merge the PR
# Tag and Docker image are created automatically
```

## Commit Message Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build process, dependencies, tooling

### Examples

```
feat(chat): add markdown rendering for messages
fix(api): resolve authentication timeout issue
docs: update README with setup instructions
chore(deps): update turbo to v2.5.0
```

## Pull Request Process

1. Ensure your branch is up to date with `main`
2. Run linting and type checks locally:
   ```bash
   bun run lint
   bun run typecheck
   ```
3. Fill out the PR template completely
4. Request review from a code owner
5. Address any feedback
6. Once approved, your PR will be merged

## Code Style

- We use [Biome](https://biomejs.dev/) for linting and formatting
- Run `bun run lint` to check for issues
- Configuration is in `biome.json` files

## Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for local development setup instructions.

## Questions?

If you have questions, feel free to open a discussion on GitHub.
