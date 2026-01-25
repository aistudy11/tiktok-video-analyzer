---
paths:
  - "**/*.ts"
  - "**/*.tsx"
  - "**/*.js"
  - "**/*.jsx"
universal: false
framework_deps: []
---

# Logging Governance Rules (Path-Activated)

Automatically activated when working with source files.
This rule is **framework-agnostic** and applies to any TypeScript/JavaScript project.

## Zero Console Principle

- Production code MUST NOT contain `console.*`
- Before commit, run `rg 'console\.' src` to confirm only whitelisted files (e.g. logger shims) contain console
- During debugging, prefer structured logger and delete debug logs after issue resolved

## Unified Logger Pattern

If the repo has a logger utility, use it. If no logger exists, do not introduce a new logging framework without team approval.

All logs should be structured with consistent fields:

```typescript
logger.info({
  event: 'user_login',
  module: 'auth',
  traceId: ctx.traceId,
  userId: ctx.userId,
  payload: { method: 'oauth' }
});
```

### Logger Requirements
- Include contextual fields (traceId/userId) when available
- Mask sensitive fields (token, email, phone, password)
- Use structured format (JSON) for production logs

## Log Level Guidelines

| Level | When to Use | Target |
|-------|-------------|--------|
| `fatal` | System unrecoverable | Immediate alert |
| `error` | Request failed | < 0.1% of requests |
| `warn` | Degradation/retry | Monitoring |
| `info` | Key business milestones | Audit trail |
| `debug/trace` | Only in debug mode | Development |

### Level Selection Decision Tree

```
Is the system crashing/unrecoverable? → fatal
Is this request failing? → error
Is something degraded but recoverable? → warn
Is this a business event worth auditing? → info
Is this for debugging only? → debug/trace
```

### Special Cases

- **Performance/timing**: Use dedicated perf logging if available
- **Audit events**: Never omit required fields; use `logger.audit` if available
- **Security events**: Always log auth failures, permission denials

## Sensitive Data Handling

```typescript
// ❌ WRONG: Logging sensitive data
logger.info({ user: { email: user.email, token: user.token } });

// ✅ CORRECT: Masking sensitive fields
logger.info({
  user: {
    email: maskEmail(user.email),  // j***@example.com
    hasToken: !!user.token         // boolean only
  }
});
```

### Fields That MUST Be Masked
- Passwords, tokens, API keys
- Email addresses, phone numbers
- Credit card numbers, SSN
- IP addresses (in some jurisdictions)

## Code Review Standards

- [ ] No `console.*` in production code
- [ ] New logs explain their purpose
- [ ] Sensitive info is masked
- [ ] Log levels are appropriate
- [ ] Structured format used

---

## Checklist (Before committing code with logging)

- [ ] No `console.log/warn/error` statements
- [ ] Logs use structured `logger.*` format when available
- [ ] Log levels are appropriate for the event
- [ ] Sensitive data is masked
- [ ] Debug logs removed after issue resolved
- [ ] Context fields (traceId, userId) included where available

## Verification Commands

```bash
# Find console statements (should be empty or only in logger shim)
rg 'console\.' src/ -g "*.{ts,tsx,js,jsx}"

# Find unstructured logging (string-only logs)
rg 'logger\.(info|warn|error)\([^{]' src/ -g "*.{ts,tsx,js,jsx}"

# Check for sensitive data in logs
rg '(password|token|secret|key|email|phone)' src/ -g "*.{ts,tsx,js,jsx}" -C 2 | rg "log"

# Find debug logs that might be left behind
rg 'logger\.(debug|trace)' src/ -g "*.{ts,tsx,js,jsx}"
```
