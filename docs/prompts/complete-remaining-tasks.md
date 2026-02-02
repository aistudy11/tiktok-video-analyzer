# TikTok Video Analyzer - 完整任务执行提示词

> 在新窗口无上下文情况下执行，完成所有剩余功能开发

## 项目背景

这是一个跨境电商视频生成器，核心流程：
1. **输入TikTok链接** → 2. **AI分析视频** → 3. **生成脚本** → 4. **用户编辑** → 5. **生成视频** → 6. **下载分享**

**当前状态**：
- Step 1-2 后端API已完成 ✅
- Step 3-6 待开发 ❌
- 前端UI使用假数据，未连接真实API ❌

## 架构规则（必须遵守）

1. **基座架构原则** - 以原代码架构为基座开发，不创建多余目录层级
2. **禁止重复组件** - 不创建与现有组件功能重复的新组件
3. **Blocks目录结构**：
   - 通用组件放 `themes/default/blocks/` 根目录
   - 业务特定组件按平台分子目录（如 `tiktok/`）

## 任务分解

请使用 TaskCreate 创建以下任务，然后逐一执行：

### Phase 1: 连接前端UI到后端API

#### Task 1.1: 创建TikTok分析服务Hook
```
文件: frontend/src/hooks/use-tiktok-analyze.ts
功能:
- 调用 POST /api/tiktok/analyze 提交分析任务
- 调用 GET /api/tiktok/status?task_id=xxx 轮询任务状态
- 返回分析结果（包含AI分析、视频信息等）
- 处理loading/error/success状态
```

#### Task 1.2: 修改首页连接真实API
```
文件: frontend/src/app/[locale]/(landing)/page.tsx
修改:
- 删除 demoScenes 和 demoStats 假数据
- 使用 use-tiktok-analyze hook
- handleAnalyze 调用真实API
- 分析完成后展示真实数据
- 添加错误处理和loading状态
```

#### Task 1.3: 更新ScriptTimeline组件接收真实数据
```
文件: frontend/src/themes/default/blocks/tiktok/script-timeline.tsx
修改:
- 数据类型匹配后端返回格式
- 从AI分析结果中提取scenes数据
```

### Phase 2: 脚本生成功能

#### Task 2.1: 创建脚本生成API
```
文件: frontend/src/app/api/tiktok/generate-script/route.ts
功能:
- 接收AI分析结果作为输入
- 调用AI（OpenAI/Gemini）生成结构化脚本
- 返回JSON格式脚本：
  {
    title: string,
    total_duration: string,
    scenes: [{
      scene_number: number,
      duration: string,
      type: 'hook' | 'pain' | 'solution' | 'cta',
      narration: string,
      visual_description: string,
      notes?: string
    }],
    bgm_suggestion: string,
    cta: string
  }
```

#### Task 2.2: 创建脚本生成服务Hook
```
文件: frontend/src/hooks/use-script-generator.ts
功能:
- 调用 POST /api/tiktok/generate-script
- 管理生成状态
- 支持重新生成
```

### Phase 3: 脚本编辑器功能

#### Task 3.1: 创建脚本编辑器组件
```
文件: frontend/src/themes/default/blocks/tiktok/script-editor.tsx
功能:
- 展示生成的脚本scenes
- 每个scene可编辑：narration、visual_description
- 支持添加/删除scene
- 支持拖拽调整顺序
- 保存草稿功能
- "生成视频"按钮（显示价格$1.50）
```

#### Task 3.2: 集成脚本编辑器到首页
```
修改: frontend/src/app/[locale]/(landing)/page.tsx
- 分析完成后显示"生成脚本"按钮
- 脚本生成完成后显示编辑器
- 用户可编辑后点击"生成视频"
```

### Phase 4: 视频生成功能

#### Task 4.1: 创建Runway API集成
```
文件: frontend/src/app/api/tiktok/generate-video/route.ts
功能:
- 接收脚本数据
- 检查用户余额（调用 /api/user/get-user-credits）
- 调用Runway Gen-3 API生成视频
- 返回任务ID用于轮询
```

#### Task 4.2: 创建视频生成状态API
```
文件: frontend/src/app/api/tiktok/video-status/route.ts
功能:
- 轮询Runway任务状态
- 返回生成进度和最终视频URL
```

#### Task 4.3: 创建视频生成服务Hook
```
文件: frontend/src/hooks/use-video-generator.ts
功能:
- 调用视频生成API
- 轮询生成状态
- 返回视频URL
- 处理错误（余额不足等）
```

### Phase 5: 下载/分享功能

#### Task 5.1: 创建视频预览和下载组件
```
文件: frontend/src/themes/default/blocks/tiktok/video-result.tsx
功能:
- 视频预览播放器
- 下载按钮
- 分享按钮（复制链接）
- 重新生成按钮
```

#### Task 5.2: 完整流程集成
```
修改: frontend/src/app/[locale]/(landing)/page.tsx
完整流程:
1. 输入URL → 显示loading
2. 分析完成 → 显示视频预览+数据+脚本时间线
3. 点击"生成脚本" → 显示脚本编辑器
4. 编辑完成点击"生成视频" → 显示生成进度
5. 生成完成 → 显示视频结果+下载
```

### Phase 6: 测试验证

#### Task 6.1: 使用Browser MCP测试完整流程
```
测试步骤:
1. 打开 http://localhost:3000
2. 输入真实TikTok视频链接（如：https://www.tiktok.com/@xxx/video/xxx）
3. 点击Analyze按钮
4. 等待分析完成，验证数据展示
5. 点击生成脚本按钮
6. 编辑脚本内容
7. 点击生成视频按钮
8. 等待视频生成完成
9. 测试下载功能
```

## API参考

### 已有API

**POST /api/tiktok/analyze**
```json
// Request
{ "url": "https://www.tiktok.com/..." }

// Response
{ "task_id": "xxx-xxx-xxx" }
```

**GET /api/tiktok/status?task_id=xxx**
```json
// Response
{
  "status": "pending" | "processing" | "completed" | "failed",
  "result": {
    "video_info": {...},
    "ai_analysis": {...}
  }
}
```

### 待创建API

**POST /api/tiktok/generate-script**
**POST /api/tiktok/generate-video**
**GET /api/tiktok/video-status?task_id=xxx**

## 技术栈

- Next.js 14 App Router
- TypeScript
- Tailwind CSS v4
- next-themes（titanium/aurora双主题）
- React Hooks for state management

## 执行指令

```
请按照上述任务分解，使用TaskCreate创建所有任务，然后逐一执行。

每完成一个任务：
1. 使用TaskUpdate标记完成
2. 简要说明完成内容
3. 继续下一个任务

所有任务完成后：
1. 使用Browser MCP (mcp__claude-in-chrome__*) 测试完整流程
2. 截图记录测试结果
3. 汇报最终验收结果
```

## 注意事项

1. **保持架构一致** - 参考现有代码风格和目录结构
2. **组件复用** - 优先使用现有UI组件（GlassPanel, StatsGrid等）
3. **类型安全** - 所有接口定义TypeScript类型
4. **错误处理** - 每个API调用都要有错误处理
5. **用户体验** - 所有异步操作都要有loading状态
