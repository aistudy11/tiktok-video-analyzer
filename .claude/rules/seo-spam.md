---
paths:
  - "**/page.tsx"
  - "**/layout.tsx"
  - "**/*generator*"
  - "**/*template*"
universal: false
---

# SEO 反作弊规范（Google Spam Policies / pSEO）

编辑页面或内容生成相关文件时自动激活。

---

## 1. Google Spam Policies 红线

### 严禁行为

| 违规类型 | 描述 | 惩罚 |
|----------|------|------|
| **规模化内容滥用** | 批量生成低价值页面操纵排名 | 手动处置/降权 |
| **Doorway 门页** | 仅用于引流再跳转的中间页 | 手动处置 |
| **Cloaking 隐藏** | 对用户和爬虫输出不同内容 | 手动处置 |
| **关键词堆砌** | 堆关键词、城市列表、无意义重复 | 降权 |
| **虚假结构化数据** | 虚构评分/评论/销量 | 丧失富结果资格 |

---

## 2. pSEO 三步走原则

> **pSEO = 规模自动化 + 信息增量导向的内容**

### Step 1: 关键词簇规划（Cluster-First）

```
主词簇 → 二级关键词 → 长尾组合
例：packaging design → wine label design → minimalist wine label design
```

### Step 2: 模块化内容（有价值 & 可自动化）

| 模块类型 | 自动化来源 |
|----------|-----------|
| 案例模块 | UGC 用户生成内容 |
| 教程模块 | RPA 截图 + 文案 |
| Prompt 模块 | 热门 prompt 集合 |
| FAQ 模块 | 真实常见问题 |

### Step 3: 工程化闭环

- CMS 设计（Strapi/Payload 无头 CMS）
- 自动提交索引（Sitemap + GSC API）
- 数据观察（收录监控、排名追踪）

---

## 3. pSEO 反模式检查

### 三种失败模式

| 反模式 | 具体表现 | 后果 |
|--------|----------|------|
| **AI 内容农场** | 抓取内容 → AI 改写 → 洗稿拼贴 | Google 直接 kill |
| **关键词聚合** | Chatbot 对话拼成一页 | 收录后被 kill |
| **模板空壳** | 只换数字/地名的模板页面 | 无价值，被降权 |

### 自检清单

```
- [ ] 是否存在"AI 内容农场"模式？（洗稿、拼贴、无原创价值）
- [ ] 是否存在"关键词聚合"模式？（Chatbot 对话拼接）
- [ ] 是否存在"模板空壳"模式？（只换数字/地名）
```

---

## 4. 内容质量标准

### 核心原则

| 原则 | 说明 |
|------|------|
| **信息增量 > 字数** | 内容要有价值，不是堆字数 |
| **Money Pages 人审** | 高转化率页面必须人工审核 |
| **先验证再规模化** | 先 10 页测试，效果好再 1000 页 |

### E-E-A-T 要求

| 要素 | 说明 |
|------|------|
| **Experience（经验）** | 展示真实使用经验 |
| **Expertise（专业性）** | 展示专业知识 |
| **Authoritativeness（权威性）** | 有可信来源引用 |
| **Trustworthiness（可信度）** | 内容准确、来源透明 |

---

## 5. 合规 pSEO 实践

### 正确做法

```typescript
// ✅ 正确 - 每页有独特信息增量
function generatePage(data: ProductData) {
  return {
    title: generateUniqueTitle(data),
    content: {
      uniqueDescription: generateFromRealData(data),  // 真实数据
      userReviews: data.reviews,                       // UGC 内容
      specifications: data.specs,                      // 独特规格
      faq: generateRelevantFAQ(data),                 // 相关问答
    },
  };
}

// ❌ 错误 - 模板空壳
function generatePage(keyword: string) {
  return {
    title: `Best ${keyword} in 2025`,  // 只换关键词
    content: GENERIC_TEMPLATE.replace('{keyword}', keyword),  // 模板替换
  };
}
```

### Google 对 AI 内容的态度

> "Google 不因 AI 生成而惩罚，关键看内容是否有价值。"
>
> 问题不在于"是不是 AI 写的"，而在于"内容到底有没有价值"。

---

## 6. 验证策略

### 上线前验证

1. **小批量测试**：先上 10 页，观察 2-4 周
2. **监控收录**：GSC 收录率 > 80%
3. **监控排名**：无大规模降权
4. **效果好再规模化**：测试通过后再批量生成

### 持续监控

- 收录率下降 → 检查内容质量
- 排名波动 → 检查是否触发 Spam 算法
- 流量下降 → 分析原因，及时调整

---

## Checklist

- [ ] 无规模化内容滥用（批量低价值页面）
- [ ] 无 Doorway 门页（仅引流的中间页）
- [ ] 无 Cloaking（用户和爬虫看到相同内容）
- [ ] 无关键词堆砌（自然使用关键词）
- [ ] 无虚假结构化数据（评分/评论真实）
- [ ] 每页有独特信息增量（非模板空壳）
- [ ] Money Pages 人工审核
- [ ] 先验证再规模化（先 10 页，再 1000 页）
