---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
  - "**/*.mjs"
  - "**/*.cjs"
universal: false
framework_deps: []
---

# End-to-End Implementation Principle (Path-Activated)

This rule activates for source files.
This principle is **framework-agnostic** and applies to any software project.

## Core Rule

**Any feature modification MUST traverse ALL layers. Partial implementation is forbidden.**

## The 6-Layer Completeness Model

Every feature MUST be implemented across ALL layers:

```
□ Layer 1: Data Source (API/Database)
□ Layer 2: Data Transfer (Network)
□ Layer 3: Data Reception (Frontend receives)
□ Layer 4: Data Storage (State management)
□ Layer 5: Data Display (UI Components)  ← MOST COMMONLY MISSED
□ Layer 6: User Interaction (Can use it)  ← MOST COMMONLY MISSED
```

## The "Plumbing vs Faucet" Rule

Just like replacing pipes (backend) without replacing faucets (UI) doesn't give users water:
- Changing API without UI = Users see nothing
- Adding types without components = No visual change
- Passing data without displaying = Wasted effort

**CRITICAL**: Backend completeness ≠ Feature completeness

## Zero-Dual-System Doctrine

### Absolute Prohibitions
- No A/B testing implementations, no gray releases, no temporary fallbacks
- No dual implementations coexisting
- If old implementation exists, must unify/migrate/delete - no parallel retention
- Data models and code MUST match strictly (single source of truth)

### Strictly Forbidden Patterns

| Pattern | Why Forbidden |
|---------|---------------|
| "Minimal change, use for now" | Most common violation |
| "Change backend first, frontend later" | Must change together |
| "Data passed, UI can wait" | Must complete end-to-end |
| "Keep old code just in case" | Must remove completely |

### Stop Immediately If

1. Modification only touches some layers (e.g., API but not UI)
2. Data is passed but not used (e.g., `creative` field fetched but not displayed)
3. Old and new implementations coexist (e.g., two classification logics)
4. Solution expects "future improvements"

## Correct Implementation Pattern

```typescript
// Verify complete chain before/after changes
1. API returns data → console.log confirmed
2. Frontend receives → console.log confirmed
3. State stores data → DevTools confirmed
4. Component uses data → Render confirmed
5. User sees result → Screenshot confirmed
```

## Real-time Communication Exception

**ONLY for real-time communication scenarios**, main+fallback channel architecture is allowed:
- Primary channel (SSE/WebSocket): Default and prioritized
- Fallback channel (polling): Only activates when primary fails
- **Never both active simultaneously**
- Auto-switch back when primary recovers

**All other scenarios: Zero dual-system tolerance**

---

## Checklist (Before claiming "Done")

- [ ] Can the user SEE the change? (Screenshot it)
- [ ] Can the user USE the feature? (Test it)
- [ ] Does the UI SHOW all the data? (Verify rendering)
- [ ] Is there a NEW component if needed? (Don't force old components)
- [ ] All 6 layers implemented and verified
- [ ] No parallel/legacy implementations remaining
