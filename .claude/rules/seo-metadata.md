---
paths:
  - "**/metadata*"
  - "**/generateMetadata*"
  - "**/head.tsx"
  - "**/opengraph*"
  - "**/twitter*"
universal: false
---

# SEO 元数据规范（路径激活）

编辑元数据相关文件时自动激活。

---

## 1. OG/Twitter 规范

### 必需字段

| 字段 | 要求 |
|------|------|
| `og:title` | 与页面 Title 一致 |
| `og:description` | 与页面 Description 一致 |
| `og:url` | 与 Canonical 一致 |
| `og:image` | 存在、可访问、**1200×630px** |
| `twitter:card` | `summary_large_image` |

### 图片规格

| 属性 | 规格 |
|------|------|
| **尺寸** | 1200×630px（推荐） |
| **最小** | 600×315px |
| **格式** | PNG/JPG |
| **大小** | < 5MB |

```typescript
export const metadata: Metadata = {
  openGraph: {
    title: t('page.meta.title'),
    description: t('page.meta.description'),
    url: canonical,
    images: [{
      url: `${baseUrl}/og/${page}.png`,
      width: 1200,
      height: 630,
      alt: t('page.meta.title'),
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: t('page.meta.title'),
    description: t('page.meta.description'),
    images: [`${baseUrl}/og/${page}.png`],
  },
};
```

---

## 2. 元数据来源规范

### 必须从 i18n 或 config 读取

```typescript
// ✅ 正确 - 从 i18n 读取
const t = await getTranslations({ locale, namespace: 'page' });
return {
  title: t('meta.title'),
  description: t('meta.description'),
};

// ✅ 正确 - 从 config 读取
const baseUrl = process.env.APP_URL;
const brandName = siteConfig.name;

// ❌ 错误 - 硬编码
return {
  title: "My Website - Best AI Tool",  // 硬编码
  description: "Welcome to my website", // 硬编码
};
```

### 禁止硬编码

| 禁止 | 原因 |
|------|------|
| 品牌名字符串 | 应从 config 读取 |
| 域名 URL | 应从 `APP_URL` 环境变量读取 |
| 固定文案 | 应从 i18n 读取 |

---

## 3. generateMetadata 模式

```typescript
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'page' });
  const baseUrl = process.env.APP_URL || 'https://example.com';

  const canonical = locale !== 'en'
    ? `${baseUrl}/${locale}/path`
    : `${baseUrl}/path`;

  return {
    title: t('meta.title'),
    description: t('meta.description'),
    alternates: {
      canonical,
    },
    openGraph: {
      title: t('meta.title'),
      description: t('meta.description'),
      url: canonical,
      images: [{
        url: `${baseUrl}/og/page.png`,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: 'summary_large_image',
    },
  };
}
```

---

## 4. UGC 详情页补充规范

| 要求 | 规格 |
|------|------|
| **Title/H1/Meta** | 必须包含 prompt 唯一关键词 |
| **唯一性** | Title 末尾追加 `#<slugSuffix>` |
| **索引策略** | UGC 内容页应始终 index（见 seo-page.md） |

---

## 5. 数据源唯一性原则

> **每类 SEO 数据应有且仅有一个权威数据源**

| 数据类型 | 权威数据源 | 禁止来源 |
|----------|-----------|---------|
| 页面 Title/Description | i18n JSON | 数据库重复定义、硬编码 |
| 分类 metadata | 分类表字段 | i18n 重复定义 |
| 产品 metadata | `product.json` | 环境变量重复定义 |

### 避免数据源冲突

```typescript
// ❌ 错误 - 多数据源 fallback 链（难以追踪来源）
const description =
  i18n('description') ||
  category.description ||
  defaultDescription;

// ✅ 正确 - 单一数据源
const description = category.description;  // 分类描述只从分类表读取
```

### 数据源变更原则

- 变更数据源前，必须迁移所有现有数据
- 禁止"新旧并存"的过渡期超过一个迭代

---

## Checklist

- [ ] og:title/description/url 与页面一致
- [ ] og:image 存在、可访问、1200×630px
- [ ] twitter:card 设置为 summary_large_image
- [ ] 元数据从 i18n/config 读取，无硬编码
- [ ] UGC 页面 Title 包含唯一标识
