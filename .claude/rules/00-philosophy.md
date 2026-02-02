---
paths: []
universal: true
framework_deps: []
---

# Core Philosophy (Universal)

This rule applies to ALL operations. No paths restriction.
These principles are **framework-agnostic** and apply to any software project.

## 基座架构原则（最高优先级）

**所有开发必须以原代码架构为基座。**

### 执行前必须验证

1. **目录结构** - 新文件位置是否符合现有目录结构？
2. **组件复用** - 现有组件能否满足需求？禁止创建重复功能组件
3. **路由模式** - 是否遵循现有路由约定？
4. **命名规范** - 是否与现有命名风格一致？

### 验证方法

```bash
# 执行前必须对比现有结构
ls -la [目标目录]
```

### 禁止

- ❌ 不对比原代码直接创建新结构
- ❌ 按计划文档执行而不验证架构一致性
- ❌ 创建与现有组件功能重复的新组件
- ❌ 盲目信任计划文档，必须验证其是否符合原代码架构

---

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
