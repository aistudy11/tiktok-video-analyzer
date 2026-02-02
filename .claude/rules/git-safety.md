---
paths: []
universal: true
framework_deps: []
---

# Git Safety (Universal)

## Non-negotiable Rules
- Deletions/renames require explicit intent: use `GIT_SAFETY_ALLOW_DELETE=1` when committing.
- Annotation-only commits must be explicit: use `GIT_SAFETY_MODE=annotations`, which allows only modified `.ts/.tsx` files.
- Do not use `git add .` or `git add -A` for annotation tasks.
- Always inspect staged changes with `git diff --cached --stat` before commit.

## Intent Mapping
- **Annotation task** -> `GIT_SAFETY_MODE=annotations` + `git add -u '*.ts' '*.tsx'`
- **Deletion task** -> `GIT_SAFETY_ALLOW_DELETE=1` + targeted `git add` / `git rm`
