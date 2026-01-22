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
    "获取当前的日期和时间信息。当用户询问现在几点、今天日期、当前时间等相关问题时使用此工具。",
  inputSchema: z.object({
    timezone: z
      .string()
      .optional()
      .describe(
        "时区名称，如 'Asia/Shanghai'、'America/New_York'。默认使用服务器时区。",
      ),
  }),
  execute: async ({ timezone }) => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      timeZone: timezone || undefined,
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };

    const formatted = now.toLocaleString("zh-CN", options);
    const resolvedTimezone =
      timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

    return {
      datetime: now.toISOString(),
      timezone: resolvedTimezone,
      timestamp: now.getTime(),
      formatted,
    };
  },
});

export const tools = {
  gomokuGame: gomokuTool,
  currentTime: currentTimeTool,
};
