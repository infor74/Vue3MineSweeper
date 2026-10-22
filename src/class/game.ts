import Cell from "@class/cell";
import { GameLevel, type GameLevelConfig } from "@class/game-level";
import { CellLocation, initMines } from "@utils/utils";
import { SFCWithInstall } from "element-plus/es/utils/vue/typescript";
import { IElMessageBox } from "element-plus/es/components/message-box/src/message-box.type";


/** 当前对局所处的阶段。 */
export enum GameStatus {
  /** 棋盘已生成，但尚未首次有效点击。 */
  Ready = "ready",
  /** 已首次点击并布雷，对局正在进行。 */
  Playing = "playing",
  /** 对局已经结束（胜利或失败）。 */
  Ended = "ended",
}

export default class Game {
  // 当前对局的难度、棋盘、首击状态和计时数据。
  // id: string;
  level: GameLevelConfig = GameLevel.normal;
  grid: Cell[][] = [];
  /** 当前游戏状态；用于区分未开始、进行中和已结束。 */
  status: GameStatus = GameStatus.Ready;
  firstClicked: boolean = false;
  /* mines count */
  unflaggedMineLocations: CellLocation[] = [];
  unmarkMines: number = 0;

  messageBox: SFCWithInstall<IElMessageBox>;

  timerId: number | null = null;
  timerSeconds: number = 0;

  constructor(
      level: GameLevelConfig = GameLevel.easy,
      messageBox: SFCWithInstall<IElMessageBox>,
  ) {
    // this.id = `MineSweeper-${new Date().getTime()}`;
    this.level = level;
    this.messageBox = messageBox;

    this.generateGrid();
  }
  // 避免重复创建计时器。
  startTimer() {
    if (this.timerId !== null) return;
    this.timerId = window.setInterval(() => {
      this.timerSeconds += 1;
    }, 1000);
  }
  stopTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // 游戏开始
  start() {
    this.status = GameStatus.Playing;
    this.startTimer();
  }

  // 游戏结束
  stop() {
    this.status = GameStatus.Ended;
    this.stopTimer();
  }

  // 建立新棋盘，并重置“尚未首次点击”的状态。
  generateGrid() {
    // console.log("Generating gird...")
    this.firstClicked = false;
    let { r, c } = this.level;
    this.grid = Array.from(
        { length: r },
        (row, i) => Array.from(
            { length: c },
            (column, j) => {
              return new Cell([ i, j ], [ r, c ]);
            },
        ),
    );
    // console.log("Grid generated")
  }

  // 仅在首次有效点击时布雷；目标格被排除，因此首击不会踩雷。
  generateMines(targetCell: Cell) {
    if (this.firstClicked) return;
    this.firstClicked = true;
    // const totalCellsCount = this.grid.flat().length;
    const safeCells = new Set([
      `${targetCell.r},${targetCell.c}`,
      // 如果需要排除首次点击格子周围的8个格子, 则开启此行
      // ...targetCell.adjacentCells.map(([r, c]) => `${r},${c}`),
    ]);
    // 从除安全格以外的位置随机选雷，再为所有格子统计邻雷数。
    const availableCells = this.grid
        .flat()
        .filter(cell => !safeCells.has(`${cell.r},${cell.c}`))
        .map(cell => [ cell.r, cell.c ] as [ number, number ]);
    // console.log(`Total cells: ${totalCellsCount}`, `Available cells: ${availableCells.length}`);
    // // 生成地雷坐标
    const mines = initMines(availableCells, this.level.m);
    // console.log("Mines", mines);
    this.grid.forEach((row, rowIndex) => {
      mines.forEach(([ r, c ]) => {
        if (rowIndex === r) {
          row[c].isMine = true;
        }
      });
    });
    // 记录每个格子周围地雷数
    this.grid.flat().forEach((cell) => {
      cell.adjacentCells.forEach(([ adjacentCellX, adjacentCellY ]) => {
        if (mines.some(([ mineR, mineC ]) => (
            mineR === adjacentCellX && mineC === adjacentCellY
        ))) {
          cell.adjacentMines += 1;
        }
      });
    });
    // 初始化剩余雷数显示和记录所使用的计数。
    const flaggedCells = this.grid.flat().filter(cell => cell.mark === "flag");
    this.unmarkMines = mines.length - flaggedCells.length;
    this.unflaggedMineLocations = mines.filter(([ mineR, mineC ]) => (
      this.grid[mineR][mineC].mark !== "flag"
    ));
    // console.log(mines, this.grid);
    this.start();
    if (this.unflaggedMineLocations.length === 0) {
      this.victory();
    }
  }

  // 成片打开格子的逻辑
  // 迭代展开空白区域；使用队列避免递归，旗子格会被跳过。
  expandCells(cells: Cell[] = []) {
    let pointer = 0;
    while (pointer < cells.length) {
      const cell = cells[pointer++];
      if (!cell.opened && cell.mark !== "flag") {
        cell.open();

        if (cell.adjacentMines === 0) {
          for (const [ _r, _c ] of cell.adjacentCells) {
            const _cell = this.grid[_r]?.[_c];
            if (!_cell) continue;
            cells.push(_cell);
          }
        }
      }
    }
  }

  // 踩雷时停止计时，并在失败提示确认后重置对局。
  over() {
    this.stop();
    // alert('GAME OVER')
    this.messageBox.alert(
        "GAME OVER",
        {
          center: true,
          confirmButtonText: "再来一局",
          callback: () => {
            this.reset();
          },
        }).then();
  }

  // 胜负条件由调用方决定；此处仅显示胜利提示并停止计时。
  victory() {
    if (this.status === GameStatus.Ended) return;
    this.stop();
    alert("VICTORY");
  }

  // 清理计时和计数，再生成尚未布雷的新棋盘。
  reset() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.unflaggedMineLocations = [];
    this.unmarkMines = 0;
    this.status = GameStatus.Ready;
    this.generateGrid();
  }
}
