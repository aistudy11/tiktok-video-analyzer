---
paths:
  - "**/page.tsx"
  - "**/layout.tsx"
  - "**/(default)/**"
  - "**/(console)/**"
universal: false
---

# SEO 页面规范（路径激活）

编辑页面组件时自动激活，确保页面级 SEO 要求在开发时就被遵循。

---

## 1. Title 规范

| 要求 | 规格 |
|------|------|
| **长度** | 50-60 字符 |
| **唯一性** | 每页必须不同 |
| **关键词** | 主关键词靠前 |
| **格式** | `{价值描述} | {品牌名}` |

```typescript
// ✅ 正确
title: t('page.meta.title') // "AI Poster Generator | SiteName"

// ❌ 错误
title: "Welcome" // 太短，无关键词
title: "AI Poster Generator - Create Beautiful Posters - Free Download - Best Quality" // 太长
```

---

## 2. Meta Description 规范

| 要求 | 规格 |
|------|------|
| **长度** | 150-160 字符 |
| **唯一性** | 每页必须不同 |
| **内容** | 主关键词 + CTA |

---

## 3. H1 标签规范

| 要求 | 规格 |
|------|------|
| **数量** | 每页仅 1 个 H1 |
| **内容** | 包含主关键词 |
| **与 Title** | 意思一致但不完全相同 |
| **层级** | H2/H3 结构清晰 |

```tsx
// ✅ 正确
<h1>{t('page.heading')}</h1>  // 唯一 H1
<h2>Features</h2>
<h3>Feature 1</h3>

// ❌ 错误
<h1>Title</h1>
<h1>Another Title</h1>  // 多个 H1
```

---

## 4. Canonical 规范

| 要求 | 规格 |
|------|------|
| **自指** | 1:1 指向自己 |
| **无互指** | 避免 A→B, B→A |
| **参数页** | 按策略指向规范 URL |

```typescript
// ✅ 正确 - 从配置派生
const canonical = `${process.env.APP_URL}/${locale}/${path}`;

// ❌ 错误 - 硬编码
const canonical = "https://example.com/page";
```

---

## 5. Index/Noindex 规范

### 应该 noindex 的页面

| 页面类型 | robots 设置 |
|----------|-------------|
| `/auth/*` 登录注册 | `noindex, follow` |
| `/admin/*` 管理后台 | `noindex, nofollow` |
| `/my-*` 用户私有页 | `noindex, nofollow` |
| `?q=*` 搜索结果 | `noindex, follow` |
| `/404` 错误页 | `noindex` |

### 应该 index 的页面

| 页面类型 | 说明 |
|----------|------|
| **UGC 详情页** | 用户生成内容是核心 SEO 资产，**必须始终索引** |
| 首页 | 站点入口 |
| 产品/分类页 | 核心页面 |
| 博客文章 | 内容页面 |

> **重要**: UGC 详情页即使内容较短，也应设置 index。
> 仅当明确判定为垃圾/违规内容时才设置 noindex。

### 关键规则

> **noindex 生效前提是页面可被抓取**
>
> 不要同时在 robots.txt 里 Disallow，否则爬虫无法看到 noindex 指令。

```typescript
// layout.tsx 中设置
export const metadata: Metadata = {
  robots: {
    index: false,  // noindex
    follow: true,  // 但允许跟随链接
  },
};
```

---

## 6. 内容质量规范

| 要求 | 规格 |
|------|------|
| **主内容** | 非空，匹配搜索意图 |
| **关键词位置** | 主关键词在前 100 字 |
| **E-E-A-T** | 体现经验、专业性、权威性、可信度 |
| **无堆砌** | 自然使用关键词 |

### 分类/聚合页内容规范

> 适用于大类页、小类页、风格页、标签页等聚合类页面

| 内容模块 | 要求 |
|----------|------|
| **短介绍 (Intro)** | 100-200 字，说明该分类的定义和价值 |
| **内容段落 (Sections)** | 3-9 个模块，如 features、use-cases、tips 等 |
| **FAQ** | 3-5 个真实问题，支持 FAQPage Schema |
| **内链** | 段落中嵌入相关分类/内容链接 |

```typescript
// 推荐的 sections 类型
type SectionType =
  | 'intro'           // 简介
  | 'features'        // 特点/优势
  | 'use-cases'       // 使用场景
  | 'design-tips'     // 设计技巧
  | 'comparison'      // 对比其他
  | 'quick-start'     // 快速开始
  | 'best-practices'; // 最佳实践

// FAQ 结构
interface FaqItem {
  question: string;  // 真实用户问题
  answer: string;    // 有价值的回答，含内链
  order: number;
}
```

> **避免"模板空壳"**：分类页不能只有列表，必须有独特的介绍性内容。

---

## 7. 内链策略

| 要求 | 规格 |
|------|------|
| **数量** | 主内容区（`<main>`）5-20 个 |
| **锚文本** | 语义化，**禁用"点击这里"** |
| **目标** | 链向支柱页和相关集群页 |
| **覆盖** | 避免孤立页 |

```tsx
// ✅ 正确
<Link href="/ai-poster-generator">AI Poster Generator</Link>

// ❌ 错误
<Link href="/ai-poster-generator">Click here</Link>
```

### 验证命令

```javascript
// DevTools Console
document.querySelectorAll('main a[href^="/"]').length
```

---

## Checklist

- [ ] Title 50-60 字符，主关键词靠前
- [ ] Meta Description 150-160 字符，含 CTA
- [ ] 每页仅 1 个 H1，H2/H3 层级清晰
- [ ] Canonical 从配置派生，1:1 自指
- [ ] 私有页面设置 noindex（不要同时 Disallow）
- [ ] 主关键词在前 100 字
- [ ] 内链 5-20 个，锚文本语义化
- [ ] 分类/聚合页有短介绍和内容段落（如适用）
- [ ] 分类/聚合页有 FAQ 模块（如适用）
