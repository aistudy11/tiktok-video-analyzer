# UI Theme Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Integrate V7 (Titanium) and V8 (Aurora) design themes into the Next.js frontend, creating reusable components for the video analyzer interface.

**Architecture:** Create a dual-theme system using CSS variables and `next-themes`. Build adaptive components that respond to theme context. Background layer switches between static image (V7) and animated blobs (V8).

**Tech Stack:** Next.js 14, Tailwind CSS v4, next-themes (already installed), Google Fonts (Outfit, Inter, Plus Jakarta Sans)

---

## 🚨 核心架构约束

### 基于 ShipAny2 底座开发

本计划的所有开发任务必须遵循以下原则：

1. **保持现有架构不变** - 认证系统(better-auth)、数据库(Drizzle ORM)、国际化(next-intl)、主题引擎(next-themes) 保持原有实现
2. **复用现有组件** - 优先使用 `shared/components/ui/` 中的 Button、Input、Textarea 等基础组件
3. **遵循现有路由结构** - 使用 `[locale]/(landing)/` 路由模式
4. **遵循 `.claude/rules/`** - 所有开发必须符合项目规则，禁止创建重复功能的组件

### 禁止事项

- ❌ 创建重复功能的组件（如不要新建 Button，使用现有的）
- ❌ 绕过现有认证系统
- ❌ 修改数据库核心结构
- ❌ 在 `tailwind.config.ts` 中硬编码颜色（使用 CSS 变量）
- ❌ 创建与现有组件功能重复的新组件

### 必须复用的组件

| 组件 | 路径 | 用途 |
|------|------|------|
| Button | `shared/components/ui/button` | 所有按钮 |
| Input | `shared/components/ui/input` | 输入框 |
| Textarea | `shared/components/ui/textarea` | 多行文本 |
| ThemeProvider | `core/theme/provider.tsx` | 主题切换（已安装 next-themes） |

---

## Task 1: Configure Google Fonts

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/config/style/theme.css`

**Step 1: Update root layout with Google Fonts**

Open `frontend/src/app/layout.tsx` and add font imports:

```tsx
import { Outfit, Inter, Plus_Jakarta_Sans } from 'next/font/google';

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});
```

Then apply to `<html>` tag:
```tsx
<html className={`${outfit.variable} ${inter.variable} ${plusJakartaSans.variable}`}>
```

**Step 2: Verify fonts load**

Run: `cd frontend && pnpm dev`
Open browser DevTools → Network → Filter "font"
Expected: See Outfit, Inter, Plus_Jakarta_Sans loading

**Step 3: Commit**

```bash
git add frontend/src/app/layout.tsx
git commit -m "feat: configure Google Fonts (Outfit, Inter, Plus Jakarta Sans)"
```

---

## Task 2: Define Theme CSS Variables

**Files:**
- Modify: `frontend/src/config/style/theme.css`

**Step 1: Add V7 Titanium theme variables**

Add after `.dark {` block (around line 117):

```css
/* V7 Titanium Theme */
.theme-titanium {
  --bg-surface: #050505;
  --bg-surface-rgb: 5, 5, 5;
  --glass-panel: rgba(20, 20, 25, 0.5);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.25);
  --accent-primary: #ffffff;
  --accent-secondary: #06b6d4;
  --text-primary: #F8FAFC;
  --text-secondary: #a1a1aa;
  --text-muted: #71717a;
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
  --node-shape: 12px; /* rounded-xl for square nodes */
  --blur-strength: 24px;
}

/* V8 Aurora Theme */
.theme-aurora {
  --bg-surface: #000000;
  --bg-surface-rgb: 0, 0, 0;
  --glass-panel: rgba(255, 255, 255, 0.02);
  --glass-border: rgba(255, 255, 255, 0.08);
  --glass-border-hover: rgba(255, 255, 255, 0.15);
  --accent-primary: #0ea5e9;
  --accent-secondary: #06b6d4;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --text-muted: rgba(255, 255, 255, 0.4);
  --font-display: 'Outfit', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --node-shape: 9999px; /* rounded-full for circular nodes */
  --blur-strength: 24px;
}

/* Scene type colors (shared) */
:root {
  --scene-hook: #ffffff;
  --scene-pain: #71717a;
  --scene-solution: #06b6d4;
  --scene-benefit: #3b82f6;
  --scene-cta: #8b5cf6;
}
```

**Step 2: Add keyframe animations**

Add to `frontend/src/config/style/global.css` inside `@theme inline`:

```css
  --animate-float: float 8s ease-in-out infinite;
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }

  --animate-blob-bounce: blob-bounce 12s infinite cubic-bezier(0.4, 0, 0.2, 1);
  @keyframes blob-bounce {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
```

**Step 3: Verify CSS loads**

Run: `cd frontend && pnpm dev`
Open browser DevTools → Elements → Check `:root` has new variables
Expected: See `--scene-hook`, `--animate-float` etc.

**Step 4: Commit**

```bash
git add frontend/src/config/style/theme.css frontend/src/config/style/global.css
git commit -m "feat: add V7 Titanium and V8 Aurora theme CSS variables"
```

---

## Task 3: Create BackgroundLayer Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/background-layer.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function BackgroundLayer() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  // V7 Titanium: Static background image
  if (theme === 'titanium') {
    return (
      <>
        <div
          className="fixed inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2600&auto=format&fit=crop')`,
            filter: 'grayscale(90%) brightness(0.25) contrast(1.1)',
            transform: 'scale(1.05)',
          }}
        />
        <div
          className="fixed inset-0 -z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.5) 50%, rgba(0, 0, 0, 0.95) 100%)',
          }}
        />
      </>
    );
  }

  // V8 Aurora: Animated blob background
  return (
    <>
      <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
        {/* Silver Blob */}
        <div
          className="absolute rounded-full animate-[blob-bounce_12s_infinite_cubic-bezier(0.4,0,0.2,1)]"
          style={{
            top: '-10%',
            left: '-10%',
            width: '50vw',
            height: '50vw',
            background: '#e2e8f0',
            filter: 'blur(80px)',
            opacity: 0.2,
          }}
        />
        {/* Cyan Blob */}
        <div
          className="absolute rounded-full animate-[blob-bounce_12s_infinite_cubic-bezier(0.4,0,0.2,1)]"
          style={{
            top: '-10%',
            right: '-10%',
            width: '60vw',
            height: '60vw',
            background: '#06b6d4',
            filter: 'blur(80px)',
            opacity: 0.3,
            animationDelay: '-2s',
          }}
        />
        {/* Sky Blue Blob */}
        <div
          className="absolute rounded-full animate-[blob-bounce_12s_infinite_cubic-bezier(0.4,0,0.2,1)]"
          style={{
            bottom: '-20%',
            left: '20%',
            width: '70vw',
            height: '70vw',
            background: '#0ea5e9',
            filter: 'blur(80px)',
            opacity: 0.3,
            animationDelay: '-4s',
          }}
        />
      </div>
      {/* Noise overlay */}
      <div
        className="fixed inset-0 -z-10 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </>
  );
}
```

**Step 2: Verify component renders**

Add temporarily to a page to test:
```tsx
import { BackgroundLayer } from '@/themes/default/blocks/video-gen/background-layer';
// In component: <BackgroundLayer />
```

Run: `cd frontend && pnpm dev`
Expected: See background render (default aurora theme)

**Step 3: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/background-layer.tsx
git commit -m "feat: create BackgroundLayer component with V7/V8 theme support"
```

---

## Task 4: Create GlassPanel Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/glass-panel.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { ReactNode } from 'react';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'hover' | 'card';
}

export function GlassPanel({ children, className, variant = 'default' }: GlassPanelProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        'bg-[var(--glass-panel)] backdrop-blur-[var(--blur-strength)]',
        'border border-[var(--glass-border)]',
        'shadow-[0_8px_32px_rgba(0,0,0,0.5)]',
        variant === 'hover' && 'hover:bg-[rgba(255,255,255,0.08)] hover:border-[var(--glass-border-hover)]',
        variant === 'card' && 'hover:translate-x-1',
        className
      )}
    >
      {children}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/glass-panel.tsx
git commit -m "feat: create GlassPanel component with theme-aware styling"
```

---

## Task 5: Create Navigation Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/navigation.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { Zap } from 'lucide-react';
import Link from 'next/link';

interface NavigationProps {
  brandName?: string;
  className?: string;
}

export function Navigation({ brandName = 'VideoGen', className }: NavigationProps) {
  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50',
        'border-b border-white/5',
        'bg-black/50 backdrop-blur-xl',
        className
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 border border-white/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-[var(--font-display)] font-bold text-lg tracking-tight text-white">
            {brandName}
          </span>
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="#" className="hover:text-white transition-colors">
              Analyzer
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Templates
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="pl-6 border-l border-white/10 flex items-center gap-4">
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Log In
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/navigation.tsx
git commit -m "feat: create Navigation component for video generator"
```

---

## Task 6: Create StatsCard Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/stats-card.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './glass-panel';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  accentColor?: string;
  className?: string;
}

export function StatsCard({ label, value, accentColor = 'white', className }: StatsCardProps) {
  return (
    <GlassPanel
      className={cn(
        'p-4 flex flex-col items-center justify-center',
        'border-l-2',
        className
      )}
      style={{ borderLeftColor: accentColor }}
    >
      <span className="text-[11px] text-zinc-400 font-[var(--font-display)] font-bold uppercase tracking-widest mb-1">
        {label}
      </span>
      <span className="text-xl font-bold text-white">
        {typeof value === 'number' ? formatNumber(value) : value}
      </span>
    </GlassPanel>
  );
}

interface StatsGridProps {
  stats: Array<{
    label: string;
    value: string | number;
    color?: string;
  }>;
  className?: string;
}

export function StatsGrid({ stats, className }: StatsGridProps) {
  const defaultColors = ['#ffffff', '#22d3ee', '#3b82f6', '#71717a'];

  return (
    <div className={cn('grid grid-cols-2 gap-3', className)}>
      {stats.map((stat, index) => (
        <StatsCard
          key={stat.label}
          label={stat.label}
          value={stat.value}
          accentColor={stat.color || defaultColors[index % defaultColors.length]}
        />
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/stats-card.tsx
git commit -m "feat: create StatsCard and StatsGrid components"
```

---

## Task 7: Create VideoPreview Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/video-preview.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './glass-panel';
import { Play } from 'lucide-react';

interface VideoPreviewProps {
  thumbnailUrl?: string;
  duration?: string;
  isLive?: boolean;
  className?: string;
}

export function VideoPreview({
  thumbnailUrl = 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop',
  duration,
  isLive = false,
  className,
}: VideoPreviewProps) {
  return (
    <GlassPanel className={cn('overflow-hidden relative p-2', className)}>
      <div className="relative aspect-[9/16] bg-black/60 rounded-[14px] overflow-hidden group">
        <img
          src={thumbnailUrl}
          alt="Video thumbnail"
          className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 transition-all duration-700"
        />

        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-white/5 backdrop-blur-sm flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/20 transition-all hover:scale-105">
            <Play className="w-6 h-6 text-white translate-x-0.5" fill="currentColor" />
          </div>
        </div>

        {/* Bottom info bar */}
        {(isLive || duration) && (
          <div className="absolute inset-x-4 bottom-4">
            <GlassPanel className="p-3 backdrop-blur-md">
              <div className="flex justify-between items-center text-xs font-mono">
                {isLive && <span className="text-cyan-400">● LIVE</span>}
                {duration && <span className="text-white/60">{duration}</span>}
              </div>
            </GlassPanel>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/video-preview.tsx
git commit -m "feat: create VideoPreview component with glass styling"
```

---

## Task 8: Create ScriptTimeline Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/script-timeline.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './glass-panel';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export interface SceneData {
  id: string;
  number: number;
  type: 'hook' | 'pain' | 'solution' | 'benefit' | 'cta';
  duration: string;
  script: string;
  visual?: string;
  notes?: string;
}

interface ScriptTimelineProps {
  scenes: SceneData[];
  onEditScene?: (id: string) => void;
  className?: string;
}

const sceneTypeConfig = {
  hook: { label: 'HOOK', color: 'var(--scene-hook)', bgClass: 'bg-white/10 text-white' },
  pain: { label: 'PAIN POINT', color: 'var(--scene-pain)', bgClass: 'bg-zinc-800 text-zinc-300' },
  solution: { label: 'SOLUTION', color: 'var(--scene-solution)', bgClass: 'bg-cyan-950/40 text-cyan-400' },
  benefit: { label: 'BENEFIT', color: 'var(--scene-benefit)', bgClass: 'bg-blue-950/40 text-blue-400' },
  cta: { label: 'CTA', color: 'var(--scene-cta)', bgClass: 'bg-purple-950/40 text-purple-400' },
};

export function ScriptTimeline({ scenes, onEditScene, className }: ScriptTimelineProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTitanium = mounted && theme === 'titanium';

  return (
    <div className={cn('relative space-y-0', className)}>
      {scenes.map((scene, index) => (
        <SceneCard
          key={scene.id}
          scene={scene}
          isLast={index === scenes.length - 1}
          isTitanium={isTitanium}
          onEdit={onEditScene ? () => onEditScene(scene.id) : undefined}
        />
      ))}
    </div>
  );
}

interface SceneCardProps {
  scene: SceneData;
  isLast: boolean;
  isTitanium: boolean;
  onEdit?: () => void;
}

function SceneCard({ scene, isLast, isTitanium, onEdit }: SceneCardProps) {
  const config = sceneTypeConfig[scene.type];

  return (
    <div className="relative pl-14 pb-8 group">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute top-10 bottom-0 w-px"
          style={{
            left: isTitanium ? '24px' : '20px',
            background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0))',
          }}
        />
      )}

      {/* Node number */}
      <div
        className={cn(
          'absolute left-0 top-0 flex items-center justify-center text-white font-bold z-10',
          'bg-[#111] border border-white/20 transition-transform group-hover:scale-110',
          isTitanium ? 'w-12 h-12 rounded-xl text-lg' : 'w-10 h-10 rounded-full text-sm'
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {isTitanium ? String(scene.number).padStart(2, '0') : scene.number}
      </div>

      {/* Duration indicator (V7 only) */}
      {isTitanium && (
        <span className="absolute left-0 top-14 text-[10px] font-mono text-zinc-500 font-bold rotate-90 origin-center translate-y-2 w-12 text-center">
          {scene.duration}
        </span>
      )}

      {/* Content card */}
      <GlassPanel
        variant="hover"
        className={cn(
          'p-6 border-l-[3px]',
          'hover:translate-x-1'
        )}
        style={{ borderLeftColor: config.color }}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider',
                config.bgClass
              )}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {config.label}
            </span>
            {!isTitanium && (
              <span className="text-[10px] font-mono text-white/40">{scene.duration}</span>
            )}
          </div>
          {onEdit && (
            <button
              onClick={onEdit}
              className="text-xs text-zinc-500 hover:text-white transition-colors font-medium"
            >
              Edit
            </button>
          )}
        </div>

        <div className={cn(scene.visual ? 'grid md:grid-cols-2 gap-6' : '')}>
          <div>
            {scene.visual && (
              <span className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Audio / Script
              </span>
            )}
            <p className="text-[15px] text-zinc-100 font-normal leading-relaxed">
              "{scene.script}"
            </p>
          </div>
          {scene.visual && (
            <div>
              <span className="block text-[10px] font-bold text-zinc-500 mb-2 uppercase tracking-wide" style={{ fontFamily: 'var(--font-display)' }}>
                Visual Direction
              </span>
              <p className="text-sm text-zinc-400 font-normal leading-relaxed">
                {scene.visual}
              </p>
            </div>
          )}
        </div>

        {scene.notes && (
          <p className="text-xs text-zinc-500 font-mono mt-2">
            Visual: {scene.notes}
          </p>
        )}
      </GlassPanel>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/script-timeline.tsx
git commit -m "feat: create ScriptTimeline component with V7/V8 adaptive styling"
```

---

## Task 9: Create Hero Section Component

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/hero-section.tsx`

**Step 1: Create the component**

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { GlassPanel } from './glass-panel';
import { useTheme } from 'next-themes';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  onAnalyze?: (url: string) => void;
  isLoading?: boolean;
  className?: string;
}

export function HeroSection({
  title = 'Decode the Viral Formula.',
  subtitle,
  placeholder = 'Paste TikTok video URL here...',
  onAnalyze,
  isLoading = false,
  className,
}: HeroSectionProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const isTitanium = mounted && theme === 'titanium';

  const handleSubmit = () => {
    if (url.trim() && onAnalyze) {
      onAnalyze(url);
    }
  };

  return (
    <section className={cn('max-w-4xl mx-auto text-center mb-20', isTitanium && 'animate-[float_8s_ease-in-out_infinite]', className)}>
      {/* Title */}
      <h1
        className={cn(
          'text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.05]',
          isTitanium
            ? 'text-white'
            : 'bg-gradient-to-br from-white via-white to-slate-400 bg-clip-text text-transparent'
        )}
        style={{ fontFamily: 'var(--font-display)' }}
      >
        {isTitanium ? (
          <>
            <span className="text-white">Decode the</span>
            <br />
            <span className="text-zinc-500">Viral Formula.</span>
          </>
        ) : (
          'Production Ready.'
        )}
      </h1>

      {/* Input Section */}
      <div className="relative max-w-2xl mx-auto group">
        {/* Glow effect (V7 only) */}
        {isTitanium && (
          <div className="absolute -inset-0.5 bg-gradient-to-r from-zinc-500 to-cyan-500 rounded-2xl blur opacity-10 group-hover:opacity-30 transition duration-500" />
        )}

        <GlassPanel
          className={cn(
            'relative flex items-center p-2',
            isTitanium ? 'rounded-xl' : 'rounded-2xl hover:scale-[1.01] transition-transform duration-300'
          )}
        >
          {/* TikTok Icon */}
          <div className="pl-4 pr-3 text-white/40">
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
            </svg>
          </div>

          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            className="flex-1 bg-transparent text-white placeholder-zinc-500 text-lg outline-none font-medium h-12"
            placeholder={placeholder}
          />

          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={cn(
              'px-6 h-12 rounded-lg font-bold text-sm transition-all flex items-center gap-2',
              'bg-white hover:bg-zinc-200 text-black',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze'
            )}
          </button>
        </GlassPanel>
      </div>
    </section>
  );
}
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/hero-section.tsx
git commit -m "feat: create HeroSection component with theme-aware styling"
```

---

## Task 10: Create Index Export File

**Files:**
- Create: `frontend/src/themes/default/blocks/video-gen/index.tsx`

**Step 1: Create the export file**

```tsx
export { BackgroundLayer } from './background-layer';
export { GlassPanel } from './glass-panel';
export { HeroSection } from './hero-section';
export { Navigation } from './navigation';
export { ScriptTimeline } from './script-timeline';
export type { SceneData } from './script-timeline';
export { StatsCard, StatsGrid } from './stats-card';
export { VideoPreview } from './video-preview';
```

**Step 2: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/index.tsx
git commit -m "feat: create index export for video-gen components"
```

---

## Task 11: Create Video Generator Page

**Files:**
- Create: `frontend/src/app/[locale]/(landing)/video-gen/page.tsx`

**Step 1: Create the page**

```tsx
'use client';

import { useState } from 'react';
import {
  BackgroundLayer,
  GlassPanel,
  HeroSection,
  Navigation,
  ScriptTimeline,
  StatsGrid,
  VideoPreview,
} from '@/themes/default/blocks/video-gen';
import type { SceneData } from '@/themes/default/blocks/video-gen';

// Demo data
const demoScenes: SceneData[] = [
  {
    id: '1',
    number: 1,
    type: 'hook',
    duration: '0-3s',
    script: 'Do you know why this product is selling out everywhere right now?',
    visual: 'Extreme close-up. Background bokeh. Handheld camera movement.',
  },
  {
    id: '2',
    number: 2,
    type: 'pain',
    duration: '3-10s',
    script: 'Summer heat driving you crazy? Regular fans are just too bulky to carry.',
    notes: 'Person sweating, struggling with old fan.',
  },
  {
    id: '3',
    number: 3,
    type: 'solution',
    duration: '10-20s',
    script: 'This portable mini-fan fits in your pocket but has tornado power!',
  },
  {
    id: '4',
    number: 4,
    type: 'cta',
    duration: '25-30s',
    script: 'Click the link below to get yours for 50% off today only!',
  },
];

const demoStats = [
  { label: 'Views', value: 1200000, color: '#ffffff' },
  { label: 'Likes', value: 85000, color: '#22d3ee' },
  { label: 'Shares', value: 3500, color: '#3b82f6' },
  { label: 'CTR', value: '4.2%', color: '#71717a' },
];

export default function VideoGenPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(true); // Demo: show results

  const handleAnalyze = async (url: string) => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen relative selection:bg-white/20">
      <BackgroundLayer />
      <Navigation brandName="VideoGen" />

      <main className="relative z-10 pt-28 pb-20 max-w-[1280px] mx-auto px-6">
        <HeroSection
          onAnalyze={handleAnalyze}
          isLoading={isLoading}
        />

        {showResults && (
          <>
            <div className="relative h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent mb-16" />

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              {/* Left: Video Preview & Stats */}
              <div className="lg:col-span-4 space-y-6 sticky top-24">
                <VideoPreview duration="00:32" isLive />
                <StatsGrid stats={demoStats} />
              </div>

              {/* Right: Script Editor */}
              <div className="lg:col-span-8">
                <GlassPanel className="p-8 min-h-[800px]">
                  <div className="flex items-center justify-between mb-10">
                    <h2
                      className="text-2xl font-bold tracking-tight text-white"
                      style={{ fontFamily: 'var(--font-display)' }}
                    >
                      Script Timeline
                    </h2>
                    <button className="bg-white text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:scale-105 transition-transform shadow-lg shadow-white/5">
                      Generate Video ($1.50)
                    </button>
                  </div>

                  <ScriptTimeline
                    scenes={demoScenes}
                    onEditScene={(id) => console.log('Edit scene:', id)}
                  />
                </GlassPanel>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
```

**Step 2: Verify page loads**

Run: `cd frontend && pnpm dev`
Open: `http://localhost:3000/en/video-gen`
Expected: See full video generator interface

**Step 3: Commit**

```bash
git add frontend/src/app/[locale]/(landing)/video-gen/page.tsx
git commit -m "feat: create video generator page with all components"
```

---

## Task 12: Add Theme Switcher

**Files:**
- Modify: `frontend/src/themes/default/blocks/video-gen/navigation.tsx`

**Step 1: Add theme toggle to Navigation**

Update the navigation component to include a theme switcher:

```tsx
'use client';

import { cn } from '@/shared/lib/utils';
import { Zap, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface NavigationProps {
  brandName?: string;
  className?: string;
}

export function Navigation({ brandName = 'VideoGen', className }: NavigationProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'titanium' ? 'aurora' : 'titanium');
  };

  return (
    <nav
      className={cn(
        'fixed top-0 w-full z-50',
        'border-b border-white/5',
        'bg-black/50 backdrop-blur-xl',
        className
      )}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-white/10 border border-white/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight text-white" style={{ fontFamily: 'var(--font-display)' }}>
            {brandName}
          </span>
          {mounted && (
            <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold uppercase tracking-wider text-white/50">
              {theme === 'titanium' ? 'V7' : 'V8'}
            </span>
          )}
        </div>

        {/* Nav Links */}
        <div className="flex items-center gap-8">
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-400">
            <Link href="#" className="hover:text-white transition-colors">
              Analyzer
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              Templates
            </Link>
          </div>

          {/* Theme Toggle + Auth */}
          <div className="pl-6 border-l border-white/10 flex items-center gap-4">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
                title={`Switch to ${theme === 'titanium' ? 'Aurora' : 'Titanium'} theme`}
              >
                {theme === 'titanium' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}
            <button className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Log In
            </button>
            <button className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 transition-all">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

**Step 2: Update ThemeProvider to support custom themes**

Modify `frontend/src/core/theme/provider.tsx`:

```tsx
'use client';

import { ReactNode, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const locale = useLocale();

  useEffect(() => {
    if (typeof document !== 'undefined' && locale) {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="aurora"
      themes={['light', 'dark', 'titanium', 'aurora']}
      enableSystem={false}
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
```

**Step 3: Verify theme switching works**

Run: `cd frontend && pnpm dev`
Open: `http://localhost:3000/en/video-gen`
Click theme toggle button
Expected: Background and component styles change between V7/V8

**Step 4: Commit**

```bash
git add frontend/src/themes/default/blocks/video-gen/navigation.tsx frontend/src/core/theme/provider.tsx
git commit -m "feat: add theme switcher with V7 Titanium and V8 Aurora support"
```

---

## Task 13: Final Verification

**Step 1: Build check**

Run: `cd frontend && pnpm build`
Expected: Build completes without errors

**Step 2: Visual verification**

Test both themes:
1. Open `http://localhost:3000/en/video-gen`
2. Switch to Titanium (V7): Check static background, square nodes, white accent
3. Switch to Aurora (V8): Check animated blobs, circular nodes, cyan accent

**Step 3: Responsive check**

Test on mobile viewport (Chrome DevTools → Toggle device toolbar)
Expected: Layout adapts, single column on mobile

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete UI theme integration (V7 Titanium + V8 Aurora)"
```

---

## Summary

This plan creates a complete dual-theme video generator interface with:

| Component | Purpose |
|-----------|---------|
| `BackgroundLayer` | Theme-aware background (static vs animated) |
| `GlassPanel` | Reusable glass-morphism container |
| `Navigation` | Top navbar with theme toggle |
| `HeroSection` | Input area with title |
| `VideoPreview` | 9:16 video thumbnail with overlay |
| `StatsGrid` | Performance metrics display |
| `ScriptTimeline` | Timeline editor with scene cards |

**Total Files Created:** 9 new files
**Total Commits:** 13 commits
