---
paths:
  - "**/page.tsx"
  - "**/layout.tsx"
  - "**/loading.tsx"
  - "**/*.css"
  - "**/styles/**"
universal: false
---

# SEO 性能规范（Core Web Vitals）

编辑页面/样式相关文件时自动激活。

---

## 1. Core Web Vitals 阈值

| 指标 | 良好 | 需改进 | 差 |
|------|------|--------|-----|
| **LCP** (Largest Contentful Paint) | ≤ 2.5s | 2.5-4s | > 4s |
| **CLS** (Cumulative Layout Shift) | ≤ 0.1 | 0.1-0.25 | > 0.25 |
| **INP** (Interaction to Next Paint) | ≤ 200ms | 200-500ms | > 500ms |

> **INP 于 2024 年取代 FID** 成为 Core Web Vitals 指标。

---

## 2. LCP 优化

### 影响因素

| 因素 | 优化方式 |
|------|----------|
| 服务器响应时间 | 使用 CDN、缓存 |
| 资源加载时间 | 预加载关键资源 |
| 渲染阻塞 | 异步加载非关键 CSS/JS |
| 客户端渲染 | 使用 SSR/SSG |

### 实现要点

```tsx
// 首屏图片优先加载
<Image src="/hero.png" alt="Hero" priority />

// 预加载关键资源
<link rel="preload" href="/fonts/main.woff2" as="font" crossOrigin="" />

// 预连接第三方域名
<link rel="preconnect" href="https://cdn.example.com" />
```

---

## 3. CLS 优化

### 避免布局偏移

| 原因 | 解决方案 |
|------|----------|
| 图片无尺寸 | 声明 width/height 或 aspect-ratio |
| 字体闪烁 | 使用 font-display: swap + 预加载 |
| 动态内容 | 预留空间 |
| 广告/iframe | 固定容器尺寸 |

### 实现要点

```tsx
// 图片声明尺寸
<Image src="/img.png" alt="..." width={800} height={600} />

// 或使用 aspect-ratio
<div className="aspect-video">
  <Image src="/img.png" alt="..." fill />
</div>

// 骨架屏预留空间
<Skeleton className="h-[200px] w-full" />
```

---

## 4. INP 优化

### 响应性要点

| 因素 | 优化方式 |
|------|----------|
| 长任务 | 拆分为小任务，使用 requestIdleCallback |
| 事件处理 | 防抖/节流 |
| 主线程阻塞 | Web Worker 处理计算 |

### 实现要点

```typescript
// 防抖处理
const handleInput = useDebouncedCallback((value) => {
  // 处理逻辑
}, 300);

// 长任务拆分
function processInChunks(items: Item[]) {
  const chunk = items.splice(0, 100);
  processChunk(chunk);
  if (items.length > 0) {
    requestIdleCallback(() => processInChunks(items));
  }
}
```

---

## 5. 资源优化

### 静态资源

| 优化项 | 规格 |
|--------|------|
| **版本化** | 文件名含 hash（Next.js 自动处理） |
| **压缩** | gzip/brotli |
| **预加载** | 关键资源 preload |
| **预连接** | 第三方域名 preconnect |

### 脚本加载

```tsx
// 非关键脚本异步加载
<Script src="/analytics.js" strategy="lazyOnload" />

// 延迟加载
<Script src="/widget.js" strategy="afterInteractive" />

// 关键脚本
<Script src="/critical.js" strategy="beforeInteractive" />
```

### 禁止阻塞首屏

```tsx
// 错误 - 阻塞首屏
<script src="/heavy.js"></script>

// 正确 - 异步
<script src="/heavy.js" async></script>
```

---

## 6. 缓存与预热

### ISR 配置

```typescript
// 合理的 revalidate 值
export const revalidate = 3600; // 1 小时

// 按业务调整
// 高频更新内容：300s (5分钟)
// 稳定内容：3600s (1小时) 或更长
```

### 缓存预热

- 定期 warm-up 关键页面
- 监控 ISR 命中率
- 监控异常 5xx

---

## 7. 验证工具

| 工具 | 用途 |
|------|------|
| **PageSpeed Insights** | Core Web Vitals 检测 |
| **Lighthouse** | 性能审计 |
| **Chrome DevTools** | 性能分析 |
| **Web Vitals 扩展** | 实时监控 |

### 命令行检测

```bash
# 使用 Lighthouse CLI
npx lighthouse https://example.com --view
```

---

## Checklist

- [ ] LCP ≤ 2.5s（首屏图片 priority，预加载关键资源）
- [ ] CLS ≤ 0.1（图片声明尺寸，预留动态内容空间）
- [ ] INP ≤ 200ms（避免长任务，使用防抖/节流）
- [ ] 静态资源版本化、压缩
- [ ] 关键资源 preload，第三方 preconnect
- [ ] 非关键脚本 async/defer
- [ ] ISR revalidate 值合理
