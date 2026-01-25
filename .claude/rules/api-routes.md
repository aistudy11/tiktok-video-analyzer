---
paths:
  - "**/api/**/*"
  - "**/routes/**/*"
  - "**/endpoints/**/*"
  - "**/handlers/**/*"
  - "**/controllers/**/*"
universal: false
framework_deps: []
---

# API Routes Rules (Path-Activated)

Automatically activated when working with API route files.
This rule is **framework-agnostic** and applies to any backend API layer (Next.js, Express, Fastify, Hono, NestJS, etc.).

## Error Handling

- Fail fast with descriptive messages
- Include context for debugging
- Handle errors at appropriate level
- Never silently swallow exceptions

```typescript
// ✅ CORRECT: Clear error with context
if (!data.required_field) {
  throw new Error(
    `Missing required field 'required_field' in table 'users' for uuid: ${uuid}`
  );
}

// ❌ WRONG: Silent handling
const value = data.field || 'default'; // Masks data problems!

// ❌ WRONG: Swallowing errors
try {
  await riskyOperation();
} catch (error) {
  // silently ignored
}

// ✅ CORRECT: Proper error handling
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error, context });
  throw new ApiError('Operation failed', 500, { cause: error });
}
```

## Response Format

- All API responses MUST follow consistent structure
- Error responses include actionable information
- Success responses include all necessary data

```typescript
// Recommended response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ✅ Success response
return { success: true, data: result };

// ✅ Error response
return { success: false, error: { code: 'NOT_FOUND', message: 'User not found' } };
```

## Input Validation

- All endpoints MUST validate input parameters
- Use schema validation (Zod, Yup, Joi, class-validator, etc.)
- Sanitize user input before processing

```typescript
// ✅ CORRECT: Schema validation
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
});

const validated = schema.parse(body);

// ❌ WRONG: No validation
const { email, name } = body; // trusting raw input
```

## Security

- Never expose sensitive data in responses
- Validate authentication/authorization
- Rate limiting for public endpoints
- Input sanitization to prevent injection

```typescript
// ❌ WRONG: Exposing sensitive data
return { user: dbUser }; // includes passwordHash, internalId, etc.

// ✅ CORRECT: Explicit field selection
return {
  user: {
    id: dbUser.id,
    name: dbUser.name,
    email: dbUser.email,
  }
};
```

## HTTP Status Codes

Use appropriate status codes (these are standard and can be hardcoded):

| Code | When to Use |
|------|-------------|
| 200 | Successful GET/PUT/PATCH |
| 201 | Successful POST (resource created) |
| 204 | Successful DELETE (no content) |
| 400 | Bad request (validation failed) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (authenticated but not allowed) |
| 404 | Resource not found |
| 409 | Conflict (duplicate resource) |
| 422 | Unprocessable entity (semantic error) |
| 500 | Internal server error |

---

## Checklist (After creating/modifying API routes)

- [ ] Input parameters validated with schema
- [ ] Error handling with clear messages
- [ ] Response format is consistent
- [ ] Authentication/authorization checked
- [ ] No sensitive data exposed
- [ ] Proper HTTP status codes used
- [ ] Rate limiting considered (for public endpoints)

## Verification Commands

```bash
# Find routes without validation
rg "export (async )?function (GET|POST|PUT|DELETE|PATCH)" src/ -A 10 -g "*.{ts,js}"

# Check error handling patterns
rg "throw new Error|throw new.*Error" src/ -g "*.{ts,js}"

# Find potential security issues (sensitive field exposure)
rg "(password|token|secret|apiKey|hash)" src/ -g "*.{ts,js}" --ignore-case

# Find routes without auth checks
rg "export (async )?function (POST|PUT|DELETE|PATCH)" src/api/ -B 5 -A 10 | rg -v "auth|session|token"

# Check for raw body usage without validation
rg "req\.body|request\.body" src/ -g "*.{ts,js}" -C 3
```
