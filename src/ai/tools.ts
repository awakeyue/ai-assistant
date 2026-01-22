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

export const gomokuTool = {
  gomoku: createTool({
    description:
      "Start a Gomoku (Five in a Row) game. Use this tool when the user wants to play Gomoku, 五子棋, or similar board games where players take turns placing pieces to get five in a row.",
    inputSchema: z.object({
      playerColor: z
        .enum(["black", "white"])
        .optional()
        .describe("The color the user wants to play as. Default is black."),
    }),
    execute: async ({ playerColor = "black" }) => {
      // Return data that will be used to render the Gomoku component
      return {
        game: "gomoku" as const,
        playerColor,
        message: `Let's play Gomoku! You are playing as ${playerColor === "black" ? "黑棋 (Black)" : "白棋 (White)"}. Click on the board to place your piece.`,
      };
    },
  }),
};

export const tools = {
  gomokuGame: gomokuTool.gomoku,
};
