# B站 MCP Server 

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![MCP](https://img.shields.io/badge/MCP-1.20-green)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

基于 Model Context Protocol (MCP) 的 B站视频搜索服务器，使用 TypeScript 重构，提供更好的类型安全、模块化架构和扩展性。


## 📦 安装

### 前置要求
- Node.js >= 20
- npm / bun

### 安装步骤

```bash
# 克隆项目
git clone <repository-url>
cd bilibili-mcp-ts

# 安装依赖
npm install
# 或
bun install

# 编译
npm run build

# 测试
npm test
```

## 🚀 快速开始

### 方式 1: STDIO 模式（推荐，用于 AI 工具）

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

在 AI 工具中配置（以 Trae 为例）：

```json
{
  "mcpServers": {
    "bilibili-search": {
      "command": "node",
      "args": ["/path/to/bilibili-mcp-ts/dist/index.js"],
      "description": "B站视频搜索 MCP 服务"
    }
  }
}
```

### 方式 2: HTTP 模式（远程调用）

```bash
# 启动 HTTP 服务（默认端口 3000）
TRANSPORT=remote npm start

# 指定端口
TRANSPORT=remote PORT=8888 npm start
```

### 方式 3: 使用 npx（发布后）

```json
{
  "mcpServers": {
    "bilibili-search": {
      "command": "npx",
      "args": ["bilibili-mcp-ts"],
      "description": "B站视频搜索 MCP 服务"
    }
  }
}
```

## 🔧 配置

### 环境变量

```bash
# 日志级别（debug | info | warn | error）
export LOG_LEVEL=info

# 传输模式（stdio | remote）
export TRANSPORT=stdio

# HTTP 端口（remote 模式）
export PORT=3000

# Cookie 过期时间（毫秒）
export COOKIE_MAX_AGE=1800000  # 30分钟

# 缓存 TTL（毫秒）
export CACHE_TTL=300000  # 5分钟
```

### MCP Inspector 调试

```bash
# 开发模式
npm run inspector:dev

# 生产模式
npm run inspector
```

## 📚 API 文档

### 可用工具

#### 1. bilibili_search
搜索B站视频

**参数：**
- `keyword` (string): 搜索关键词
- `page` (number, 可选): 页码，默认 1
- `limit` (number, 可选): 返回数量，默认 10，最大 50

**示例：**
```json
{
  "keyword": "TypeScript 教程",
  "page": 1,
  "limit": 10
}
```

#### 2. bilibili_video_detail
获取视频详情

**参数：**
- `videoId` (string): 视频ID（BV号或AV号）

**示例：**
```json
{
  "videoId": "BV1w41117tZ"
}
```

#### 3. bilibili_danmaku
获取视频弹幕（新功能）

**参数：**
- `bvid` (string): 视频BV号
- `cid` (number, 可选): 分P ID

**示例：**
```json
{
  "bvid": "BV1w41117tZ"
}
```

#### 4. bilibili_user_info
获取UP主完整信息

**参数：**
- `uid` (string): 用户ID

**示例：**
```json
{
  "uid": "2"
}
```

#### 5. bilibili_hot_content
获取热门内容

**参数：**
- `type` (string, 可选): 热门类型
    - `all` (默认): 综合热门
    - `history`: 入站必刷
    - `rank`: 排行榜
    - `music`: 音乐榜

**示例：**
```json
{
  "type": "all"
}
```

#### 6. bilibili_bangumi_timeline
获取番剧时间表

**参数：**
- `types` (number, 可选): 内容类型，默认 1（番剧）
- `before` (number, 可选): 之前天数，默认 6
- `after` (number, 可选): 之后天数，默认 6

**示例：**
```json
{
  "before": 3,
  "after": 3
}
```

## 📝 使用示例

### 示例 1: 直接调用服务

```typescript
import { bilibiliService } from './src/services/bilibili.js';

// 搜索视频
const results = await bilibiliService.searchVideos({
  keyword: 'TypeScript 教程',
  limit: 10
});

// 获取视频详情
const detail = await bilibiliService.getVideoDetail({
  videoId: 'BV1w41117tZ'
});
```

运行示例：
```bash
tsx examples/simple.ts
```

### 示例 2: LangChain 集成

```typescript
import { MCPToolkit } from './mcp-langchain-ts-client/index.js';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { ChatOpenAI } from '@langchain/openai';

// 初始化 MCP Toolkit
const toolkit = new MCPToolkit({
  command: 'node',
  args: ['./dist/index.js']
});
await toolkit.initialize();

// 创建 Agent
const agent = createReactAgent({
  llm: new ChatOpenAI({ model: 'gpt-4o-mini' }),
  tools: toolkit.tools
});

// 使用 Agent
const result = await agent.invoke({
  messages: [new HumanMessage("搜索B站TypeScript教程，推荐最好的一个")]
});
```

运行示例：
```bash
# 先编译
npm run build

# 设置 API Key
export OPENAI_API_KEY=your_api_key

# 运行示例
tsx examples/langchain.ts
```

## 🏗️ 项目架构

```
src/
├── types/           # 类型定义
│   ├── index.ts     # 核心类型
│   └── tools.ts     # 工具参数类型
├── config/          # 配置管理
├── utils/           # 工具函数
│   ├── logger.ts    # 日志系统
│   ├── cookie.ts    # Cookie 管理
│   └── cache.ts     # 缓存管理
├── api/             # API 调用层
│   ├── client.ts    # HTTP 客户端
│   ├── search.ts    # 搜索 API
│   ├── video.ts     # 视频 API
│   ├── user.ts      # 用户 API
│   ├── hot.ts       # 热门 API
│   ├── bangumi.ts   # 番剧 API
│   └── index.ts     # 统一导出
├── services/        # 业务逻辑层
│   └── bilibili.ts  # 业务编排
├── server/          # MCP Server 层
│   └── index.ts     # MCP 协议实现
└── index.ts         # 主入口
```

## 🔍 性能优化

### 1. Cookie 复用
- Cookie 自动获取和复用
- 可配置的过期时间（默认 30 分钟）

### 2. 请求缓存
- 内存缓存层
- 可配置的 TTL（默认 5 分钟）
- 自动清理过期缓存

### 3. 批量操作
- 批量获取视频详情
- 并行请求优化

## 🧪 测试

### 运行集成测试

```bash
# 编译并测试
npm test

# 仅测试（已编译）
npm run test:dev
```

测试内容包括：
- 工具列表获取
- 视频搜索
- 视频详情
- 用户信息
- 热门内容
- 番剧时间表

## 🛠️ 开发

### 项目脚本

```bash
# 开发
npm run dev

# 编译
npm run build

# 清理
npm run clean

# 调试
npm run inspector

# 测试
npm test
```

### 添加新工具

1. **在 `src/api/` 添加 API 调用**
   ```typescript
   // src/api/newFeature.ts
   export class NewFeatureService {
     public async getData() { /* ... */ }
   }
   ```

2. **在 `src/types/tools.ts` 添加参数类型**
   ```typescript
   export interface NewFeatureToolArgs {
     param: string;
   }
   ```

3. **在 `src/server/index.ts` 注册工具**
   ```typescript
   // 在 tools 数组中添加
   {
     name: 'bilibili_new_feature',
     description: '新功能描述',
     inputSchema: { /* ... */ }
   }
   
   // 在 switch 中添加处理
   case 'bilibili_new_feature':
     return await this.handleNewFeature(args);
   ```

## 📊 性能对比

| 指标 | 重构前 | 重构后 | 提升 |
|------|--------|--------|------|
| 首次请求 | 100% | 100% | - |
| 重复请求（缓存） | 100% | 10% | 90% ↓ |
| 代码复用率 | 低 | 高 | - |
| 类型覆盖率 | 部分 | 100% | - |
| Cookie 获取 | 每次请求 | 复用 30min | - |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [LangChain](https://langchain.com/)
- [Bilibili](https://www.bilibili.com/)

## 📞 支持

如有问题或建议，请提交 [Issue](https://github.com/your-repo/issues)。
