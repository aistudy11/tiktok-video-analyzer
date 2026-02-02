---
paths:
  - "**/sitemap*"
  - "**/robots*"
  - "**/robots.ts"
  - "**/sitemap.xml/**"
universal: false
---

# SEO Sitemap/Robots 规范

编辑 sitemap/robots 相关文件时自动激活。

---

## 1. robots.txt 规范

### 必需要求

| 要求 | 规格 |
|------|------|
| **可访问** | 返回 200 |
| **有 sitemap 链接** | `Sitemap: https://...` |
| **允许 CSS/JS** | 不 Disallow 静态资源 |
| **无误伤** | 公开页面未被 Disallow |

### 标准实现

```typescript
// src/app/robots.ts
import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.APP_URL || 'https://example.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',      // API 端点
          '/admin/',    // 管理后台（可选）
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
```

### 关键规则

> **robots.txt Disallow 会阻止 Google 看到 noindex 指令**
>
> 如果页面被 Disallow，爬虫无法访问页面内容，也就无法看到 noindex 指令。
>
> 需要 noindex 的页面：**允许爬取 + 设置 noindex**，不要 Disallow。

---

## 2. Sitemap 规范

### 必需要求

| 要求 | 规格 |
|------|------|
| **XML 结构正确** | 符合 sitemap 协议 |
| **仅可索引 URL** | 无 404/301/noindex 页面 |
| **lastmod 真实** | 非固定时间戳 |
| **Content-Type** | `application/xml; charset=utf-8` |
| **无重定向** | sitemap URL 直接 200 |

### 内容规则

```xml
<!-- 正确 - 仅包含可索引 URL -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/page</loc>
    <lastmod>2025-01-27</lastmod>  <!-- 真实更新时间 -->
  </url>
</urlset>

<!-- 错误 - 不应包含 -->
<url><loc>https://example.com/auth/login</loc></url>  <!-- noindex 页面 -->
<url><loc>https://example.com/old-page</loc></url>    <!-- 301 重定向 -->
<url><loc>https://example.com/deleted</loc></url>     <!-- 404 页面 -->
```

---

## 3. Next.js App Router 特殊约束

### 禁止的路由结构

> **禁止使用 `[id].xml` 动态段+后缀**
>
> App Router 不支持这种命名，会导致路由不命中。

```
# 错误 - 不支持
src/app/sitemap/[id].xml/route.ts

# 正确 - 使用 rewrite
src/app/sitemap/[id]/route.ts  + next.config.js rewrite
```

### 推荐方案（rewrite-only，零 redirect）

```
对外 URL：
  /sitemap.xml        → sitemap index
  /sitemap/{id}.xml   → split sitemaps

对内路由：
  src/app/sitemap.xml/route.ts    → index
  src/app/sitemap/[id]/route.ts   → split

间接机制：
  只用 rewrite 将 /sitemap/:id.xml 转发到 /sitemap/:id
  不要用 redirect
```

### next.config.mjs 配置

```javascript
async rewrites() {
  return [
    {
      source: '/sitemap/:id.xml',
      destination: '/sitemap/:id',
    },
  ];
}
```

---

## 4. 单一真相源

### 禁止双系统并存

- 站点地图生成逻辑只允许一个入口
- 禁止"旧路由 + 新路由"同时存在
- 清理残留目录，不保留空的旧实现

---

## 5. 验证命令

```bash
# 1) robots.txt 是否可访问
curl -s https://domain.com/robots.txt

# 2) sitemap index 是否 200 & XML
curl -I https://domain.com/sitemap.xml
curl -s https://domain.com/sitemap.xml | head -50

# 3) 分片 sitemap 是否 200 & XML
curl -I https://domain.com/sitemap/0.xml
curl -s https://domain.com/sitemap/0.xml | head -50

# 4) 确认无重定向（应为 200，不应出现 301/302）
curl -I -L https://domain.com/sitemap/0.xml
```

---

## Checklist

- [ ] robots.txt 可访问、返回 200
- [ ] robots.txt 有 Sitemap 链接
- [ ] robots.txt 允许 CSS/JS 爬取
- [ ] noindex 页面不要 Disallow（允许爬取才能看到 noindex）
- [ ] sitemap 仅包含可索引 URL
- [ ] sitemap lastmod 是真实更新时间
- [ ] sitemap URL 直接 200，无重定向
- [ ] 使用 rewrite-only 方案，不用 redirect
