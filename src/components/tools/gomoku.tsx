"use client";

import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";
import { useModelStore } from "@/store/chat";
import { cn } from "@/lib/utils";

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

// Check for winner
const checkWinner = (
  board: BoardState,
  row: number,
  col: number,
  player: "black" | "white",
): boolean => {
  const directions = [
    [0, 1], // horizontal
    [1, 0], // vertical
    [1, 1], // diagonal down-right
    [1, -1], // diagonal down-left
  ];

  for (const [dr, dc] of directions) {
    let count = 1;

    // Check positive direction
    for (let i = 1; i < 5; i++) {
      const nr = row + dr * i;
      const nc = col + dc * i;
      if (
        nr >= 0 &&
        nr < BOARD_SIZE &&
        nc >= 0 &&
        nc < BOARD_SIZE &&
        board[nr][nc] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    // Check negative direction
    for (let i = 1; i < 5; i++) {
      const nr = row - dr * i;
      const nc = col - dc * i;
      if (
        nr >= 0 &&
        nr < BOARD_SIZE &&
        nc >= 0 &&
        nc < BOARD_SIZE &&
        board[nr][nc] === player
      ) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) return true;
  }

  return false;
};

// Check for draw
const checkDraw = (board: BoardState): boolean => {
  return board.every((row) => row.every((cell) => cell !== null));
};

// Cell component - memoized for performance
const Cell = memo(
  ({
    state,
    onClick,
    isLastMove,
    disabled,
    isWinningCell,
  }: {
    state: CellState;
    onClick: () => void;
    isLastMove: boolean;
    disabled: boolean;
    isWinningCell?: boolean;
  }) => {
    return (
      <div
        className={cn(
          "relative flex aspect-square cursor-pointer items-center justify-center",
          disabled && "cursor-not-allowed",
        )}
        onClick={disabled ? undefined : onClick}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-gray-400 dark:bg-gray-500" />
          <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-gray-400 dark:bg-gray-500" />
        </div>

        {/* Chess piece */}
        {state && (
          <div
            className={cn(
              "relative z-10 aspect-square w-[85%] rounded-full shadow-md transition-all duration-200",
              state === "black"
                ? "bg-gray-900 shadow-gray-600 dark:bg-gray-800"
                : "border border-gray-300 bg-white shadow-gray-400 dark:border-gray-400",
              isLastMove && "ring-2 ring-blue-500 ring-offset-1",
              isWinningCell &&
                "animate-pulse ring-2 ring-green-500 ring-offset-1",
            )}
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
  playerColor = "black",
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
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [winningCells, setWinningCells] = useState<
    { row: number; col: number }[]
  >([]);

  const { currentModelId } = useModelStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const aiColor = playerColor === "black" ? "white" : "black";

  // Get winning cells for highlighting
  const getWinningCells = useCallback(
    (
      board: BoardState,
      row: number,
      col: number,
      player: "black" | "white",
    ) => {
      const directions = [
        [0, 1],
        [1, 0],
        [1, 1],
        [1, -1],
      ];

      for (const [dr, dc] of directions) {
        const cells: { row: number; col: number }[] = [{ row, col }];

        // Check positive direction
        for (let i = 1; i < 5; i++) {
          const nr = row + dr * i;
          const nc = col + dc * i;
          if (
            nr >= 0 &&
            nr < BOARD_SIZE &&
            nc >= 0 &&
            nc < BOARD_SIZE &&
            board[nr][nc] === player
          ) {
            cells.push({ row: nr, col: nc });
          } else {
            break;
          }
        }

        // Check negative direction
        for (let i = 1; i < 5; i++) {
          const nr = row - dr * i;
          const nc = col - dc * i;
          if (
            nr >= 0 &&
            nr < BOARD_SIZE &&
            nc >= 0 &&
            nc < BOARD_SIZE &&
            board[nr][nc] === player
          ) {
            cells.push({ row: nr, col: nc });
          } else {
            break;
          }
        }

        if (cells.length >= 5) return cells;
      }

      return [];
    },
    [],
  );

  // Call AI to make a move
  const makeAIMove = useCallback(
    async (currentBoard: BoardState) => {
      if (!currentModelId) {
        console.error("No model selected");
        return;
      }

      setIsAIThinking(true);

      try {
        const response = await fetch("/api/gomoku", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            board: currentBoard,
            modelId: currentModelId,
            aiColor: aiColor,
          }),
        });

        if (!response.ok) {
          throw new Error("AI request failed");
        }

        const data = await response.json();
        const { row, col } = data;

        // Validate move
        if (currentBoard[row][col] !== null) {
          console.error("AI returned invalid move");
          return;
        }

        // Place AI piece
        const newBoard = currentBoard.map((r, i) =>
          i === row ? r.map((c, j) => (j === col ? aiColor : c)) : r,
        );

        setBoard(newBoard);
        setLastMove({ row, col });

        // Check for winner
        if (checkWinner(newBoard, row, col, aiColor)) {
          setGameStatus(aiColor === "black" ? "black-wins" : "white-wins");
          setWinningCells(getWinningCells(newBoard, row, col, aiColor));
        } else if (checkDraw(newBoard)) {
          setGameStatus("draw");
        } else {
          setCurrentPlayer(playerColor);
        }
      } catch (error) {
        console.error("AI move error:", error);
      } finally {
        setIsAIThinking(false);
      }
    },
    [currentModelId, aiColor, playerColor, getWinningCells],
  );

  // Handle cell click
  const handleCellClick = useCallback(
    (row: number, col: number) => {
      // Ignore if game is over, cell is occupied, AI is thinking, or not player's turn
      if (
        gameStatus !== "playing" ||
        board[row][col] !== null ||
        isAIThinking ||
        currentPlayer !== playerColor
      ) {
        return;
      }

      // Place player piece
      const newBoard = board.map((r, i) =>
        i === row ? r.map((c, j) => (j === col ? playerColor : c)) : r,
      );

      setBoard(newBoard);
      setLastMove({ row, col });

      // Check for winner
      if (checkWinner(newBoard, row, col, playerColor)) {
        setGameStatus(playerColor === "black" ? "black-wins" : "white-wins");
        setWinningCells(getWinningCells(newBoard, row, col, playerColor));
        return;
      }

      // Check for draw
      if (checkDraw(newBoard)) {
        setGameStatus("draw");
        return;
      }

      // Switch to AI
      setCurrentPlayer(aiColor);
    },
    [
      board,
      currentPlayer,
      gameStatus,
      isAIThinking,
      playerColor,
      aiColor,
      getWinningCells,
    ],
  );

  // Trigger AI move when it's AI's turn
  useEffect(() => {
    if (
      gameStatus === "playing" &&
      currentPlayer === aiColor &&
      !isAIThinking
    ) {
      makeAIMove(board);
    }
  }, [currentPlayer, aiColor, gameStatus, isAIThinking, makeAIMove, board]);

  // Reset game
  const handleReset = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer("black");
    setLastMove(null);
    setGameStatus("playing");
    setIsAIThinking(false);
    setWinningCells([]);
  }, []);

  const isWinningCell = useCallback(
    (row: number, col: number) => {
      return winningCells.some((c) => c.row === row && c.col === col);
    },
    [winningCells],
  );

  const isPlayerTurn =
    currentPlayer === playerColor && gameStatus === "playing";

  return (
    <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-gray-200 bg-linear-to-b from-amber-50 to-amber-100 p-3 shadow-lg sm:gap-4 sm:p-4 md:max-w-lg dark:border-gray-700 dark:from-amber-900/20 dark:to-amber-800/20">
      {/* Game header */}
      <div className="flex w-full items-center justify-between">
        <h3 className="text-base font-semibold text-gray-800 sm:text-lg dark:text-gray-200">
          AI五子棋
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs sm:text-sm"
          disabled={isAIThinking}
        >
          <RotateCcw size={14} />
          重新开始
        </Button>
      </div>

      {/* Status indicator */}
      <div className="flex w-full items-center justify-center gap-3 rounded-lg bg-white/60 px-4 py-2.5 shadow-sm backdrop-blur-sm dark:bg-gray-800/60">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "h-5 w-5 rounded-full shadow-sm transition-all duration-300",
              currentPlayer === "black"
                ? "bg-gray-900 ring-2 ring-gray-400/50 dark:bg-gray-700 dark:ring-gray-500/50"
                : "border-2 border-gray-300 bg-white ring-2 ring-gray-200/50 dark:border-gray-400 dark:ring-gray-600/50",
            )}
          />
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {currentPlayer === "black" ? "黑棋" : "白棋"}
          </span>
        </div>

        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

        {isAIThinking ? (
          <div className="flex items-center gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="font-medium text-blue-600 dark:text-blue-400">
              AI 思考中...
            </span>
          </div>
        ) : (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
              isPlayerTurn
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400",
            )}
          >
            {isPlayerTurn ? "你的回合" : "AI 回合"}
          </span>
        )}
      </div>

      {/* Game board - responsive sizing, full width on small screens */}
      <div
        ref={boardRef}
        className="aspect-square w-full overflow-hidden rounded-lg p-1.5 shadow-inner sm:p-2"
        style={{
          background:
            "linear-gradient(to bottom right, rgb(245 208 140), rgb(217 180 110))",
        }}
      >
        <div
          className={cn(
            "grid gap-0",
            isAIThinking && "pointer-events-none opacity-80",
          )}
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
                disabled={
                  isAIThinking ||
                  gameStatus !== "playing" ||
                  currentPlayer !== playerColor
                }
                isWinningCell={isWinningCell(rowIndex, colIndex)}
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
              ? playerColor === "black"
                ? "🎉 恭喜你获胜！"
                : "😢 AI 获胜！"
              : gameStatus === "white-wins"
                ? playerColor === "white"
                  ? "🎉 恭喜你获胜！"
                  : "😢 AI 获胜！"
                : "🤝 平局！"}
          </p>
        </div>
      )}

      {/* Instructions */}
      <p className="px-2 text-center text-[11px] leading-relaxed text-gray-500 sm:text-xs dark:text-gray-400">
        你执{playerColor === "black" ? "黑棋(●)" : "白棋(○)"}
        ，点击棋盘空白处落子，五子连珠获胜
      </p>
    </div>
  );
}

export default Gomoku;
