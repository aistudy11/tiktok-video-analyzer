# ShipAny 基座保护规则（最高优先级）

此规则适用于所有操作，无路径限制。

---

## 核心原则

**ShipAny 是本项目的成熟基座模板，购买它是为了省事、高效、快速开发。**

**基座代码禁止修改，业务代码在指定位置开发。**

---

## 基座目录（只读，禁止修改）

以下目录属于 ShipAny 基座，**任何情况下都不能修改**：

```
frontend/src/
├── core/                    # 核心模块（auth, db, i18n, theme）
├── shared/                  # 共享模块
│   ├── blocks/             # 通用区块组件（除业务专用目录）
│   ├── components/ui/      # UI 组件库
│   ├── models/             # 数据模型
│   ├── services/           # 通用服务
│   ├── contexts/           # Context providers
│   ├── hooks/              # 通用 hooks（除业务专用）
│   └── lib/                # 工具函数
├── extensions/              # 扩展模块
│   ├── payment/            # 支付（stripe, paypal, creem）
│   ├── ai/                 # AI 集成
│   ├── email/              # 邮件服务
│   └── storage/            # 存储服务
├── app/api/                 # API 路由（除业务专用）
│   ├── payment/            # 支付 API
│   ├── chat/               # 聊天 API
│   ├── user/               # 用户 API
│   ├── ai/                 # AI API
│   ├── config/             # 配置 API
│   ├── email/              # 邮件 API
│   ├── storage/            # 存储 API
│   └── proxy/              # 代理 API
├── config/                  # 配置文件
└── themes/default/          # 主题（除业务专用 blocks）
    ├── layouts/            # 布局组件
    └── pages/              # 页面组件
```

---

## 业务目录（可以修改/新增）

以下目录属于**本项目业务代码**，可以自由修改：

```
frontend/src/
├── app/api/tiktok/                    # TikTok 业务 API ✅
├── themes/default/blocks/tiktok/      # TikTok 业务组件 ✅
├── shared/hooks/use-tiktok-*.ts       # TikTok 业务 hooks ✅
├── shared/hooks/use-script-*.ts       # 脚本生成 hooks ✅
├── shared/hooks/use-video-*.ts        # 视频生成 hooks ✅
├── shared/services/tiktok.ts          # TikTok 服务 ✅
├── types/tiktok.ts                    # TikTok 类型定义 ✅
├── lib/video-task-store.ts            # 视频任务存储 ✅
└── app/[locale]/(landing)/tiktok-*/   # TikTok 页面 ✅

backend/                                # 后端业务代码 ✅
├── gateway/
└── skills/
    ├── video_download/
    ├── ai_analysis/
    └── data_sync/
```

---

## 允许的操作

| 操作 | 基座代码 | 业务代码 |
|------|----------|----------|
| 读取/参考 | ✅ | ✅ |
| 新增文件 | ❌ | ✅ |
| 修改文件 | ❌ | ✅ |
| 删除文件 | ❌ | ✅ |

---

## 特殊情况处理

### 1. 需要修改基座行为时

**不要直接改基座代码**，应该：
- 在业务目录创建包装组件
- 通过 props/配置 覆盖默认行为
- 等待 ShipAny 官方更新

### 2. 基座代码有 bug 或需要优化时

**不要自己修复**，应该：
- 记录问题
- 等待 ShipAny 官方更新
- 或向 ShipAny 提交反馈

### 3. 新增页面/功能时

- 页面放在 `app/[locale]/(landing)/` 下，遵循现有路由模式
- API 放在 `app/api/[业务名]/` 下
- 组件放在 `themes/default/blocks/[业务名]/` 下
- 类型放在 `types/[业务名].ts`

---

## 配置修改（允许）

以下**配置文件**可以根据项目需要修改：

```
frontend/
├── .env.*                              # 环境变量 ✅
├── src/config/locale/messages/*.json   # 国际化内容 ✅
├── src/config/style/theme.css          # 主题样式 ✅
├── public/                             # 静态资源 ✅
└── next.config.mjs                     # Next.js 配置 ✅
```

---

## 执行前检查清单

在修改任何文件前，必须确认：

- [ ] 该文件是否属于基座目录？
- [ ] 如果是基座，是否有其他方式实现需求？
- [ ] 如果必须修改基座，是否已告知用户并获得确认？

---

## 违规示例

```
❌ 错误：修改 shared/blocks/common/error-boundary.tsx
❌ 错误：修改 extensions/payment/stripe.ts
❌ 错误：修改 core/auth/config.ts
❌ 错误：修改 app/api/payment/checkout/route.ts

✅ 正确：修改 app/api/tiktok/analyze/route.ts
✅ 正确：修改 themes/default/blocks/tiktok/video-result.tsx
✅ 正确：新增 shared/hooks/use-tiktok-analyze.ts
✅ 正确：修改 backend/skills/video_download/download.py
```

---

## 目录结构变更

**禁止**改变 ShipAny 的目录结构和路由约定：

- 不能移动/重命名基座目录
- 不能改变 `[locale]` 路由模式
- 不能改变组件导出方式
- 新增目录必须符合现有命名规范
