# AI Chat Assistant

English | [简体中文](./README.zh-CN.md)

A modern AI chat assistant application built with Next.js 16, Prisma ORM, and Supabase.

## Features

- 🤖 **Multi-Model Support** - Seamlessly switch between different AI models (OpenAI, Claude, Gemini, etc.)
- 💬 **Real-time Streaming** - Smooth typing effect with server-sent events
- 🔐 **Secure Authentication** - GitHub OAuth and email login via Supabase Auth
- 📝 **Chat History** - Persistent conversation storage with PostgreSQL
- ⚙️ **Custom Model Settings** - Configure your own API keys and model parameters
- 🎨 **Modern UI** - Clean, responsive design with dark mode support
- ⚡ **Fast & Optimized** - Server components, streaming, and edge-ready architecture
- 🔄 **Auto-sync** - Real-time data synchronization across devices
- 🧪 **Code Sandbox** - Run AI-generated code directly in browser with React, Vue, TypeScript support
- 🎮 **AI Tools** - Built-in tools like Gomoku game and time query for interactive experiences
- 🖼️ **Sandbox Gallery** - Browse and share code sandbox creations with the community
- 🔗 **Share Feature** - Share your sandbox works with others via unique links

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org) 16 (App Router)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: [Prisma](https://www.prisma.io/) 7
- **Authentication**: Supabase Auth (GitHub OAuth / Email)
- **AI SDK**: Vercel AI SDK
- **UI Components**: Radix UI + Tailwind CSS
- **State Management**: Zustand
- **Code Sandbox**: [Sandpack](https://sandpack.codesandbox.io/) by CodeSandbox

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended)
- PostgreSQL database (Supabase recommended)

### 1. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd ai-assistant
pnpm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database (Prisma)
DATABASE_URL=your_pooled_connection_string
DIRECT_URL=your_direct_connection_string

# Encryption Key (for encrypting sensitive data like API keys)
ENCRYPTION_KEY=your_64_character_hex_string

```

> **Note**:
>
> - `DATABASE_URL` is for connection pooling (Supabase pooler), `DIRECT_URL` is for direct connections used by migrations.
> - `ENCRYPTION_KEY` must be a 64-character hexadecimal string (32 bytes). Generate one using: `openssl rand -hex 32`

### 3. Initialize Database

```bash
# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### 4. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Prisma Usage Guide

### Available Scripts

| Script        | Command              | Description                             |
| ------------- | -------------------- | --------------------------------------- |
| `db:generate` | `prisma generate`    | Generate Prisma Client based on schema  |
| `db:push`     | `prisma db push`     | Push schema changes directly (dev only) |
| `db:migrate`  | `prisma migrate dev` | Create and run migrations               |
| `db:studio`   | `prisma studio`      | Open Prisma Studio GUI                  |

### Workflow

#### 1. Modify Schema

Edit `prisma/schema.prisma` to define or modify your data models:

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  // ... add more fields
}
```

#### 2. Create Migration

After modifying the schema, create a migration:

```bash
pnpm db:migrate
```

This will:

- Generate SQL migration files in `prisma/migrations/`
- Apply the migration to your database
- Regenerate the Prisma Client

#### 3. Quick Schema Sync (Development Only)

For rapid prototyping without creating migration files:

```bash
pnpm db:push
```

> ⚠️ **Warning**: `db:push` doesn't create migration files. Use `db:migrate` for production-ready changes.

#### 4. Regenerate Client

If you only need to regenerate the Prisma Client:

```bash
pnpm db:generate
```

#### 5. View Data

Open Prisma Studio to browse and edit your data:

```bash
pnpm db:studio
```

### Prisma Client Location

The generated Prisma Client is output to `src/generated/prisma/` as configured in `schema.prisma`:

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}
```

### Using Prisma Client

Import and use the Prisma Client in your code:

```typescript
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// Example: Create a user
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Example: Query with relations
const chats = await prisma.chat.findMany({
  where: { userId: 1 },
  include: { messages: true },
});
```

## Project Structure

```
ai-assistant/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Migration history
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── chat/          # Chat pages
│   │   ├── gallery/       # Sandbox gallery pages
│   │   ├── login/         # Auth pages
│   │   ├── settings/      # Settings pages
│   │   └── share/         # Share pages
│   ├── actions/           # Server actions
│   ├── components/        # React components
│   │   ├── custom/        # Custom UI components
│   │   ├── gallery/       # Gallery components
│   │   ├── tools/         # AI tool components (sandbox, gomoku, etc.)
│   │   └── ui/            # Shadcn UI components
│   ├── generated/prisma/  # Generated Prisma Client
│   ├── hooks/             # Custom React hooks
│   ├── store/             # Zustand stores
│   └── types/             # TypeScript types
├── prisma.config.ts       # Prisma configuration
└── package.json
```

## Data Models

- **User**: User accounts with Supabase Auth integration
- **Chat**: Chat sessions with title and model configuration
- **Message**: Individual messages in a chat
- **UserModel**: Custom AI model configurations per user
- **Sandbox**: Code sandbox creations linked to chat messages

## License

MIT
