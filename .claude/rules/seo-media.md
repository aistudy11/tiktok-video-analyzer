---
paths:
  - "**/*Image*"
  - "**/*image*"
  - "**/img*"
  - "**/gallery*"
  - "**/poster*"
  - "**/asset*"
universal: false
---

# SEO 媒体规范（路径激活）

编辑图片/媒体相关组件时自动激活。

---

## 1. 图片 Alt 规范

### 必需要求

| 要求 | 规格 |
|------|------|
| **描述性** | 描述图片内容 |
| **含关键词** | 包含相关关键词 |
| **避免堆砌** | 自然语言，不堆砌关键词 |
| **非空** | 除非纯装饰图片 |

```tsx
// ✅ 正确
<Image
  src="/posters/cyberpunk-movie-poster.png"
  alt="Cyberpunk movie poster with neon lights and futuristic cityscape"
/>

// ❌ 错误
<Image src="/poster.png" alt="" />  // 空 alt
<Image src="/poster.png" alt="poster poster poster" />  // 堆砌
<Image src="/poster.png" alt="image" />  // 无意义
```

### Alt 生成公式

```
{style}-style {category} {subject} featuring {feature_1} and {feature_2}
```

示例：`Cyberpunk-style movie poster featuring neon lights and bold typography`

---

## 2. 图片命名规范

### 必需要求

| 要求 | 规格 |
|------|------|
| **语言** | 英文 |
| **分隔符** | 连字符 `-` |
| **描述性** | 包含关键词 |

```
# ✅ 正确
ai-poster-design.png
cyberpunk-movie-poster-neon.png
minimalist-logo-template.png

# ❌ 错误
IMG_20250101.png      # 无意义
poster.png            # 不描述内容
ai_poster_design.png  # 下划线
海报设计.png           # 非英文
```

---

## 3. 响应式图片规范

### 使用 srcset/sizes

```tsx
// Next.js Image 组件自动处理
<Image
  src="/poster.png"
  alt="AI poster"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  fill
/>

// 或指定固定尺寸
<Image
  src="/poster.png"
  alt="AI poster"
  width={800}
  height={1200}
/>
```

---

## 4. 懒加载规范

### 首屏外图片必须懒加载

```tsx
// ✅ 正确 - 首屏图片
<Image
  src="/hero.png"
  alt="Hero image"
  priority  // 首屏优先加载
/>

// ✅ 正确 - 非首屏图片（默认懒加载）
<Image
  src="/gallery/item.png"
  alt="Gallery item"
  loading="lazy"  // 可选，Next.js Image 默认懒加载
/>
```

---

## 5. 尺寸声明规范（避免 CLS）

### 必须声明 width/height

```tsx
// ✅ 正确 - 声明尺寸
<Image
  src="/poster.png"
  alt="Poster"
  width={800}
  height={1200}
/>

// ✅ 正确 - 使用 fill + 容器约束
<div className="relative aspect-[2/3] w-full">
  <Image src="/poster.png" alt="Poster" fill />
</div>

// ❌ 错误 - 无尺寸声明，导致 CLS
<img src="/poster.png" alt="Poster" />
```

### aspect-ratio 推荐

| 类型 | 比例 | CSS |
|------|------|-----|
| 海报 | 2:3 | `aspect-[2/3]` |
| 横幅 | 16:9 | `aspect-video` |
| 正方形 | 1:1 | `aspect-square` |
| OG 图 | 1.91:1 | `aspect-[1.91/1]` |

---

## 6. 图片优化清单

| 检查项 | 说明 |
|--------|------|
| 格式 | 优先 WebP/AVIF |
| 压缩 | 质量 75-85% |
| 尺寸 | 不超过实际显示尺寸的 2x |
| CDN | 使用图片 CDN |

---

## Checklist

- [ ] 图片 alt 描述性且含关键词，无堆砌
- [ ] 图片命名英文+连字符
- [ ] 使用 srcset/sizes 或 Next.js Image
- [ ] 首屏外图片懒加载
- [ ] 声明 width/height 或使用 aspect-ratio 避免 CLS
