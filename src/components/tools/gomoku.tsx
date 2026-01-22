"use client";

import { useState, useCallback, memo } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

// Board size: 15x15 is standard for Gomoku
const BOARD_SIZE = 15;

// Cell states
type CellState = null | "black" | "white";

// Board type
type BoardState = CellState[][];

interface GomokuProps {
  // Optional initial state for future AI integration
  initialBoard?: BoardState;
  // Player color (user plays as black by default)
  playerColor?: "black" | "white";
}

// Create empty board
const createEmptyBoard = (): BoardState => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null));
};

// Cell component - memoized for performance
const Cell = memo(
  ({
    state,
    onClick,
    isLastMove,
  }: {
    state: CellState;
    onClick: () => void;
    isLastMove: boolean;
  }) => {
    return (
      <div
        className="relative flex h-6 w-6 cursor-pointer items-center justify-center sm:h-7 sm:w-7"
        onClick={onClick}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gray-400" />
          <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-gray-400" />
        </div>

        {/* Chess piece */}
        {state && (
          <div
            className={`relative z-10 h-5 w-5 rounded-full shadow-md sm:h-6 sm:w-6 ${
              state === "black"
                ? "bg-gray-900 shadow-gray-600"
                : "border border-gray-300 bg-white shadow-gray-400"
            } ${isLastMove ? "ring-2 ring-blue-500 ring-offset-1" : ""}`}
          />
        )}
      </div>
    );
  },
);
Cell.displayName = "Cell";

// Main Gomoku component
export function Gomoku({
  initialBoard,
  // playerColor = "black",
}: GomokuProps = {}) {
  const [board, setBoard] = useState<BoardState>(
    initialBoard || createEmptyBoard,
  );
  const [currentPlayer, setCurrentPlayer] = useState<"black" | "white">(
    "black",
  );
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [gameStatus, setGameStatus] = useState<
    "playing" | "black-wins" | "white-wins" | "draw"
  >("playing");

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      // Ignore if game is over or cell is occupied
      if (gameStatus !== "playing" || board[row][col] !== null) {
        return;
      }

      // Place piece
      const newBoard = board.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? currentPlayer : c)) : r,
      );

      setBoard(newBoard);
      setLastMove({ row, col });

      // For now, just switch turns (AI logic will be added later)
      setCurrentPlayer(currentPlayer === "black" ? "white" : "black");
    },
    [board, currentPlayer, gameStatus],
  );

  // Reset game
  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer("black");
    setLastMove(null);
    setGameStatus("playing");
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-gray-200 bg-linear-to-b from-amber-50 to-amber-100 p-4 shadow-lg dark:border-gray-700 dark:from-amber-900/20 dark:to-amber-800/20">
      {/* Game header */}
      <div className="flex w-full items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
          五子棋
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex items-center gap-1"
        >
          <RotateCcw size={14} />
          重新开始
        </Button>
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-gray-600 dark:text-gray-400">当前回合：</span>
        <div
          className={`h-4 w-4 rounded-full ${
            currentPlayer === "black"
              ? "bg-gray-900"
              : "border border-gray-300 bg-white"
          }`}
        />
        <span className="font-medium text-gray-800 dark:text-gray-200">
          {currentPlayer === "black" ? "黑棋" : "白棋"}
        </span>
      </div>

      {/* Game board */}
      <div
        className="overflow-hidden rounded-lg bg-amber-200 p-2 shadow-inner dark:bg-amber-700/50"
        style={{
          backgroundImage:
            "linear-gradient(to bottom right, rgb(245 208 140), rgb(217 180 110))",
        }}
      >
        <div
          className="grid gap-0"
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
        >
          {board.map((row, rowIndex) =>
            row.map((cell, colIndex) => (
              <Cell
                key={`${rowIndex}-${colIndex}`}
                state={cell}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                isLastMove={
                  lastMove?.row === rowIndex && lastMove?.col === colIndex
                }
              />
            )),
          )}
        </div>
      </div>

      {/* Game status message */}
      {gameStatus !== "playing" && (
        <div className="text-center">
          <p className="text-lg font-bold text-gray-800 dark:text-gray-200">
            {gameStatus === "black-wins"
              ? "🎉 黑棋获胜！"
              : gameStatus === "white-wins"
                ? "🎉 白棋获胜！"
                : "🤝 平局！"}
          </p>
        </div>
      )}

      {/* Instructions */}
      <p className="text-xs text-gray-500 dark:text-gray-400">
        点击棋盘空白处落子，五子连珠获胜
      </p>
    </div>
  );
}

export default Gomoku;
