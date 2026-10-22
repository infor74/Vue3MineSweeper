import { beforeEach, describe, expect, it, vi } from "vitest";
import Game from "../src/class/game";
import { GameLevel, GameLevelConfig } from "../src/class/game-level";
import { GameStatus } from "../src/class/game-status";

const messageBox = {
  alert: vi.fn().mockResolvedValue(undefined),
} as unknown as ConstructorParameters<typeof Game>[1];

function createGame(level: GameLevelConfig = GameLevel.easy) {
  return new Game(level, messageBox);
}

describe("Game", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("window", {
      setInterval: vi.fn(() => 1),
      clearInterval: vi.fn(),
    });
  });

  it("keeps the first clicked cell safe and calculates adjacent mine counts", () => {
    const game = createGame();
    const firstCell = game.grid[4][4];

    game.generateMines(firstCell);

    expect(firstCell.isMine).toBe(false);
    expect(game.grid.flat().filter(cell => cell.isMine)).toHaveLength(game.level.m);
    for (const cell of game.grid.flat()) {
      const expectedAdjacentMines = cell.adjacentCells.filter(([ r, c ]) => (
        game.grid[r][c].isMine
      )).length;
      expect(cell.adjacentMines).toBe(expectedAdjacentMines);
    }
  });

  it("accounts for flags placed before mine generation", () => {
    const game = createGame();
    const flaggedCell = game.grid[0][0];
    flaggedCell.handleRightClick(game);

    game.generateMines(game.grid[4][4]);

    expect(game.unmarkMines).toBe(game.level.m - 1);
    expect(game.unflaggedMineLocations.some(([ r, c ]) => (
      r === flaggedCell.r && c === flaggedCell.c
    ))).toBe(false);
  });

  it("preserves question marks reached by expansion but opens a clicked question cell", () => {
    const game = createGame({ r: 3, c: 3, m: 0, text: "Test" });
    const center = game.grid[1][1];
    const questionCell = game.grid[0][0];
    const flaggedCell = game.grid[0][1];
    questionCell.handleRightClick(game);
    questionCell.handleRightClick(game);
    flaggedCell.handleRightClick(game);

    game.expandCells([ center ]);

    expect(questionCell.opened).toBe(false);
    expect(flaggedCell.opened).toBe(false);
    expect(center.opened).toBe(true);

    game.expandCells([ questionCell ]);

    expect(questionCell.opened).toBe(true);
    expect(questionCell.mark).toBe("none");
  });

  it("wins only after every real mine is flagged", () => {
    const game = createGame();
    game.generateMines(game.grid[4][4]);

    for (const [ r, c ] of game.grid.flatMap(row => row)
      .filter(cell => cell.isMine)
      .map(({ r, c }) => [ r, c ] as const)) {
      game.grid[r][c].handleRightClick(game);
    }

    expect(game.status).toBe(GameStatus.Ended);
    expect(game.unflaggedMineLocations).toHaveLength(0);
    expect(messageBox.alert).toHaveBeenCalledWith("VICTORY", { center: true });
  });

  it("clears board state and counters when reset", () => {
    const game = createGame();
    game.generateMines(game.grid[4][4]);
    game.timerSeconds = 12;

    game.reset();

    expect(game.status).toBe(GameStatus.Ready);
    expect(game.firstClicked).toBe(false);
    expect(game.timerSeconds).toBe(0);
    expect(game.unmarkMines).toBe(0);
    expect(game.unflaggedMineLocations).toEqual([]);
    expect(game.grid.flat().every(cell => !cell.isMine && !cell.opened)).toBe(true);
  });
});
