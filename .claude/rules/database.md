---
paths:
  - "**/db/**/*"
  - "**/database/**/*"
  - "**/models/**/*"
  - "**/schema*"
  - "**/migrations/**/*"
  - "**/drizzle/**/*"
  - "**/prisma/**/*"
  - "**/typeorm/**/*"
universal: false
framework_deps: []
---

# Database Rules (Path-Activated)

Automatically activated when working with database-related files.
This rule is **ORM-agnostic** and applies to any database layer (Drizzle, Prisma, TypeORM, Knex, raw SQL, etc.).

## Core Principle

**Database is the single source of truth. Code adapts to database, not the reverse.**

## Mandatory Verification (BEFORE any DB-related code)

Use the repo-provided scripts or schema sources. Check what exists in `package.json`:

```bash
# Check for available DB scripts in the project
rg "db:|database:|migrate|schema" package.json

# Verify schema files in repo (adapt paths to your project)
rg "table|schema|model" src/ -g "*.ts" --type ts

# If a DB query tool exists in the repo, use it
# Example: node scripts/db-query.js fields <table_name>
```

> **Important**: MUST re-verify schema at the start of each session (schemas change).

## Single Data Access Path

Choose the canonical data access pattern for your repo and stick to it:

```typescript
// ✅ CORRECT: Use your project's data layer
import { getUserById } from '@/models/user';  // or @/lib/data/user, etc.

// ❌ WRONG: Direct DB query outside data/model layer
import { db } from '@/db';
const user = await db.query.users.findFirst();

// ❌ WRONG: Parallel data access paths
import { getUserById } from '@/models/user';
import { getUserById as getUserLegacy } from '@/services/user';

// ❌ WRONG: Compatibility layers that bypass the canonical layer
import { getUserById } from '@/adapters/user-adapter';
```

### Data Layer Organization Patterns

Choose ONE pattern and enforce it project-wide:

**Pattern A: Models Layer**
```
src/
├── db/              # DB config + connection
└── models/          # Data access + queries
```

**Pattern B: Data Layer**
```
src/
├── db/              # DB config + schema
└── lib/data/        # Data access layer
```

**Pattern C: Repository Pattern**
```
src/
├── database/        # DB config
└── repositories/    # Data access repositories
```

## Precise Type Mapping

TypeScript types MUST exactly match database:

```typescript
// ✅ CORRECT: Based on verified database structure
interface User {
  id: number;
  email: string;
  name: string | null;        // nullable fields use | null
  metadata?: Record<string, unknown>;  // JSON fields verified
  created_at: Date;
}

// ❌ WRONG: Based on assumptions
interface User {
  userId: string;       // Wrong field name (id vs userId)
  email: string;
  name: string;         // Missing null (assumed non-nullable)
  meta: object;         // Wrong field name + type
}
```

### Common Naming Pitfalls

```typescript
// Watch for these common mismatches between code and DB
const COMMON_NAMING_PITFALLS = {
  'display_order': ['sort', 'order', 'sort_order', 'position'],
  'created_at': ['createdAt', 'created', 'createTime', 'timestamp'],
  'user_uuid': ['user_id', 'userId', 'uid', 'owner_id'],
  'is_active': ['active', 'enabled', 'status', 'deleted']
};
```

## JSON/Array Field Handling

```typescript
// Always verify the actual format first using SQL or ORM inspection
// ✅ CORRECT
if (Array.isArray(data.tags)) {
  data.tags.forEach(tag => ...);
}

// ❌ WRONG: Assuming string without verification
const list = data.tags.split(',');  // May fail if tags is already an array
```

## NULL Value Handling

```typescript
// ✅ CORRECT NULL handling
export function mapData(row: DbRow) {
  return {
    name: row.name || 'Unknown',        // String fallback
    count: row.count ?? 0,              // Number fallback (preserves 0)
    metadata: row.metadata || {},       // Object fallback
    displayName: row.name?.trim() || 'N/A'  // Optional chaining + fallback
  };
}
```

---

## Performance Rules

```typescript
// ✅ Use transactions for multi-step writes
await db.transaction(async (tx) => {
  await tx.insert(table1).values(data1);
  await tx.update(table2).set(data2);
});

// ✅ Avoid N+1 query patterns - use eager loading/joins
const results = await db.query.users.findMany({
  with: { profile: true, settings: true }
});

// ❌ N+1 query pattern - avoid this
for (const user of users) {
  const profile = await getProfile(user.id);  // N additional queries!
}
```

---

## Schema Migration Rules

**All schema changes MUST go through your ORM's migration system. Never execute DDL directly in production.**

### Prohibited Actions

```bash
# ❌ NEVER execute DDL directly
sql "CREATE INDEX ..."
sql "ALTER TABLE ..."
sql "DROP TABLE ..."
sql "CREATE TABLE ..."

# ❌ NEVER execute bulk DML without migration tracking
sql "INSERT INTO ..."
sql "UPDATE ... SET ..."
sql "DELETE FROM ..."
```

### Correct Migration Flow

```bash
# 1. Modify schema file (adapt to your ORM)
# Drizzle: src/db/schema.ts
# Prisma: prisma/schema.prisma
# TypeORM: src/entities/*.ts

# 2. Generate migration
pnpm db:generate  # or prisma migrate dev, typeorm migration:generate

# 3. Review generated SQL
cat migrations/00XX_*.sql  # or prisma/migrations/*/migration.sql

# 4. Apply migration
pnpm db:migrate  # or prisma migrate deploy, typeorm migration:run

# 5. Verify result
# Use your DB inspection tool or ORM studio
```

### Emergency Fix Protocol

If you MUST execute SQL directly in production (emergency only):

1. **Immediately after**: Update schema file to match
2. **Immediately after**: Generate migration to sync state
3. **Immediately after**: Apply migration in all environments
4. **Commit**: All changes (schema + migration files)

---

## Connection Pool Configuration

> **Background**: Cloud database providers have strict connection limits.
> Exceeding limits causes pool exhaustion → page timeouts → 504 errors.

### General Guidelines

| Environment | Recommended `max` | Notes |
|-------------|-------------------|-------|
| Development | 2-5 | Low concurrency, fast iteration |
| Production | 5-15 | Depends on provider limits |
| Test | 1-3 | Isolated, deterministic |

> **Important**: Always check your database provider's documentation for actual limits.
> Free tiers typically allow 5-60 connections; paid tiers allow 100+.

### Standard Configuration Template

```typescript
// Adapt to your DB client (postgres.js, pg, mysql2, etc.)

const DB_CONFIG = {
  development: { max: 3, idle_timeout: 30 },
  production: { max: 5, idle_timeout: 20 },  // Adjust based on provider limits
  test: { max: 1, idle_timeout: 10 },
} as const;

const env = process.env.NODE_ENV || 'development';
const config = DB_CONFIG[env as keyof typeof DB_CONFIG];

const pool = createPool(process.env.DATABASE_URL!, {
  max: config.max,
  idleTimeoutMillis: config.idle_timeout * 1000,
  connectionTimeoutMillis: 10000,
});

// Prevent hot-reload from creating multiple pools
const globalForDb = globalThis as unknown as { db: typeof pool };
export const db = globalForDb.db || pool;
if (process.env.NODE_ENV !== 'production') {
  globalForDb.db = db;
}
```

### Connection Pool Diagnostics

```bash
# PostgreSQL: Check current connections
sql "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"

# PostgreSQL: View active connections
sql "SELECT pid, state, query_start FROM pg_stat_activity WHERE datname = current_database() AND state = 'active'"

# MySQL: Check connections
sql "SHOW PROCESSLIST"
```

---

## Checklist (DB Changes)

### Queries & Types
- [ ] Verified schema via repo scripts or inspection tool
- [ ] Types match DB fields exactly (names + types + nullability)
- [ ] All possible NULL values handled
- [ ] JSON/array fields validated before use
- [ ] No parallel data access paths or compatibility adapters
- [ ] Transactions used for multi-step writes
- [ ] No N+1 query patterns
- [ ] Missing fields handled in data layer

### Schema Changes (if any)
- [ ] Changes go through ORM migration system
- [ ] Migration generated and reviewed
- [ ] No direct DDL/DML execution

### Connection Pool (if modified)
- [ ] `max` value respects provider limits
- [ ] Idle timeout configured
- [ ] Global cache prevents hot-reload multi-instance

## Verification Commands

```bash
# Find direct db usage outside canonical layer (adapt paths)
rg "from ['\"]@/(db|database)['\"]" src/ -g "*.{ts,tsx}"

# Find parallel data paths
rg "@/models|@/lib/data|@/repositories" src/ -g "*.{ts,tsx}"

# Check for N+1 patterns (queries in loops)
rg "for.*await.*find|forEach.*await.*get" src/ -g "*.{ts,tsx}"

# Check schema file locations
rg "schema|model|entity" src/ -g "*.ts" --files-with-matches
```
