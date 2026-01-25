---
paths:
  - "package.json"
  - "pnpm-lock.yaml"
  - "yarn.lock"
  - "package-lock.json"
  - "tsconfig.json"
  - "jsconfig.json"
  - "**/node_modules/**"
universal: false
framework_deps: []
---

# Third-Party Library Integration Rules (Path-Activated)

Automatically activated when working with dependency files.
This rule is **package-manager-agnostic** and applies to npm, pnpm, yarn, or any Node.js package manager.

## Core Principle

**When integrating third-party libraries, MUST consult latest documentation and actual source/typings. NEVER guess APIs based on memory.**

## Mandatory Verification Flow

### Step 1: Documentation Check

- Read the official docs for the exact version you will use.
- If docs are versioned, match the installed version.
- If a doc-search tool exists, use it to locate the exact API section.

### Step 2: Installed Package or Source Inspection

```bash
# Check installed version
pnpm list <package>  # or npm list, yarn list

# Inspect types/source from node_modules
rg "export" node_modules/<package> -g "*.d.ts"

# View package exports
cat node_modules/<package>/package.json | jq '.exports'

# Optional: inspect upstream source (if open-source repo is available)
gh api repos/{owner}/{repo}/contents/{path} --jq '.[].name'
```

### Step 3: Source/Changelog Review (if behavior is unclear)

- Read the package changelog or release notes.
- If a GitHub repo is available, confirm the relevant source code.
- Verify TypeScript type definitions for the exact API surface.

## Strictly Forbidden

- ❌ Writing code based on model memory or training data
- ❌ Assuming interfaces without verification
- ❌ Using outdated example code from tutorials
- ❌ Calling third-party APIs without reading docs or types
- ❌ Mixing different major version patterns

## Version Compatibility

```typescript
// ❌ WRONG: Assuming API exists
import { newFeature } from 'library'; // May not exist in installed version

// ✅ CORRECT: Verify first
// 1. Check installed version: pnpm list library
// 2. Check if feature exists in that version's docs
// 3. Check type definitions: node_modules/library/index.d.ts
```

## Common Pitfalls

| Pitfall | How to Avoid |
|---------|--------------|
| API changed between versions | Check installed version, read changelog |
| Tutorial uses older/newer API | Verify against your installed version |
| Optional peer dependency missing | Check package.json peerDependencies |
| Type definitions outdated | Check @types/* version matches library version |
| Default export changed | Inspect package.json exports field |

---

## Checklist (Before integrating any new library)

- [ ] Read official docs for the target version
- [ ] Verified TypeScript type definitions in `node_modules` or source
- [ ] Confirmed API signatures match docs
- [ ] Checked breaking changes in recent versions
- [ ] Avoided assumptions based on other projects
- [ ] Verified peer dependencies are installed

## Verification Commands

```bash
# Check installed version
pnpm list <package>  # or npm list, yarn why

# Check for available updates
pnpm outdated  # or npm outdated, yarn outdated

# View package info
pnpm info <package>  # or npm info, yarn info

# Search installed types
rg "interface|type|class" node_modules/<package> -g "*.d.ts"

# Check peer dependencies
cat node_modules/<package>/package.json | jq '.peerDependencies'

# Search upstream source (if needed)
gh api -X GET search/code -f q="function_name+repo:owner/repo"
```
