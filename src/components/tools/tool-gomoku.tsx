"use client";

import { memo } from "react";
import { ToolUIPart } from "ai";
import { Gomoku, GomokuGameState } from "./gomoku";
import { useToolStateStore } from "@/store/tool-state-store";

// Extended output type that includes persisted game state
interface GomokuToolOutput {
  game: "gomoku";
  playerColor: "black" | "white";
  message: string;
  gameState?: GomokuGameState;
}

interface ToolGomokuGameProps {
  toolPart: ToolUIPart;
}

/**
 * Tool component for Gomoku (Five in a Row) game
 * Renders different states: loading, ready to play, or error
 */
export const ToolGomokuGame = memo(({ toolPart }: ToolGomokuGameProps) => {
  const { state, title, toolCallId } = toolPart;
  const updateToolState = useToolStateStore((state) => state.updateToolState);

  // Handle different tool states
  if (state === "input-available") {
    // Tool is being called, show loading state
    return (
      <div className="block-fade-in my-2 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2 text-sm text-blue-600 dark:border-blue-900/30 dark:bg-blue-950/10 dark:text-blue-400">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        <span>正在准备 {title}...</span>
      </div>
    );
  }

  if (state === "output-available") {
    const output = toolPart.output as GomokuToolOutput | undefined;
    const playerColor = output?.playerColor || "black";
    const initialGameState = output?.gameState;

    // Handle game state changes - wrap state in gameState key for persistence
    const handleStateChange = (newState: GomokuGameState) => {
      if (toolCallId) {
        updateToolState(toolCallId, { gameState: newState });
      }
    };

    return (
      <div className="block-fade-in my-3 flex w-full justify-center">
        <Gomoku
          playerColor={playerColor}
          initialState={initialGameState}
          onStateChange={handleStateChange}
        />
      </div>
    );
  }

  if (state === "output-error") {
    return (
      <div className="block-fade-in my-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-950/10">
        <div className="text-sm text-red-600 dark:text-red-400">
          工具调用失败: {title}
        </div>
      </div>
    );
  }

  // Other states
  return null;
});

ToolGomokuGame.displayName = "ToolGomokuGame";
