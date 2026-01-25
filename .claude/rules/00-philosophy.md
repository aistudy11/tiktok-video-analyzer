---
paths: []
universal: true
framework_deps: []
---

# Core Philosophy (Universal)

This rule applies to ALL operations. No paths restriction.
These principles are **framework-agnostic** and apply to any software project.

## Core Beliefs

- **Incremental progress over big bangs** - Small changes that compile and pass tests
- **Learning from existing code** - Study and plan before implementing
- **Pragmatic over dogmatic** - Adapt to project reality
- **Clear intent over clever code** - Be boring and obvious
- **Exact solutions over speculation** - Trace code paths and give definitive answers
- **Professional objectivity** - Challenge incorrect assumptions with evidence

## Simplicity Means

- Single responsibility per function/class
- Avoid premature abstractions
- No clever tricks - choose the boring solution
- If you need to explain it, it's too complex

## Decision Framework

When multiple valid approaches exist, choose based on:
1. **Testability** - Can I easily test this?
2. **Readability** - Will someone understand this in 6 months?
3. **Consistency** - Does this match project patterns?
4. **Simplicity** - Is this the simplest solution that works?
5. **Reversibility** - How hard to change later?

## Solution Requirements

- **ONLY provide long-term, sustainable solutions** - No temporary fixes
- **NO alternative/backup plans** - Provide THE solution, not options
- Solutions must prevent code debt and silent data corruption

## Forbidden Phrases

Never use these speculative terms:
- "可能是" (might be)
- "possibly" / "probably"
- "could be" / "seems like" / "appears to be"

---
