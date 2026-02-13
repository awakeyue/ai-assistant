import { tool as createTool } from "ai";
import { z } from "zod";

export const weatherTool = createTool({
  description: "Display the weather for a location",
  inputSchema: z.object({
    location: z.string().describe("The location to get the weather for"),
  }),
  execute: async function ({ location }) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { weather: "Sunny", temperature: 75, location };
  },
});

export const gomokuTool = createTool({
  title: "AI五子棋",
  description:
    "开始一局五子棋游戏。当用户想要玩五子棋或类似的棋盘游戏时使用此工具，玩家轮流放置棋子以形成五子连珠。",
  inputSchema: z.object({
    playerColor: z
      .enum(["black", "white"])
      .optional()
      .describe("用户想要扮演的颜色。默认为黑色。"),
  }),
  execute: async ({ playerColor = "black" }) => {
    // Return data that will be used to render the Gomoku component
    return {
      game: "gomoku" as const,
      playerColor,
      message: `让我们来玩五子棋！你正在扮演${playerColor === "black" ? "黑棋" : "白棋"}。点击棋盘放置你的棋子。`,
    };
  },
});

export const currentTimeTool = createTool({
  title: "获取当前时间",
  description:
    "获取当前的日期和时间信息。当用户询问现在几点、今天日期、星期几、当前时间等相关问题时使用此工具。",
  inputSchema: z.object({}),
  execute: async () => {
    const now = new Date();
    // Use Asia/Shanghai timezone to ensure correct local time regardless of server location
    const timeZone = "Asia/Shanghai";

    // Get formatted date with timezone
    const formattedDate = now.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      timeZone,
    });

    // Get time components with correct timezone
    const timeFormatter = new Intl.DateTimeFormat("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone,
    });
    const timeParts = timeFormatter.formatToParts(now);
    const hours = timeParts.find((p) => p.type === "hour")?.value ?? "00";
    const minutes = timeParts.find((p) => p.type === "minute")?.value ?? "00";
    const seconds = timeParts.find((p) => p.type === "second")?.value ?? "00";

    return {
      // Formatted date string for display
      formattedDate,
      // Time components for display
      hours,
      minutes,
      seconds,
      // ISO string for reference (still in UTC for standardization)
      timestamp: now.toISOString(),
      // Timezone info
      timeZone,
    };
  },
});

export const codeSandboxTool = createTool({
  title: "代码沙盒预览",
  description: `交互式代码沙盒工具，用于实时预览和运行代码。

【何时使用此工具】
- 用户明确要求"预览"、"实时预览"、"运行"、"沙盒"效果
- 用户要求创建可交互的 demo、示例、原型
- 用户要求画图、生成图形、创建图标、绘制 SVG 矢量图（使用 static 模板）

【何时不使用此工具】
- 用户只是要求"写代码"、"生成代码"但没提预览 → 直接用 markdown 代码块返回
- 用户要求解释代码或代码审查 → 不使用此工具

【支持的模板类型】
1. "static" - 纯 HTML/CSS/JS（推荐用于简单页面、SVG 图形预览、不需要框架的场景）
2. "react" / "react-ts" - React 项目（默认）
3. "vue" / "vue-ts" - Vue 3 项目
4. "vanilla" / "vanilla-ts" - 纯 JavaScript/TypeScript

【SVG 图形预览】
当用户要求画图、生成 SVG 时，使用 template: "static"，将 SVG 代码嵌入 HTML 中：
{ "/index.html": { code: "<!DOCTYPE html><html><body style='display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0'><svg>...</svg></body></html>", active: true } }

【重要规则】
1. 对于简单 HTML 页面和 SVG 预览，必须使用 template: "static"，入口文件为 /index.html
2. React 项目入口文件是 /App.js 或 /App.tsx
3. Vue 项目入口文件是 /src/App.vue
4. Vanilla 项目入口文件是 /index.js 或 /index.ts
5. 使用外部依赖时必须在 dependencies 中声明
6. 文件路径必须以 "/" 开头`,
  inputSchema: z.object({
    files: z
      .record(
        z.string(),
        z.object({
          code: z.string().describe("文件内容"),
          hidden: z.boolean().optional().describe("是否隐藏此文件"),
          active: z.boolean().optional().describe("是否为激活的文件"),
          readOnly: z.boolean().optional().describe("是否只读"),
        }),
      )
      .describe(
        `文件映射对象。键为文件路径（必须以/开头），值为文件配置。
示例:
- static 模板: { "/index.html": { code: "<html>...</html>", active: true } }
- react 模板: { "/App.js": { code: "export default function App() {...}", active: true } }
- 多文件: { "/App.tsx": { code: "...", active: true }, "/components/Button.tsx": { code: "..." } }`,
      ),
    template: z
      .enum([
        "static",
        "react",
        "react-ts",
        "vanilla",
        "vanilla-ts",
        "vue",
        "vue-ts",
      ])
      .describe(
        `代码模板类型:
- "static": 纯 HTML/CSS/JS 页面（入口: /index.html）
- "react": React + JavaScript（入口: /App.js）
- "react-ts": React + TypeScript（入口: /App.tsx）
- "vue": Vue 3 + JavaScript（入口: /src/App.vue）
- "vue-ts": Vue 3 + TypeScript（入口: /src/App.vue）
- "vanilla": 纯 JavaScript（入口: /index.js）
- "vanilla-ts": 纯 TypeScript（入口: /index.ts）`,
      ),
    title: z
      .string()
      .optional()
      .describe("预览标题，简短描述生成的内容，如：'登录表单'、'动画按钮'"),
    dependencies: z
      .record(z.string(), z.string())
      .optional()
      .describe(
        "NPM 依赖包，格式: { 包名: 版本号 }，如: { 'lodash': 'latest', 'axios': '^1.6.0' }",
      ),
  }),
  execute: async ({ files, title, template, dependencies }) => {
    return {
      files,
      title: title || "代码预览",
      template,
      dependencies,
    };
  },
});

export const tools = {
  gomokuGame: gomokuTool,
  currentTime: currentTimeTool,
  codeSandbox: codeSandboxTool,
};

// Tool key type - all available tool keys
export type ToolKey = keyof typeof tools;

// Tool metadata for UI display
export interface ToolMeta {
  key: ToolKey;
  title: string;
  description: string;
  icon: string; // Lucide icon name identifier
}

// Registry of all available tools with their metadata
export const TOOL_REGISTRY: ToolMeta[] = [
  {
    key: "codeSandbox",
    title: "代码沙盒预览",
    description: "实时预览和运行代码",
    icon: "Code",
  },
  {
    key: "gomokuGame",
    title: "AI 五子棋",
    description: "开始一局五子棋游戏",
    icon: "Grid3X3",
  },
  {
    key: "currentTime",
    title: "获取当前时间",
    description: "获取当前的日期和时间信息",
    icon: "Clock",
  },
];

// All tool keys for convenience
export const ALL_TOOL_KEYS: ToolKey[] = TOOL_REGISTRY.map((t) => t.key);

// Get filtered tools based on enabled keys
export function getFilteredTools(enabledKeys: ToolKey[]) {
  const filtered = {} as Record<string, (typeof tools)[ToolKey]>;
  for (const key of enabledKeys) {
    if (tools[key]) {
      filtered[key] = tools[key];
    }
  }
  return filtered;
}
