---
paths:
  - "**/schema*"
  - "**/json-ld*"
  - "**/structured*"
  - "**/JsonLd*"
universal: false
---

# SEO 结构化数据规范（Schema.org）

编辑 Schema/JSON-LD 相关文件时自动激活。

---

## 1. 必需 Schema 类型

### 全站必需

| Schema 类型 | 位置 | 必需字段 |
|-------------|------|----------|
| **WebSite** | 首页 | name, url, potentialAction (SearchAction) |
| **Organization** | 全站 | name, url, logo, sameAs |
| **BreadcrumbList** | 有层级的页面 | itemListElement |

### WebSite 示例

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Site Name",
  "url": "https://example.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://example.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### Organization 示例

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Organization Name",
  "url": "https://example.com",
  "logo": "https://example.com/logo.png",
  "sameAs": [
    "https://twitter.com/example",
    "https://github.com/example"
  ]
}
```

---

## 2. 页面类型 Schema

### 类型映射表

| 页面类型 | Schema 类型 | Google 富结果 |
|----------|-------------|---------------|
| 首页 | WebSite + Organization | 站点链接 |
| **UGC/产品详情** | **Product** | 产品信息 |
| 文章/博客 | Article/BlogPosting | 文章预览 |
| FAQ 页面 | FAQPage | FAQ 折叠 |
| 工具/产品介绍 | SoftwareApplication | 软件信息 |
| 分类/列表 | CollectionPage | 无 |

### 重要：Product vs VisualArtwork

> **海报/UGC 详情页必须使用 Product Schema，不使用 VisualArtwork**
>
> 原因：Google 支持 Product 富结果展示，不支持 VisualArtwork。

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "海报标题",
  "description": "海报描述",
  "image": "https://example.com/poster.png",
  "brand": {
    "@type": "Brand",
    "name": "站点名称"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock"
  }
}
```

### FAQPage 规范

> **仅当页面有真实 FAQ 内容时使用**
>
> Google 已限制 FAQ 富结果展示范围，但标记本身不构成惩罚。

---

## 3. 验证规则

### 必须遵守

| 规则 | 说明 |
|------|------|
| **URL 可访问** | creator.url、image 必须存在且可访问 |
| **无虚假数据** | **严禁虚构评分/评论/销量** |
| **字段完整** | 无空值、无示例值 |
| **通过验证** | 必须通过 Rich Results Test |

### 禁止行为

```json
// 错误 - 虚假评分
{
  "aggregateRating": {
    "ratingValue": "4.9",  // 虚构的评分
    "reviewCount": "1000"  // 虚构的评论数
  }
}

// 错误 - 空值/示例值
{
  "name": "",  // 空值
  "description": "Lorem ipsum..."  // 示例值
}
```

---

## 4. 实现模式

### TypeScript 类型安全

```typescript
import { Product, WithContext } from 'schema-dts';

function generateProductSchema(poster: Poster): WithContext<Product> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: poster.title,
    description: poster.description,
    image: poster.imageUrl,
    brand: {
      '@type': 'Brand',
      name: siteConfig.name,
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };
}
```

### 在页面中使用 JsonLd 组件

```tsx
import { JsonLd } from '@/components/seo/JsonLd';

export default function Page() {
  return (
    <>
      <JsonLd schema={generateProductSchema(poster)} />
      {/* 页面内容 */}
    </>
  );
}
```

---

## 5. 验证工具

| 工具 | 用途 | 链接 |
|------|------|------|
| **Rich Results Test** | 富结果资格验证 | https://search.google.com/test/rich-results |
| **Schema Validator** | 语法验证 | https://validator.schema.org/ |

---

## Checklist

- [ ] 首页有 WebSite Schema（含 SearchAction）
- [ ] 全站有 Organization Schema（含 sameAs）
- [ ] 有层级页面有 BreadcrumbList
- [ ] UGC/产品页使用 Product（非 VisualArtwork）
- [ ] 无虚假评分/评论/销量
- [ ] 所有 URL（image、creator.url）可访问
- [ ] 通过 Rich Results Test 验证
