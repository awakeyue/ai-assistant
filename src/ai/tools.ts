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

export const tools = {
  gomokuGame: gomokuTool,
};
