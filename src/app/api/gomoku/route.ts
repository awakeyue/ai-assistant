import { generateText } from "ai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { ModelExtraOptions } from "@/types/chat";

// Cell states type
type CellState = null | "black" | "white";
type BoardState = CellState[][];

interface GomokuRequest {
  board: BoardState;
  modelId: string;
  aiColor: "black" | "white";
}

const BOARD_SIZE = 15;

// Directions for checking lines: horizontal, vertical, two diagonals
const DIRECTIONS = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal \
  [1, -1], // diagonal /
];

// Pattern scores for evaluation
const SCORES = {
  FIVE: 100000, // Win
  OPEN_FOUR: 10000, // Unstoppable
  FOUR: 1000, // Must block
  OPEN_THREE: 500, // Very dangerous
  THREE: 100, // Needs attention
  OPEN_TWO: 50,
  TWO: 10,
  ONE: 1,
};

// Check if position is valid
function isValidPos(row: number, col: number): boolean {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

// Count consecutive pieces in one direction
function countInDirection(
  board: BoardState,
  row: number,
  col: number,
  dr: number,
  dc: number,
  player: CellState,
): { count: number; blocked: boolean; spaces: number } {
  let count = 0;
  let spaces = 0;
  let blocked = false;
  let r = row + dr;
  let c = col + dc;

  // Count consecutive pieces
  while (isValidPos(r, c) && board[r][c] === player) {
    count++;
    r += dr;
    c += dc;
  }

  // Check if blocked at the end
  if (!isValidPos(r, c) || (board[r][c] !== null && board[r][c] !== player)) {
    blocked = true;
  } else if (board[r][c] === null) {
    spaces++;
    // Check one more space for patterns like XX_X
    const nr = r + dr;
    const nc = c + dc;
    if (isValidPos(nr, nc) && board[nr][nc] === player) {
      // There's a piece after the space - count it
      let extraCount = 1;
      let er = nr + dr;
      let ec = nc + dc;
      while (isValidPos(er, ec) && board[er][ec] === player) {
        extraCount++;
        er += dr;
        ec += dc;
      }
      count += extraCount;
    }
  }

  return { count, blocked, spaces };
}

// Analyze a line pattern for a position
function analyzePattern(
  board: BoardState,
  row: number,
  col: number,
  player: CellState,
): number {
  let totalScore = 0;

  for (const [dr, dc] of DIRECTIONS) {
    // Count in positive direction
    const pos = countInDirection(board, row, col, dr, dc, player);
    // Count in negative direction
    const neg = countInDirection(board, row, col, -dr, -dc, player);

    const totalCount = pos.count + neg.count + 1; // +1 for the current position
    const bothBlocked = pos.blocked && neg.blocked;
    const oneBlocked = pos.blocked || neg.blocked;

    // Score based on pattern
    if (totalCount >= 5) {
      totalScore += SCORES.FIVE;
    } else if (totalCount === 4) {
      if (!oneBlocked) {
        totalScore += SCORES.OPEN_FOUR; // Open four - unstoppable
      } else if (!bothBlocked) {
        totalScore += SCORES.FOUR; // Four with one end blocked
      }
    } else if (totalCount === 3) {
      if (!oneBlocked) {
        totalScore += SCORES.OPEN_THREE; // Open three
      } else if (!bothBlocked) {
        totalScore += SCORES.THREE; // Three with one end blocked
      }
    } else if (totalCount === 2) {
      if (!oneBlocked) {
        totalScore += SCORES.OPEN_TWO;
      } else if (!bothBlocked) {
        totalScore += SCORES.TWO;
      }
    } else if (totalCount === 1 && !bothBlocked) {
      totalScore += SCORES.ONE;
    }
  }

  return totalScore;
}

// Find the best move using minimax-like evaluation
function findBestMove(
  board: BoardState,
  aiColor: "black" | "white",
): { row: number; col: number; score: number } | null {
  const playerColor = aiColor === "black" ? "white" : "black";
  let bestMove: { row: number; col: number; score: number } | null = null;

  // Get all empty positions near existing pieces
  const candidates: { row: number; col: number }[] = [];
  const checked = new Set<string>();

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] !== null) {
        // Add nearby empty positions
        for (let dr = -2; dr <= 2; dr++) {
          for (let dc = -2; dc <= 2; dc++) {
            const nr = row + dr;
            const nc = col + dc;
            const key = `${nr},${nc}`;
            if (
              isValidPos(nr, nc) &&
              board[nr][nc] === null &&
              !checked.has(key)
            ) {
              candidates.push({ row: nr, col: nc });
              checked.add(key);
            }
          }
        }
      }
    }
  }

  // If no candidates (empty board), place in center
  if (candidates.length === 0) {
    return { row: 7, col: 7, score: 0 };
  }

  for (const { row, col } of candidates) {
    // Simulate placing AI piece
    board[row][col] = aiColor;
    const aiScore = analyzePattern(board, row, col, aiColor);
    board[row][col] = null;

    // Simulate placing opponent piece (to evaluate threat)
    board[row][col] = playerColor;
    const threatScore = analyzePattern(board, row, col, playerColor);
    board[row][col] = null;

    // Combined score: prioritize attack, but also defend
    // Attack bonus is slightly higher to prefer winning over blocking
    const totalScore = aiScore * 1.1 + threatScore;

    if (!bestMove || totalScore > bestMove.score) {
      bestMove = { row, col, score: totalScore };
    }
  }

  return bestMove;
}

// Find immediate winning move or must-block move
function findCriticalMove(
  board: BoardState,
  aiColor: "black" | "white",
): { row: number; col: number; reason: string } | null {
  const playerColor = aiColor === "black" ? "white" : "black";

  // Get all empty positions
  const emptyPositions: { row: number; col: number }[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (board[row][col] === null) {
        emptyPositions.push({ row, col });
      }
    }
  }

  // First: Check if AI can win immediately
  for (const { row, col } of emptyPositions) {
    board[row][col] = aiColor;
    if (checkFiveInARow(board, row, col, aiColor)) {
      board[row][col] = null;
      return { row, col, reason: "WIN" };
    }
    board[row][col] = null;
  }

  // Second: Check if opponent can win - must block!
  for (const { row, col } of emptyPositions) {
    board[row][col] = playerColor;
    if (checkFiveInARow(board, row, col, playerColor)) {
      board[row][col] = null;
      return { row, col, reason: "BLOCK_WIN" };
    }
    board[row][col] = null;
  }

  // Third: Check for AI open four opportunity
  for (const { row, col } of emptyPositions) {
    board[row][col] = aiColor;
    if (hasOpenFour(board, row, col, aiColor)) {
      board[row][col] = null;
      return { row, col, reason: "CREATE_OPEN_FOUR" };
    }
    board[row][col] = null;
  }

  // Fourth: Block opponent's open three
  for (const { row, col } of emptyPositions) {
    board[row][col] = playerColor;
    if (hasOpenFour(board, row, col, playerColor)) {
      board[row][col] = null;
      return { row, col, reason: "BLOCK_OPEN_FOUR" };
    }
    board[row][col] = null;
  }

  return null;
}

// Check for five in a row
function checkFiveInARow(
  board: BoardState,
  row: number,
  col: number,
  player: CellState,
): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;

    // Count in positive direction
    for (let i = 1; i < 5; i++) {
      const nr = row + dr * i;
      const nc = col + dc * i;
      if (isValidPos(nr, nc) && board[nr][nc] === player) {
        count++;
      } else {
        break;
      }
    }

    // Count in negative direction
    for (let i = 1; i < 5; i++) {
      const nr = row - dr * i;
      const nc = col - dc * i;
      if (isValidPos(nr, nc) && board[nr][nc] === player) {
        count++;
      } else {
        break;
      }
    }

    if (count >= 5) return true;
  }

  return false;
}

// Check if position creates an open four (four with both ends open)
function hasOpenFour(
  board: BoardState,
  row: number,
  col: number,
  player: CellState,
): boolean {
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let openEnds = 0;

    // Count in positive direction
    let r = row + dr;
    let c = col + dc;
    while (isValidPos(r, c) && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (isValidPos(r, c) && board[r][c] === null) {
      openEnds++;
    }

    // Count in negative direction
    r = row - dr;
    c = col - dc;
    while (isValidPos(r, c) && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (isValidPos(r, c) && board[r][c] === null) {
      openEnds++;
    }

    // Open four: 4 pieces with at least one open end
    // Or 4+ pieces with both ends open
    if (count >= 4 && openEnds >= 1) {
      return true;
    }
  }

  return false;
}

// Convert board to readable string for AI (kept for debugging)
function boardToString(board: BoardState): string {
  const size = board.length;
  let result = "   ";

  for (let i = 0; i < size; i++) {
    result += String.fromCharCode(65 + i) + " ";
  }
  result += "\n";

  for (let row = 0; row < size; row++) {
    result += String(row + 1).padStart(2, " ") + " ";
    for (let col = 0; col < size; col++) {
      const cell = board[row][col];
      if (cell === "black") {
        result += "● ";
      } else if (cell === "white") {
        result += "○ ";
      } else {
        result += ". ";
      }
    }
    result += "\n";
  }

  return result;
}

// Parse AI response to get coordinates
function parseAIResponse(
  response: string,
): { row: number; col: number } | null {
  const patterns = [
    /([A-Oa-o])\s*[,\s]?\s*(\d{1,2})/,
    /(\d{1,2})\s*[,\s]?\s*([A-Oa-o])/,
    /\(([A-Oa-o])\s*,\s*(\d{1,2})\)/,
    /\((\d{1,2})\s*,\s*([A-Oa-o])\)/,
  ];

  for (const pattern of patterns) {
    const match = response.match(pattern);
    if (match) {
      let col: number, row: number;

      if (/[A-Oa-o]/.test(match[1])) {
        col = match[1].toUpperCase().charCodeAt(0) - 65;
        row = parseInt(match[2], 10) - 1;
      } else {
        row = parseInt(match[1], 10) - 1;
        col = match[2].toUpperCase().charCodeAt(0) - 65;
      }

      if (row >= 0 && row < 15 && col >= 0 && col < 15) {
        return { row, col };
      }
    }
  }

  return null;
}

export async function POST(req: Request) {
  try {
    const { board, modelId, aiColor }: GomokuRequest = await req.json();

    // Get current user
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // CRITICAL: First check for must-play moves using rule engine
    const criticalMove = findCriticalMove(board, aiColor);
    if (criticalMove) {
      console.log("Critical move found:", criticalMove);
      return NextResponse.json({
        row: criticalMove.row,
        col: criticalMove.col,
        debug: {
          source: "rule-engine",
          reason: criticalMove.reason,
        },
      });
    }

    // Use rule-based evaluation to find best move
    const bestMove = findBestMove(board, aiColor);

    // Try to get LLM suggestion as well (optional enhancement)
    let llmMove: { row: number; col: number } | null = null;

    try {
      const modelConfig = await prisma.userModel.findFirst({
        where: { id: modelId, OR: [{ userId: user.id }, { isPublic: true }] },
      });

      if (modelConfig) {
        const apiKey = decryptApiKey(modelConfig.apiKey);
        const modelName = "ai_gomoku";
        const model = createOpenAICompatible({
          baseURL: modelConfig.baseURL,
          apiKey: apiKey,
          name: modelName,
        });

        const boardString = boardToString(board);
        const aiColorName = aiColor === "black" ? "黑棋(●)" : "白棋(○)";
        const playerColorName = aiColor === "black" ? "白棋(○)" : "黑棋(●)";

        const prompt = `你是一个五子棋AI高手。

当前棋盘（15x15），●=黑棋，○=白棋，.=空位：
${boardString}

你执${aiColorName}，对手执${playerColorName}。

分析要点：
1. 检查是否有己方四连可以赢棋
2. 检查对手是否有三连或四连需要阻挡
3. 寻找能形成活三、双活三的位置
4. 只能在空位(.)落子

请只回复坐标（如H8），不要其他内容。`;

        console.log("LLM prompt:", prompt);

        const result = await generateText({
          model: model(modelConfig.modelId),
          prompt,
          maxOutputTokens: 20,
          providerOptions: {
            [modelName]: (modelConfig.extraOptions as ModelExtraOptions) || {},
          },
        });

        const responseText = result.text.trim();
        llmMove = parseAIResponse(responseText);

        // Validate LLM move
        if (llmMove && board[llmMove.row][llmMove.col] !== null) {
          llmMove = null;
        }

        console.log("LLM suggested:", responseText, "parsed:", llmMove);
      }
    } catch (error) {
      console.warn("LLM suggestion failed, using rule engine only:", error);
    }

    // Compare LLM move with rule-based best move
    // If LLM move is valid and has good score, consider using it
    let finalMove = bestMove;

    if (llmMove && bestMove) {
      // Evaluate LLM's suggestion
      board[llmMove.row][llmMove.col] = aiColor;
      const llmScore = analyzePattern(board, llmMove.row, llmMove.col, aiColor);
      board[llmMove.row][llmMove.col] = null;

      // Only use LLM move if it's reasonably good (at least 80% of best move score)
      if (llmScore >= bestMove.score * 0.8) {
        finalMove = { ...llmMove, score: llmScore };
      }
    }

    if (!finalMove) {
      return NextResponse.json(
        { error: "No valid moves available" },
        { status: 400 },
      );
    }

    return NextResponse.json({
      row: finalMove.row,
      col: finalMove.col,
      debug: {
        source: "rule-engine",
        score: finalMove.score,
        llmSuggestion: llmMove,
      },
    });
  } catch (error) {
    console.error("Gomoku AI error:", error);
    return NextResponse.json(
      { error: "Failed to generate AI move" },
      { status: 500 },
    );
  }
}
