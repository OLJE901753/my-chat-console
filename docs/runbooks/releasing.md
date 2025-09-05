# Releasing

## Conventional Commits
- Use feat/fix/chore/docs/refactor/test perf build ci style etc.
- Commit messages validated via commitlint.

## Changesets
```sh
pnpm changeset
pnpm changeset version
```
- Commit the updated changelogs and versions.
- Tag and push when ready.

## CI
- CI must be green (typecheck, lint, tests) before merging to main.
