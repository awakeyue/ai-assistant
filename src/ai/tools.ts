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
    return {
      // Formatted date string for display
      formattedDate: now.toLocaleDateString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }),
      // Time components for display
      hours: now.getHours().toString().padStart(2, "0"),
      minutes: now.getMinutes().toString().padStart(2, "0"),
      seconds: now.getSeconds().toString().padStart(2, "0"),
      // ISO string for reference
      timestamp: now.toISOString(),
    };
  },
});

export const svgPreviewTool = createTool({
  title: "SVG 图形预览",
  description:
    "生成并实时预览 SVG 矢量图。当用户要求画图、生成图形、创建图标、绘制矢量图时使用此工具。例如：'画一只猫'、'生成一个心形图标'、'画一个带动画的loading图标'。",
  inputSchema: z.object({
    code: z.string().describe("要渲染的 SVG 代码，必须以 <svg 开头"),
    title: z.string().optional().describe("可选的标题，用于描述生成的内容"),
  }),
  execute: async ({ code, title }) => {
    return {
      code,
      title: title || "SVG 图形",
    };
  },
});

export const tools = {
  gomokuGame: gomokuTool,
  currentTime: currentTimeTool,
  svgPreview: svgPreviewTool,
};
