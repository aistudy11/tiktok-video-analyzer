---
paths:
  - "**/[locale]/**"
  - "**/i18n/**"
  - "**/locales/**"
  - "**/hreflang*"
  - "**/alternates*"
universal: false
---

# SEO 国际化规范（hreflang/GEO）

编辑多语言相关文件时自动激活。

---

## 1. hreflang 标签规范

### 必需要求

| 要求 | 规格 |
|------|------|
| **成对标签** | 每个 locale 都输出 |
| **x-default** | 必须存在，指向默认语言 |
| **URL 可访问** | 指向的页面必须可索引 |
| **双向自洽** | A 指向 B，B 也必须指向 A |
| **一致性** | 页面内与 sitemap 一致 |

### 实现示例

```typescript
// generateMetadata 中
export async function generateMetadata({ params: { locale } }): Promise<Metadata> {
  const baseUrl = process.env.APP_URL;
  const path = '/page';

  return {
    alternates: {
      canonical: locale === 'en' ? `${baseUrl}${path}` : `${baseUrl}/${locale}${path}`,
      languages: {
        'en': `${baseUrl}${path}`,
        'zh': `${baseUrl}/zh${path}`,
        'ja': `${baseUrl}/ja${path}`,
        'x-default': `${baseUrl}${path}`,  // 必须有 x-default
      },
    },
  };
}
```

### 输出的 HTML

```html
<link rel="alternate" hreflang="en" href="https://example.com/page" />
<link rel="alternate" hreflang="zh" href="https://example.com/zh/page" />
<link rel="alternate" hreflang="ja" href="https://example.com/ja/page" />
<link rel="alternate" hreflang="x-default" href="https://example.com/page" />
```

---

## 2. Locale URL 规范

### 默认语言无前缀

```
# localePrefix: "as-needed" 模式
英文（默认）: https://example.com/page
中文:        https://example.com/zh/page
日文:        https://example.com/ja/page
```

### Canonical 与 hreflang 一致

```typescript
// ✅ 正确 - Canonical 和 hreflang 遵循相同规则
const canonical = locale !== defaultLocale
  ? `${baseUrl}/${locale}${path}`
  : `${baseUrl}${path}`;

// ❌ 错误 - Canonical 和 hreflang 不一致
```

---

## 3. 语言/地区一致性

| 要求 | 规格 |
|------|------|
| **页面语言** | 与 hreflang 声明匹配 |
| **货币** | 与目标地区匹配 |
| **地址/电话** | 与目标地区匹配 |
| **无强制跳转** | 不基于 IP 强制跳转语言 |

```typescript
// ❌ 错误 - 基于 IP 强制跳转
if (userIP.country === 'CN') {
  redirect('/zh/page');  // 不要这样做
}

// ✅ 正确 - 提示用户但不强制
// 显示语言切换提示，让用户自己选择
```

---

## 4. GEO 双优化（AI 生成引擎优化）

### 内容结构优化

| 要求 | 规格 |
|------|------|
| **清晰分块** | H1/H2/H3 层级清晰 |
| **摘要友好** | 关键信息前置 |
| **前 50 字黄金段落** | 直接回答核心问题 |

### AI 友好格式

```markdown
# [主题] - 直接回答用户问题

[前 50 字直接回答核心问题，包含主关键词]

## 关键要点

- 要点 1：[简洁描述]
- 要点 2：[简洁描述]
- 要点 3：[简洁描述]

## 详细说明

### 子主题 1
[内容]

### 子主题 2
[内容]
```

### GEO 优化要点

| 优化项 | 说明 |
|--------|------|
| **项目符号** | 便于 AI 提取要点 |
| **表格** | 结构化对比信息 |
| **FAQ 格式** | Q&A 便于 AI 引用 |
| **引用标注** | 便于 AI 验证来源 |
| **Schema 标记** | 结构化数据增强可读性 |

---

## 5. 多语言 Sitemap

### 带 hreflang 的 sitemap

```xml
<url>
  <loc>https://example.com/page</loc>
  <xhtml:link rel="alternate" hreflang="en" href="https://example.com/page"/>
  <xhtml:link rel="alternate" hreflang="zh" href="https://example.com/zh/page"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://example.com/page"/>
</url>
```

---

## Checklist

- [ ] 每个页面输出所有 locale 的 hreflang
- [ ] 存在 x-default 指向默认语言
- [ ] hreflang 双向自洽（A↔B）
- [ ] 页面内 hreflang 与 sitemap 一致
- [ ] 不基于 IP 强制跳转语言
- [ ] 前 50 字黄金段落直接回答问题
- [ ] 使用项目符号、表格等 AI 友好格式
