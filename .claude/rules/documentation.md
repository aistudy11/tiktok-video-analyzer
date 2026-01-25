---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/_ARCHITECTURE.md"
  - "**/README.md"
  - "**/CONTRIBUTING.md"
universal: false
framework_deps: []
---

# Documentation Sync Rules (Path-Activated)

> **Core Principle**: Code updates should sync with related documentation.
> Treat code and documentation as a unified system.

This rule is **framework-agnostic** and provides documentation patterns applicable to any codebase.

## Collaborator Mindset

**Identity**:
- ❌ Not an "external modifier"
- ✅ Part of the system
- ✅ Knows what you're modifying, what might break, and what docs to update

**Self-Healing Cycle**: Modify code → Update docs → Link downstream → Repeat

---

## Three-Layer Documentation Structure (Recommended)

```
Layer 1: Root README/CLAUDE.md  → System overview + rule entry point
    ↓
Layer 2: _ARCHITECTURE.md       → Directory-level documentation
    ↓
Layer 3: File header comments   → Fine-grained In/Out/Pos annotations
```

> **Note**: Adopt layers that fit your project. Not all projects need all layers.

---

## Rule 1: File Header Annotations (Recommended Pattern)

For TypeScript/JavaScript files, consider adding header annotations after directives, before imports:

```typescript
/**
 * @fileoverview [One-line description: what this file does]
 * @input [Dependencies: external modules, props, context]
 * @output [Exports: functions/components/types provided]
 * @pos [Role: position in system, who calls this]
 */
```

### Example: Client Component

```typescript
'use client';

/**
 * @fileoverview Detail page component, displays core content and action entries
 * @input ItemDetail from props, useSession from auth
 * @output React component rendering detail UI
 * @pos Page component layer, called by /items/[slug]/page.tsx
 */

import { ... } from '...';
```

## Rule 1.5: Annotation-Driven Changes (Required)

When modifying any file that already has header annotations, you MUST read and use them before making changes. If you did not read them, do not proceed with code edits.

### Mandatory Pre-Change Steps
1. Read `@pos` to understand the file's role and callers.
2. Read `@input` to identify upstream dependencies and compatibility constraints.
3. Read `@output` to identify downstream exports and impact scope.
4. State (in the change log or response) that these annotations were read and used for the decision.

### Decision Use
- If `@pos` indicates a data or core layer, assess impact on callers before edits.
- If `@input` lists multiple dependencies, verify planned changes remain compatible.
- If `@output` is widely referenced, plan ripple updates or mitigation.

### Fallback: Annotation Reliability Check
If annotations conflict with code reality:
1. Treat code as the single source of truth.
2. Verify actual dependencies/exports with `rg` searches.
3. Report the mismatch explicitly (which tag is inconsistent and why).
4. Mark annotations as stale and update them after the code change.

### Example: Data Layer File

```typescript
/**
 * @fileoverview Resource data access layer, provides CRUD operations
 * @input db from @/db (or @/core/db), types from ./types
 * @output getItem, getItems, createItem data access functions
 * @pos Data access layer, called by services or API routes
 */

import { ... } from '...';
```

## Rule 2: Directory Architecture Declaration (Recommended)

For directories with 2+ source files, consider creating `_ARCHITECTURE.md`:

```markdown
# [Directory Name]

[3 lines max: What is this - What it does - Position in system]

## File Manifest

| File | Responsibility | Role |
|------|----------------|------|
| index.ts | Unified exports | Entry |
| types.ts | Type definitions | Foundation |

## Dependencies
- Upstream: [Who uses this]
- Downstream: [What this depends on]

## Update Rules
⚠️ Update this doc when files are added/removed or major changes occur.
```

## Rule 3: Semantic Linking

- When referencing other files in @input, use their @pos description
- Example: `@input item-card.tsx list card component`

## Rule 4: Update Propagation

When modifying a file:
1. Update that file's header comment (if changed)
2. Check and update directory's `_ARCHITECTURE.md`
3. If affecting other files' @input, notify or update

## Exemptions

Files that don't need header annotations:
- `*.d.ts` type declaration files
- `__tests__/` test directories
- `*.test.ts` / `*.spec.ts` test files
- Generated files
- Config files (tsconfig.json, etc.)

---

## Checklist (When Creating/Modifying Files)

### Creating New Files
- [ ] Added @fileoverview/@input/@output/@pos annotations (if applicable)
- [ ] Annotation position is correct (after 'use client', before imports)
- [ ] Checked if directory needs new/updated _ARCHITECTURE.md

### Modifying Files
- [ ] Updated header comment if changes affect it
- [ ] Updated @output if exports changed
- [ ] Updated @input if dependencies changed
- [ ] Checked directory's _ARCHITECTURE.md

### Creating New Directories
- [ ] Created _ARCHITECTURE.md (if directory has 2+ files)
- [ ] Filled in directory description and file manifest

## Verification Commands

```bash
# Check file annotation coverage (if script exists)
# node scripts/check-annotations.js

# Check directory documentation coverage (if script exists)
# node scripts/check-architecture-docs.js

# Simple spot check
rg "@fileoverview" src/ -g "*.{ts,tsx}"

# Find undocumented directories with multiple files
find src -type d -exec sh -c 'ls -1 "$1"/*.ts 2>/dev/null | wc -l | grep -q "^[2-9]" && [ ! -f "$1/_ARCHITECTURE.md" ] && echo "$1"' _ {} \;
```

## Adoption Strategy

For existing projects, adopt documentation incrementally:

| Phase | Focus | Goal |
|-------|-------|------|
| Start | Critical entry points | Document main entry files |
| Growth | High-traffic code | Document frequently modified areas |
| Mature | Full coverage | Document all production code |

> **Note**: Set coverage targets based on your team's capacity and project needs.
