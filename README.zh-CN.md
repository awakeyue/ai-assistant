# AI 聊天助手

[English](./README.md) | 简体中文

一个使用 Next.js 16、Prisma ORM 和 Supabase 构建的现代化 AI 聊天助手应用。

## 功能特色

- 🤖 **多模型支持** - 无缝切换不同的 AI 模型（OpenAI、Claude、Gemini 等）
- 💬 **实时流式输出** - 基于 SSE 的流畅打字效果
- 🔐 **安全认证** - 通过 Supabase Auth 支持 GitHub OAuth 和邮箱登录
- 📝 **聊天历史** - 使用 PostgreSQL 持久化存储对话记录
- ⚙️ **自定义模型配置** - 配置自己的 API 密钥和模型参数
- 🎨 **现代化界面** - 简洁响应式设计，支持深色模式
- ⚡ **高性能优化** - 服务端组件、流式传输、边缘就绪架构
- 🔄 **自动同步** - 跨设备实时数据同步
- 🧪 **代码沙盒** - AI 生成的代码可直接在浏览器中运行，支持 React、Vue、TypeScript 等模板
- 🎮 **AI 工具集成** - 内置五子棋游戏、时间查询等工具，提供丰富的交互体验
- 🖼️ **沙盒广场** - 浏览和分享代码沙盒作品，与社区互动
- 🔗 **分享功能** - 通过唯一链接分享您的沙盒作品

## 技术栈

- **框架**: [Next.js](https://nextjs.org) 16 (App Router)
- **数据库**: PostgreSQL (通过 Supabase)
- **ORM**: [Prisma](https://www.prisma.io/) 7
- **认证**: Supabase Auth (GitHub OAuth / 邮箱)
- **AI SDK**: Vercel AI SDK
- **UI 组件**: Radix UI + Tailwind CSS
- **状态管理**: Zustand
- **代码沙盒**: [Sandpack](https://sandpack.codesandbox.io/) by CodeSandbox

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐)
- PostgreSQL 数据库 (推荐使用 Supabase)

### 1. 克隆并安装依赖

```bash
git clone <your-repo-url>
cd ai-assistant
pnpm install
```

### 2. 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 数据库 (Prisma)
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string

# 加密密钥 (用于加密敏感数据如 API 密钥)
ENCRYPTION_KEY=your_64_character_hex_string

```

> **说明**:
>
> - `DATABASE_URL` 用于连接池 (Supabase pooler)，`DIRECT_URL` 用于迁移时的直接连接。
> - `ENCRYPTION_KEY` 必须是 64 字符的十六进制字符串（32 字节）。生成方式：`openssl rand -hex 32`

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 运行迁移
pnpm db:migrate
```

### 4. 启动开发服务器

```bash
pnpm dev
```

在浏览器中打开 [http://localhost:3000](http://localhost:3000) 查看效果。

## Prisma 使用指南

### 可用脚本

| 脚本          | 命令                 | 说明                            |
| ------------- | -------------------- | ------------------------------- |
| `db:generate` | `prisma generate`    | 根据 schema 生成 Prisma Client  |
| `db:push`     | `prisma db push`     | 直接推送 schema 变更 (仅限开发) |
| `db:migrate`  | `prisma migrate dev` | 创建并运行迁移                  |
| `db:studio`   | `prisma studio`      | 打开 Prisma Studio 可视化界面   |

### 工作流程

#### 1. 修改 Schema

编辑 `prisma/schema.prisma` 来定义或修改数据模型：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  // ... 添加更多字段
}
```

#### 2. 创建迁移

修改 schema 后，创建迁移：

```bash
pnpm db:migrate
```

此命令会：

- 在 `prisma/migrations/` 目录下生成 SQL 迁移文件
- 将迁移应用到数据库
- 重新生成 Prisma Client

#### 3. 快速同步 Schema (仅限开发)

在快速原型开发时，可以不创建迁移文件直接同步：

```bash
pnpm db:push
```

> ⚠️ **警告**: `db:push` 不会创建迁移文件。生产环境变更请使用 `db:migrate`。

#### 4. 重新生成 Client

如果只需要重新生成 Prisma Client：

```bash
pnpm db:generate
```

#### 5. 查看数据

打开 Prisma Studio 浏览和编辑数据：

```bash
pnpm db:studio
```

### Prisma Client 位置

生成的 Prisma Client 输出到 `src/generated/prisma/`，这在 `schema.prisma` 中配置：

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### 使用 Prisma Client

在代码中导入并使用 Prisma Client：

```typescript
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// 示例：创建用户
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "张三",
  },
});

// 示例：关联查询
const chats = await prisma.chat.findMany({
  where: { userId: 1 },
  include: { messages: true },
});
```

## 项目结构

```
ai-assistant/
├── prisma/
│   ├── schema.prisma      # 数据库 schema
│   └── migrations/        # 迁移历史
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API 路由
│   │   ├── chat/          # 聊天页面
│   │   ├── gallery/       # 沙盒广场页面
│   │   ├── login/         # 认证页面
│   │   ├── settings/      # 设置页面
│   │   └── share/         # 分享页面
│   ├── actions/           # Server Actions
│   ├── components/        # React 组件
│   │   ├── custom/        # 自定义 UI 组件
│   │   ├── gallery/       # 沙盒广场组件
│   │   ├── tools/         # AI 工具组件 (沙盒、五子棋等)
│   │   └── ui/            # Shadcn UI 组件
│   ├── generated/prisma/  # 生成的 Prisma Client
│   ├── hooks/             # 自定义 React Hooks
│   ├── store/             # Zustand 状态管理
│   └── types/             # TypeScript 类型定义
├── prisma.config.ts       # Prisma 配置
└── package.json
```

## 数据模型

- **User**: 用户账户，与 Supabase Auth 集成
- **Chat**: 聊天会话，包含标题和模型配置
- **Message**: 聊天中的单条消息
- **UserModel**: 用户自定义的 AI 模型配置
- **Sandbox**: 代码沙盒作品，与聊天消息关联

## 许可证

MIT
