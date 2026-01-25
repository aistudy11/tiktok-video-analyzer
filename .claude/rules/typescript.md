---
paths:
  - "**/*.ts"
  - "**/*.tsx"
universal: false
framework_deps: []
---

# TypeScript Rules (Path-Activated)

Automatically activated when working with .ts/.tsx files.
This rule is **framework-agnostic** and applies to any TypeScript project.

## Type Safety - Zero `any` Principle

### Required Alternatives

1. **Third-party library missing types** → Declare module types:
```typescript
// types/untyped-lib.d.ts
declare module 'untyped-lib' {
  export function someFunc(param: unknown): unknown;
}
```

2. **Dynamic data sources** → Use `unknown` + type guards:
```typescript
const data: unknown = JSON.parse(jsonString);
if (isValidData(data)) {
  // data now has correct type
}
```

3. **Catch block errors** → Use `unknown`:
```typescript
try {
  // ...
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

4. **Progressive migration** → Use `@ts-expect-error` (NOT any):
```typescript
// TODO: [ISSUE-XXX] Remove by: <target-date>
// @ts-expect-error - Waiting for library v2.0 type definitions
legacyFunction(param);
```

> **Note**: Always use actual issue numbers and realistic target dates (e.g., `ISSUE-456`, `2025-Q3`).

### Only Exemption Scenarios
- Framework/tool explicitly requires (e.g., some decorator metadata)
- Must include: Issue/Ticket number, planned removal date, technical reason

## No Hardcoding Principle (NO HARDCODING) - 精确定义版

### 必须外部化（零容忍）

❌ **业务配置值**：任何可能因环境、客户、时间而改变的值
- API URLs、数据库连接、服务端点
- 速率限制、超时时间、重试次数
- 费用、积分、配额相关数值
- 缓存TTL、会话时长

❌ **用户可见文本**：所有UI文本必须i18n
- 错误消息、提示信息、标签
- 按钮文本、占位符文本

❌ **敏感信息**：
- 密钥、密码、token
- 内部服务地址

### 必须集中管理（使用constants文件）

⚠️ **业务规则常量**：
- 枚举值（状态、类型、等级）
- 业务逻辑阈值（最小/最大值）
- 数据格式定义（日期格式、正则表达式）

```typescript
// constants/business.ts
export const ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed'
} as const;

export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_PASSWORD_LENGTH: 8
} as const;
```

### 允许直接使用（白名单）

✅ **标准协议值**（有RFC或规范定义）：
- HTTP状态码（200, 404, 500）
- HTTP方法（'GET', 'POST'）
- MIME类型（'application/json'）
- 加密算法名（'sha256', 'aes-256-gcm'）

✅ **数学常量**：
- 单位转换（1000毫秒=1秒）
- 数学运算（100%，0初始值）

✅ **语言内置**：
- 数组索引（0, -1）
- 布尔值（true, false）
- 空值（null, undefined, ''）

### 分类决策树

```
这个值是否会变？
├─ 永不变（数学/标准）→ 允许硬编码
├─ 可能变（业务/配置）→ 必须外部化
└─ 不确定 → 必须外部化（安全原则）
```

### 代码审查清单

- [ ] 所有URL已外部化到环境变量
- [ ] 所有用户文本已i18n
- [ ] 所有业务枚举已抽取到constants
- [ ] 所有配置值已外部化
- [ ] HTTP状态码直接使用（白名单）
- [ ] 数学常量直接使用（白名单）

---

## Config Loading Rule (NO RUNTIME FS READ)

> **背景**: 此规则源于真实生产事故。Docker 构建后只包含 `.next/` 构建产物，`src/` 目录不存在。
> 运行时使用 `fs.readFileSync` 读取 `src/config/**` 会导致 `ENOENT` 错误，引发 Cloudflare 524 超时。

### 核心要求

❌ **禁止**在运行时代码中用 `fs.readFileSync` / `fs.readFile` 读取 `src/config/**` 或基于 `process.cwd()` 拼路径的配置文件
✅ **必须**使用静态 import（由构建打包进 `.next`）或改为数据库/环境变量配置
❌ **禁止**同时保留 fs 读取与静态 import 的双入口（零双系统）

### 允许方式

```typescript
// ✅ 方案 1: 静态 import (JSON 文件，构建时内联)
import config from '@/config/seo.json';

// ✅ 方案 2: 使用 public/ 目录 (运行时需要的静态文件)
// 文件放在 public/config/xxx.json
const response = await fetch('/config/xxx.json');

// ✅ 方案 3: 环境变量
const apiKey = process.env.API_KEY;

// ✅ 方案 4: 数据库存储
const config = await db.query.configs.findFirst();
```

### 禁止模式

```typescript
// ❌ 运行时读取 src/ 目录下的文件
import fs from 'fs';
import path from 'path';

const configPath = path.join(process.cwd(), 'src', 'config', 'seo.json');
const raw = fs.readFileSync(configPath, 'utf-8');  // Docker 中会 ENOENT!

// ❌ 假设特定目录结构存在
const configPath = path.resolve('./src/config/xxx.json');
```

### 代码审查清单（配置读取）

- [ ] 无 `fs.readFile*` 读取 `src/config/**`
- [ ] 无 `path.join(process.cwd(), 'src', ...)` 模式
- [ ] 配置读取只有一个入口（无双路径）

---

## Checklist (After modifying any .ts/.tsx file)

- [ ] No `any` types (or has exemption comment with issue number)
- [ ] `catch` blocks use `unknown`
- [ ] Dynamic data has type guards
- [ ] Third-party libs have .d.ts declarations
- [ ] No hardcoded URLs/configs
- [ ] User-visible text uses i18n
- [ ] Business enums in constants/

## Verification Commands

```bash
# Check any usage
rg ": any" src/ --type ts

# Check catch types
rg "catch\s*\(" src/ --type ts -A 1

# Check hardcoded URLs
rg "https?://" src/ --type ts

# Check process.env usage
rg "process\.env\." src/ --type ts

# Check runtime fs config reads (CRITICAL - 524 prevention)
rg "fs\.readFile(Sync)?" src/ --type ts

# Check dangerous path patterns
rg "path\.join\(process\.cwd\(\)" src/ --type ts
```
