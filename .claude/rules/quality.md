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

# Quality Gates (Path-Activated)

This rule activates for source files.
These standards are **framework-agnostic** and apply to any software project.

## Definition of Done

### Code Quality Checklist
- [ ] Tests written and passing
- [ ] Code follows project conventions
- [ ] No linter/formatter warnings
- [ ] Commit messages are clear
- [ ] Implementation matches plan
- [ ] No TODOs without issue numbers

### End-to-End Completeness Checklist
- [ ] **Backend完整性**: API returns all fields correctly
- [ ] **传输完整性**: Frontend receives complete data
- [ ] **状态完整性**: State/Context stores data correctly
- [ ] **组件完整性**: UI components render data correctly
- [ ] **交互完整性**: User can see and operate feature
- [ ] **效果完整性**: Feature achieves expected UX

### Data Integrity Checklist
- [ ] All returned fields are used (no ignored data)
- [ ] All defined types have corresponding UI display
- [ ] All state changes reflect in UI
- [ ] No data loss in transmission chain

**CRITICAL**: A feature is NOT done if users cannot see or use it, regardless of backend completeness.

## Configuration & Code Consistency Self-Check

Before every check/commit, execute these self-checks to ensure no omissions or drift:

### Enum & Config Consistency
- Config values ↔ Runtime usage ↔ Supported values: Compare one by one
- Missing/extra/alias entries: Document explicitly
- Confirm whether fallback paths are triggered

### Single Source of Truth
- Generators/enums must come from a single source (config or metadata)
- Manually maintained lists that can drift are forbidden

### Fallbacks & Hardcoding
- List all fallback trigger conditions
- Note if hardcoded safety nets still exist
- If configurable, make it config-driven

### Determinism
- Confirm no `Math.random()` in deterministic code paths
- Field seeds should be independent and use unified seed system
- If "variation mode" needed, document activation conditions

### Validation Coverage
- State which scripts/methods verified which modules
- Explicitly list uncovered blind spots

### Statistics vs Implementation
- If referencing distribution stats, state sample size and uncovered modules
- Avoid generalizing from partial data

### Unresolved Risks
- Explicitly list unresolved or unverified risks/TODOs
- This section must not be empty

## Test Guidelines

- Test behavior, not implementation
- One assertion per test when possible
- Clear test names describing scenario
- Use existing test utilities/helpers
- Tests should be deterministic

## Commit Standards

### Every Commit Must:
- Compile successfully
- Pass all existing tests
- Include tests for new functionality
- Follow project formatting/linting

### Before Committing:
- Run formatters/linters
- Self-review changes
- Ensure commit message explains "why"

## Implementation Flow

1. **Understand** - Study existing patterns in codebase
2. **Test** - Write test first (red)
3. **Implement** - Minimal code to pass (green)
4. **Refactor** - Clean up with tests passing
5. **Commit** - With clear message

## When Stuck (After 3 Attempts)

**CRITICAL**: Maximum 3 attempts per issue, then STOP.

1. **Document what failed**: What tried, error messages, why it failed
2. **Research alternatives**: Find 2-3 similar implementations
3. **Question fundamentals**: Right abstraction? Smaller problems? Simpler approach?
4. **Try different angle**: Different library feature? Different pattern?

---

## Never Do

- Use `--no-verify` to bypass commit hooks
- Disable tests instead of fixing them
- Commit code that doesn't compile
- Make assumptions - verify with existing code
- Implement partial solutions
- Stop at data transmission without UI
- Claim completion without user-visible effects
- Use "minimal changes" when system needs complete solution

## Always Do

- Commit working code incrementally
- Update plan documentation as you go
- Learn from existing implementations
- Stop after 3 failed attempts and reassess
- Verify every claim with actual code/config checks
- Implement end-to-end from data source to UI
- Create new components when data structure changes
- Test the complete data flow before claiming done
