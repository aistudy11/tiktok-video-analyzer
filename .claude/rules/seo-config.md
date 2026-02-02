---
paths:
  - "**/seo/config*"
  - "**/seo.json"
  - "**/seo-config*"
universal: false
---

# SEO 配置管理规范

编辑 SEO 配置相关文件时自动激活。

---

## 1. 配置单一真相源

| 配置类型 | 存放位置 | 说明 |
|----------|---------|------|
| **阈值配置** | `src/lib/seo/seo.json` | minAssetsForIndex、thresholds 等 |
| **配置加载** | `src/lib/seo/config.ts` | 统一加载入口，带验证 |
| **产品覆盖** | `product.seo.config` | 产品级配置覆盖 |

### 禁止配置分散

```typescript
// ❌ 错误 - 配置分散在多处
const threshold1 = process.env.SEO_THRESHOLD;  // 环境变量
const threshold2 = siteConfig.seo.threshold;    // 站点配置
const threshold3 = 5;  // 硬编码

// ✅ 正确 - 统一从 loadSeoConfig() 获取
import { loadSeoConfig } from '@/lib/seo/config';
const config = loadSeoConfig();
const threshold = config.hubPages.minAssetsForIndex;
```

---

## 2. 静态 Import 规则

> **禁止在 SEO 模块中使用运行时 fs 读取配置**
>
> Docker standalone 模式下，`process.cwd()` 指向运行时目录，
> `src/` 目录不存在，会导致 524 超时错误。

```typescript
// ✅ 正确 - 静态 import（构建时打包进 .next/server）
import seoConfigRaw from '@/lib/seo/seo.json';

// ❌ 错误 - 运行时 fs 读取
import fs from 'fs';
const config = JSON.parse(fs.readFileSync('src/lib/seo/seo.json'));

// ❌ 错误 - 运行时 path 解析
const configPath = path.join(process.cwd(), 'src/lib/seo/seo.json');
```

---

## 3. 配置验证

配置加载时必须验证：

```typescript
// 必须有默认值 + 范围验证
function validateNumber(value: unknown, fieldName: string, defaultValue: number, options: { min?: number; max?: number }) {
  if (typeof value !== 'number' || isNaN(value)) {
    return { value: defaultValue, warning: `${fieldName} invalid` };
  }
  // ... 范围检查
}
```

---

## 4. 缓存策略

| 策略 | 说明 |
|------|------|
| 启动时加载 | 应用启动时加载并缓存 |
| 开发调试 | 提供 `reloadSeoConfig()` |
| 生产变更 | 配置变更需重新部署 |

---

## Checklist

- [ ] SEO 配置统一从 `loadSeoConfig()` 获取
- [ ] 使用静态 import 加载 JSON 配置
- [ ] 配置有默认值和范围验证
- [ ] 不使用运行时 fs 读取配置文件
