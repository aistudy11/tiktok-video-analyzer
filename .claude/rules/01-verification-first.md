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

# Verification-First Principle (Path-Activated)

This rule activates for source files.
This principle is **framework-agnostic** and applies to any software project.

## Core Rule

**Any suggestion or solution MUST be preceded by verification of current state.**

## Mandatory Verification Checklist

Before proposing ANY configuration or code change:

1. **Verify production or runtime state**
   ```bash
   curl -I https://[domain] | rg -i "[feature|header]"
   ```

2. **Check existing configuration**
   ```bash
   rg "[config_name]" .env* src/
   ```

3. **Confirm feature existence**
   ```bash
   # Check if already implemented
   rg "feature_name" src/ -g "*.{ts,tsx,js,jsx}"
   ```

4. **Verify database structure when relevant**
   ```bash
   # Prefer repo-provided scripts if present
   rg "db:verify|db:generate|db:push|db:migrate|db:studio" package.json
   # If docs/db-query.js exists, use it
   node docs/db-query.js fields <table_name>
   ```

5. **Verify the problem exists**
   ```bash
   # Reproduce error, check logs, test functionality
   ```

## Strictly Forbidden

- Assuming documentation equals required features
- Making assumptions based on other project experience
- Saying "this is standard practice" without verification
- Fabricating "best practices" to support opinions
- Assuming missing configuration without actual checking

## Document Trust Levels

| Level | Source | Action |
|-------|--------|--------|
| **Highest** | Running code, DB queries, production responses, user screenshots | Trust directly |
| **Verify** | Project docs, config examples, comments | Verify before using |
| **Cannot rely solely** | External docs, tutorials, other project experience | Must cross-verify |

## Verification Commands Cheatsheet

```bash
# Environment variables
rg "VARIABLE_NAME" .env* --hidden

# Feature existence
rg "feature_name" src/ -g "*.{ts,tsx,js,jsx}"

# Config usage
rg "process.env.CONFIG_NAME" src/

# Production verification
curl -s -I https://domain.com | rg -i "header-name"

# Database structure (use repo-provided scripts if present)
# e.g. pnpm db:verify / pnpm db:generate / pnpm db:push
rg "db:verify|db:generate|db:push" package.json

# Database structure (if docs/db-query.js exists)
node docs/db-query.js fields <table_name>

# Git history (did feature ever exist?)
git log --grep="feature_name" --oneline
```

## Error Admission Protocol

When wrong advice is discovered:
1. **Admit immediately** - No excuses
2. **Analyze cause** - Which verification step was missed
3. **Provide correct solution** - Based on verification
4. **Learn** - Don't repeat the same mistake

---

## Checklist (Before ANY suggestion)

- [ ] Verified current production/environment state
- [ ] Checked existing codebase for similar implementations
- [ ] Confirmed the problem actually exists
- [ ] Tested with actual commands, not assumptions
- [ ] Cross-verified with multiple sources if external docs used
