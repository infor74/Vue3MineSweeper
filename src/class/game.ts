import Cell from "@class/cell";
import { initMines } from "@utils/utils";
import { SFCWithInstall } from "element-plus/es/utils/vue/typescript";
import { IElMessageBox } from "element-plus/es/components/message-box/src/message-box.type";

export const GameLevel = {
  easy: {
    r: 9, c: 9, m: 10, text: "Easy",
  },
  normal: {
    r: 16, c: 16, m: 16, text: "Normal",
  },
  hard: {
    r: 16, c: 30, m: 30, text: "Hard",
  },
} as const;

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
  id: string;
  level: typeof GameLevel[keyof typeof GameLevel] = GameLevel.normal;
  grid: Cell[][] = [];
  /** 当前游戏状态；用于区分未开始、进行中和已结束。 */
  status: GameStatus = GameStatus.Ready;
  firstClicked: boolean = false;
  totalMines: number = 0;

  messageBox: SFCWithInstall<IElMessageBox>;

  timerId: number | null = null;
  timerSeconds: number = 0;

  constructor(
      level: typeof GameLevel[keyof typeof GameLevel] = GameLevel.easy,
      messageBox: SFCWithInstall<IElMessageBox>,
  ) {
    this.id = `MineSweeper-${new Date().getTime()}`;
    this.level = level;
    this.messageBox = messageBox;

    this.generateGrid();
  }

  // 游戏开始
  start() {
    this.status = GameStatus.Playing;
  }

  // 游戏结束
  end() {
    this.status = GameStatus.Ended;
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
    // 初始化剩余雷数显示所使用的计数。
    this.totalMines = mines.length;
    // console.log(mines, this.grid);
    // 开始计时
    this.startTimer();
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

  stopTimer() {
    if (this.timerId !== null) {
      window.clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  // 当前实现会在 timerId 为空时提前返回；请留意此处的启动条件。
  startTimer() {
    if (this.timerId == null) return;
    this.timerId = window.setInterval(() => {
      this.timerSeconds += 1;
    }, 1000);
  }

  // 踩雷时停止计时，并在失败提示确认后重置对局。
  over() {
    this.stopTimer();
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
    alert("VICTORY");
    this.stopTimer();
  }

  // 清理计时和计数，再生成尚未布雷的新棋盘。
  reset() {
    this.stopTimer();
    this.timerSeconds = 0;
    this.totalMines = 0;
    this.generateGrid();
  }
}