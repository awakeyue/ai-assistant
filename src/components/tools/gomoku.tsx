"use client";

import { useState, useCallback, memo, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useModelStore } from "@/store/chat";
import { cn } from "@/lib/utils";

// Board size: 15x15 is standard for Gomoku
const BOARD_SIZE = 15;

// Cell states
type CellState = null | "black" | "white";

// Board type
type BoardState = CellState[][];

// Exported game state type for persistence
export interface GomokuGameState {
  board: BoardState;
  currentPlayer: "black" | "white";
  lastMove: { row: number; col: number } | null;
  gameStatus: "playing" | "black-wins" | "white-wins" | "draw";
  winningCells: { row: number; col: number }[];
}

interface GomokuProps {
  // Optional initial state for future AI integration
  initialBoard?: BoardState;
  // Player color (user plays as black by default)
  playerColor?: "black" | "white";
  // Initial game state from persisted data
  initialState?: GomokuGameState;
  // Callback to persist state changes
  onStateChange?: (state: GomokuGameState) => void;
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
    isFullscreen,
  }: {
    state: CellState;
    onClick: () => void;
    isLastMove: boolean;
    disabled: boolean;
    isWinningCell?: boolean;
    isFullscreen?: boolean;
  }) => {
    return (
      <div
        className={cn(
          "relative flex aspect-square cursor-pointer items-center justify-center transition-transform duration-150",
          disabled && "cursor-not-allowed",
          !disabled && "hover:scale-105 active:scale-95",
        )}
        onClick={disabled ? undefined : onClick}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute top-1/2 h-px w-full -translate-y-1/2 bg-amber-800/70 dark:bg-amber-200/60" />
          <div className="absolute left-1/2 h-full w-px -translate-x-1/2 bg-amber-800/70 dark:bg-amber-200/60" />
        </div>

        {/* Hover indicator for empty cells */}
        {!state && !disabled && (
          <div className="absolute z-5 aspect-square w-[70%] rounded-full bg-current opacity-0 transition-opacity duration-200 hover:opacity-10" />
        )}

        {/* Chess piece */}
        {state && (
          <div
            className={cn(
              "relative z-10 aspect-square rounded-full transition-all duration-200",
              isFullscreen ? "w-[80%]" : "w-[85%]",
              state === "black"
                ? "bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 shadow-lg shadow-gray-900/50 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 dark:shadow-black/50"
                : "border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-gray-100 shadow-lg shadow-gray-400/50 dark:border-gray-500 dark:from-gray-100 dark:via-gray-200 dark:to-gray-300",
              isLastMove &&
                "ring-2 ring-blue-500 ring-offset-1 dark:ring-blue-400 dark:ring-offset-amber-800/50",
              isWinningCell &&
                "animate-pulse ring-2 ring-green-500 ring-offset-1 dark:ring-green-400",
            )}
          >
            {/* Shine effect */}
            <div
              className={cn(
                "absolute top-[10%] left-[15%] h-[30%] w-[30%] rounded-full",
                state === "black"
                  ? "bg-gradient-to-br from-white/30 to-transparent"
                  : "bg-gradient-to-br from-white/80 to-transparent",
              )}
            />
          </div>
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
  initialState,
  onStateChange,
}: GomokuProps = {}) {
  // Initialize state from persisted data or defaults
  const [board, setBoard] = useState<BoardState>(
    () => initialState?.board || initialBoard || createEmptyBoard(),
  );
  const [currentPlayer, setCurrentPlayer] = useState<"black" | "white">(
    () => initialState?.currentPlayer || "black",
  );
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    () => initialState?.lastMove || null,
  );
  const [gameStatus, setGameStatus] = useState<
    "playing" | "black-wins" | "white-wins" | "draw"
  >(() => initialState?.gameStatus || "playing");
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [winningCells, setWinningCells] = useState<
    { row: number; col: number }[]
  >(() => initialState?.winningCells || []);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { currentModelId } = useModelStore();
  const boardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const aiColor = playerColor === "black" ? "white" : "black";

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, [isFullscreen]);

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        document.exitFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFullscreen]);

  // Persist state changes
  const persistState = useCallback(
    (updates: Partial<GomokuGameState>) => {
      if (!onStateChange) return;

      // Get current values and merge with updates
      const newState: GomokuGameState = {
        board: updates.board ?? board,
        currentPlayer: updates.currentPlayer ?? currentPlayer,
        lastMove: updates.lastMove !== undefined ? updates.lastMove : lastMove,
        gameStatus: updates.gameStatus ?? gameStatus,
        winningCells: updates.winningCells ?? winningCells,
      };

      onStateChange(newState);
    },
    [onStateChange, board, currentPlayer, lastMove, gameStatus, winningCells],
  );

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
          const newStatus = aiColor === "black" ? "black-wins" : "white-wins";
          const newWinningCells = getWinningCells(newBoard, row, col, aiColor);
          setGameStatus(newStatus);
          setWinningCells(newWinningCells);
          persistState({
            board: newBoard,
            lastMove: { row, col },
            gameStatus: newStatus,
            winningCells: newWinningCells,
            currentPlayer: playerColor,
          });
        } else if (checkDraw(newBoard)) {
          setGameStatus("draw");
          persistState({
            board: newBoard,
            lastMove: { row, col },
            gameStatus: "draw",
            currentPlayer: playerColor,
          });
        } else {
          setCurrentPlayer(playerColor);
          persistState({
            board: newBoard,
            lastMove: { row, col },
            currentPlayer: playerColor,
          });
        }
      } catch (error) {
        console.error("AI move error:", error);
      } finally {
        setIsAIThinking(false);
      }
    },
    [currentModelId, aiColor, playerColor, getWinningCells, persistState],
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
        const newStatus = playerColor === "black" ? "black-wins" : "white-wins";
        const newWinningCells = getWinningCells(
          newBoard,
          row,
          col,
          playerColor,
        );
        setGameStatus(newStatus);
        setWinningCells(newWinningCells);
        persistState({
          board: newBoard,
          lastMove: { row, col },
          gameStatus: newStatus,
          winningCells: newWinningCells,
          currentPlayer: aiColor,
        });
        return;
      }

      // Check for draw
      if (checkDraw(newBoard)) {
        setGameStatus("draw");
        persistState({
          board: newBoard,
          lastMove: { row, col },
          gameStatus: "draw",
          currentPlayer: aiColor,
        });
        return;
      }

      // Switch to AI
      setCurrentPlayer(aiColor);
      persistState({
        board: newBoard,
        lastMove: { row, col },
        currentPlayer: aiColor,
      });
    },
    [
      board,
      currentPlayer,
      gameStatus,
      isAIThinking,
      playerColor,
      aiColor,
      getWinningCells,
      persistState,
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
    const emptyBoard = createEmptyBoard();
    setBoard(emptyBoard);
    setCurrentPlayer("black");
    setLastMove(null);
    setGameStatus("playing");
    setIsAIThinking(false);
    setWinningCells([]);
    persistState({
      board: emptyBoard,
      currentPlayer: "black",
      lastMove: null,
      gameStatus: "playing",
      winningCells: [],
    });
  }, [persistState]);

  const isWinningCell = useCallback(
    (row: number, col: number) => {
      return winningCells.some((c) => c.row === row && c.col === col);
    },
    [winningCells],
  );

  const isPlayerTurn =
    currentPlayer === playerColor && gameStatus === "playing";

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border shadow-xl transition-all duration-300 sm:gap-4",
        isFullscreen
          ? "h-screen w-screen justify-center rounded-none border-none bg-gradient-to-br from-amber-100 via-amber-50 to-orange-100 p-6 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900"
          : "w-full border-amber-200/50 bg-gradient-to-br from-amber-50 via-white to-orange-50 p-3 sm:p-4 md:max-w-lg dark:border-gray-700 dark:from-gray-800/90 dark:via-gray-900 dark:to-gray-800/90",
      )}
    >
      {/* Decorative background pattern */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl opacity-30">
        <div className="absolute -top-8 -right-8 h-32 w-32 rounded-full bg-gradient-to-br from-orange-300 to-amber-400 blur-3xl dark:from-orange-600/30 dark:to-amber-500/30" />
        <div className="absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 blur-3xl dark:from-amber-600/30 dark:to-yellow-500/30" />
      </div>

      {/* Game header */}
      <div
        className={cn(
          "relative z-10 flex w-full items-center justify-between",
          isFullscreen && "max-w-2xl",
        )}
      >
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 shadow-md dark:from-amber-500 dark:to-orange-600">
            <span className="text-lg">⚫</span>
          </div>
          <h3 className="bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-base font-bold text-transparent sm:text-lg dark:from-amber-400 dark:to-orange-400">
            AI五子棋
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 border-amber-200 bg-white/80 text-xs backdrop-blur-sm transition-all hover:bg-amber-50 hover:shadow-md sm:text-sm dark:border-gray-600 dark:bg-gray-800/80 dark:hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">
              {isFullscreen ? "退出全屏" : "全屏"}
            </span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="flex items-center gap-1 border-amber-200 bg-white/80 text-xs backdrop-blur-sm transition-all hover:bg-amber-50 hover:shadow-md sm:text-sm dark:border-gray-600 dark:bg-gray-800/80 dark:hover:bg-gray-700"
            disabled={isAIThinking}
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">重新开始</span>
          </Button>
        </div>
      </div>

      {/* Status indicator */}
      <div
        className={cn(
          "relative z-10 flex w-full items-center justify-center gap-3 rounded-xl bg-white/70 px-4 py-3 shadow-lg backdrop-blur-md transition-all dark:bg-gray-800/70",
          isFullscreen && "max-w-2xl",
        )}
      >
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "h-6 w-6 rounded-full shadow-md transition-all duration-300",
              currentPlayer === "black"
                ? "bg-gradient-to-br from-gray-700 to-gray-900 ring-2 ring-amber-400/50 dark:from-gray-600 dark:to-gray-800 dark:ring-amber-500/50"
                : "border-2 border-gray-200 bg-gradient-to-br from-white to-gray-100 ring-2 ring-amber-300/50 dark:border-gray-500 dark:ring-amber-400/50",
            )}
          />
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            {currentPlayer === "black" ? "黑棋" : "白棋"}
          </span>
        </div>

        <div className="h-5 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent dark:via-gray-600" />

        {isAIThinking ? (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Loader2 className="h-5 w-5 animate-spin text-blue-500 dark:text-blue-400" />
              <div className="absolute inset-0 h-5 w-5 animate-ping rounded-full bg-blue-400/30" />
            </div>
            <span className="font-semibold text-blue-600 dark:text-blue-400">
              AI 思考中...
            </span>
          </div>
        ) : (
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase transition-all",
              isPlayerTurn
                ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md shadow-green-500/30 dark:from-green-500 dark:to-emerald-600"
                : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400",
            )}
          >
            {isPlayerTurn ? "你的回合" : "AI 回合"}
          </span>
        )}
      </div>

      {/* Game board - responsive sizing, full width on small screens */}
      <div
        ref={boardRef}
        className={cn(
          "relative z-10 aspect-square overflow-hidden rounded-xl p-2 shadow-2xl transition-all sm:p-3",
          isFullscreen ? "w-full max-w-2xl" : "w-full",
        )}
        style={{
          background:
            "var(--board-bg, linear-gradient(145deg, rgb(218 165 85), rgb(180 130 60)))",
          boxShadow:
            "inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.2), 0 8px 32px rgba(0,0,0,0.3)",
          // @ts-expect-error CSS custom property
          "--board-bg":
            "linear-gradient(145deg, rgb(218 165 85), rgb(180 130 60))",
        }}
      >
        {/* Dark mode board background override */}
        <div className="pointer-events-none absolute inset-0 hidden rounded-xl bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 dark:block" />
        {/* Wood grain texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20 mix-blend-overlay dark:opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(139, 90, 43, 0.3) 2px,
              rgba(139, 90, 43, 0.3) 4px
            )`,
          }}
        />

        <div
          className={cn(
            "relative grid gap-0",
            isAIThinking && "pointer-events-none opacity-80",
          )}
          style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
        >
          {/* Star points (traditional Gomoku board markers) */}
          {/* Standard 15x15 Gomoku has 5 star points: center (Tengen) + 4 corner stars */}
          {/* D4=(3,3), D12=(3,11), L4=(11,3), L12=(11,11), H8=(7,7) center */}
          {[
            { row: 7, col: 7 }, // Tengen (center)
            { row: 3, col: 3 }, // D4
            { row: 3, col: 11 }, // D12
            { row: 11, col: 3 }, // L4
            { row: 11, col: 11 }, // L12
          ].map(({ row, col }) => {
            // Don't render star if there's a piece on it
            if (board[row][col]) return null;

            // Calculate position at line intersections
            // Each cell is 1/BOARD_SIZE of the board, star should be at cell center
            const cellSize = 100 / BOARD_SIZE;
            const centerX = cellSize * (col + 0.5);
            const centerY = cellSize * (row + 0.5);

            return (
              <div
                key={`star-${row}-${col}`}
                className="pointer-events-none absolute z-20 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-900/80 dark:bg-amber-200/70"
                style={{
                  left: `${centerX}%`,
                  top: `${centerY}%`,
                }}
              />
            );
          })}
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
                isFullscreen={isFullscreen}
              />
            )),
          )}
        </div>
      </div>

      {/* Game status message */}
      {gameStatus !== "playing" && (
        <div
          className={cn(
            "relative z-10 w-full rounded-xl bg-white/80 py-4 text-center shadow-lg backdrop-blur-md dark:bg-gray-800/80",
            isFullscreen && "max-w-2xl",
          )}
        >
          <p className="text-xl font-bold">
            {gameStatus === "black-wins" ? (
              playerColor === "black" ? (
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  🎉 恭喜你获胜！
                </span>
              ) : (
                <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  😢 AI 获胜！
                </span>
              )
            ) : gameStatus === "white-wins" ? (
              playerColor === "white" ? (
                <span className="bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                  🎉 恭喜你获胜！
                </span>
              ) : (
                <span className="bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                  😢 AI 获胜！
                </span>
              )
            ) : (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                🤝 平局！
              </span>
            )}
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={handleReset}
            className="mt-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md hover:from-amber-600 hover:to-orange-600"
          >
            再来一局
          </Button>
        </div>
      )}

      {/* Instructions */}
      <p
        className={cn(
          "relative z-10 px-2 text-center text-[11px] leading-relaxed text-gray-600 sm:text-xs dark:text-gray-400",
          isFullscreen && "max-w-2xl text-sm",
        )}
      >
        你执{playerColor === "black" ? "黑棋(●)" : "白棋(○)"}
        ，点击棋盘空白处落子，五子连珠获胜
        {isFullscreen && (
          <span className="ml-2 text-gray-400 dark:text-gray-500">
            • 按 ESC 退出全屏
          </span>
        )}
      </p>
    </div>
  );
}

export default Gomoku;
