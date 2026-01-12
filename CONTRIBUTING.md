# Contributing to HMLS

Thank you for your interest in contributing to HMLS! This document provides guidelines and information for contributors.

## Branch Strategy (GitFlow)

We use GitFlow for branch management:

- **`main`** - Production-ready code. All code here is deployed to production.
- **`develop`** - Integration branch for features. PRs should target this branch.
- **`feature/*`** - New features (e.g., `feature/chat-improvements`)
- **`release/*`** - Release preparation (e.g., `release/v1.1.0`)
- **`hotfix/*`** - Emergency production fixes

### Workflow

1. Create a feature branch from `develop`:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/my-feature
   ```

2. Make your changes and commit:
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push and create a PR to `develop`:
   ```bash
   git push origin feature/my-feature
   # Create PR via GitHub
   ```

4. After review and approval, your PR will be merged to `develop`.

5. Releases are cut from `develop` to `main` via release branches.

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

1. Ensure your branch is up to date with `develop`
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
