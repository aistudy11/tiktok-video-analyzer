# ShipAny 模板开发规范

Paths: frontend/src/themes/**, frontend/src/config/theme/**, frontend/src/config/style/**

---

## 核心概念

ShipAny Two 有两级主题系统：

| 层级 | 控制方式 | 切换时机 | 对应变量 |
|------|----------|----------|----------|
| **模板 (Template)** | 文件夹选择 | 构建时 / 服务端 | `NEXT_PUBLIC_THEME` |
| **外观 (Appearance)** | CSS class 切换 | 运行时 / 客户端 | `NEXT_PUBLIC_APPEARANCE` + `useTheme()` |

**模板**决定加载哪些组件（布局、页面、区块），适合 UI 结构大改动。
**外观**决定颜色、背景等视觉表现，适合同模板下的配色切换。

---

## 目录结构

```
frontend/src/themes/
├── default/                    # ShipAny 默认模板（只读基座）
│   ├── blocks/                 # 区块组件
│   ├── layouts/                # 布局
│   └── pages/                  # 页面
├── tiktok/                     # TikTok 业务模板（可修改）
│   ├── blocks/                 # 覆盖/新增的区块
│   │   ├── common/             # 模板内通用组件（theme-toggler 等）
│   │   ├── header.tsx          # 覆盖默认 header
│   │   ├── footer.tsx          # 覆盖默认 footer
│   │   ├── background-layer.tsx
│   │   ├── glass-panel.tsx
│   │   ├── stats-card.tsx
│   │   ├── tiktok-analyzer.tsx
│   │   └── tiktok/             # TikTok 子业务组件
│   └── layouts/
│       └── landing.tsx         # 覆盖默认 landing 布局
```

---

## 动态加载机制

`core/theme/index.ts` 提供三个动态加载函数：

```typescript
// 加载顺序：当前模板 → default 回退
getThemeBlock('header')   // → themes/{theme}/blocks/header.tsx
getThemePage('dynamic-page') // → themes/{theme}/pages/dynamic-page.tsx
getThemeLayout('landing')  // → themes/{theme}/layouts/landing.tsx
```

**关键**：新模板只需覆盖要改的组件，其余自动回退到 default。

---

## 创建新模板的步骤

### 1. 创建模板目录

```
frontend/src/themes/{模板名}/
├── blocks/
│   ├── common/          # 放模板专属的通用组件
│   ├── header.tsx       # 若需覆盖 header
│   └── footer.tsx       # 若需覆盖 footer
├── layouts/
│   └── landing.tsx      # 若需覆盖布局
└── pages/               # 若需覆盖页面（通常不需要）
```

### 2. 注册模板

在 `frontend/src/config/theme/index.ts` 添加模板名：

```typescript
export const themeNames = ['default', 'tiktok', '{新模板名}'];
```

### 3. 设置环境变量

在 `.env.development` 或 `.env.production` 中：

```
NEXT_PUBLIC_THEME={模板名}
NEXT_PUBLIC_APPEARANCE={默认外观}
```

### 4. 定义外观 CSS 变量

在 `frontend/src/config/style/theme.css` 中添加外观选择器：

```css
.{外观名} {
  color-scheme: dark; /* 若为深色主题 */
  --background: ...;
  --foreground: ...;
  /* 所有 Tailwind 颜色变量 */
}
```

### 5. 注册外观到 dark variant（若为深色主题）

在 `frontend/src/config/style/global.css` 中更新：

```css
@custom-variant dark (&:is(.dark *, .{外观名} *));
```

---

## 外观切换（同模板内）

外观通过 `next-themes` 的 `useTheme()` 切换，CSS class 加在 `<html>` 元素上。

若模板有自定义外观切换（如 tiktok 的 titanium↔aurora）：
1. 在 `themes/{模板}/blocks/common/theme-toggler.tsx` 创建切换组件
2. 在 `themes/{模板}/blocks/common/animated-theme-toggler.tsx` 创建动画切换
3. 在覆盖的 header/footer 中导入本地 ThemeToggler

---

## 覆盖 header/footer 的标准做法

1. 从 default 主题复制 header.tsx / footer.tsx
2. 仅修改 ThemeToggler 的 import 路径：

```typescript
// 默认模板
import { ThemeToggler } from '@/shared/blocks/common';

// 自定义模板
import { ThemeToggler } from './common/theme-toggler';
```

3. 其余代码保持不变，避免维护负担

---

## Fumadocs 暗色模式兼容

自定义深色外观必须覆盖 Fumadocs CSS 变量，否则文本颜色会异常：

```css
.{外观名} {
  --color-fd-foreground: #ebebeb;
  --color-fd-background: #121212;
  --color-fd-muted-foreground: #a0a0a0;
  --color-fd-muted: #262626;
  --color-fd-card: #1a1a1a;
  --color-fd-border: #2e2e2e;
  --color-fd-popover: #171717;
}
```

---

## 禁止事项

- 不要修改 `themes/default/` 下的任何文件
- 不要修改 `shared/blocks/common/theme-toggler.tsx`（基座代码）
- 不要修改 `shared/components/magicui/animated-theme-toggler.tsx`（基座代码）
- 不要在 `core/theme/` 下修改加载逻辑
- 不要把业务组件放在 `themes/default/blocks/` 下

---

## 当前模板状态

| 模板 | 外观 | 说明 |
|------|------|------|
| default | light, dark, system | ShipAny 原版，不可修改 |
| tiktok | titanium (V7), aurora (V8) | TikTok 业务模板 |
