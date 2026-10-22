import Cell from "@class/cell";
import { GameLevel, type GameLevelConfig } from "@class/game-level";
import { GameStatus } from "@class/game-status";
import { initMines, type CellLocation } from "@utils/utils";
import { SFCWithInstall } from "element-plus/es/utils/vue/typescript";
import { IElMessageBox } from "element-plus/es/components/message-box/src/message-box.type";


export default class Game {
  // 当前对局的难度、棋盘、首击状态和计时数据。
  // id: string;
  level: GameLevelConfig = GameLevel.normal;
  grid: Cell[][] = [];
  /** 当前游戏状态；用于区分未开始、进行中和已结束。 */
  status: GameStatus = GameStatus.Ready;
  /** 首次有效左键点击后设为 true，防止重复布雷。 */
  firstClicked: boolean = false;
  /* mines count */
  /** 尚未被正确插旗的真实地雷坐标。 */
  unflaggedMineLocations: CellLocation[] = [];
  /** 剩余地雷显示值：总雷数减去所有旗子数，错误旗子也计入。 */
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
    // 排除首次点击的格子，保证首击安全。
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
    // 从每颗地雷累加周围格子的数字，避免逐格重复搜索所有地雷。
    mines.forEach(([ mineR, mineC ]) => {
      const mineCell = this.grid[mineR][mineC];
      mineCell.isMine = true;
      mineCell.adjacentCells.forEach(([ adjacentR, adjacentC ]) => {
        this.grid[adjacentR][adjacentC].adjacentMines += 1;
      });
    });
    // 首次布雷前放置的旗子也计入剩余地雷显示值。
    const flaggedCells = this.grid.flat().filter(cell => cell.mark === "flag");
    this.unmarkMines = mines.length - flaggedCells.length;
    this.unflaggedMineLocations = mines.filter(([ mineR, mineC ]) => (
      this.grid[mineR][mineC].mark !== "flag"
    ));
    // console.log(mines, this.grid);
    this.start();
    // 首次点击前若已正确标记所有地雷，则布雷后立即判胜。
    if (this.unflaggedMineLocations.length === 0) {
      this.victory();
    }
  }

  // 成片打开格子的逻辑
  // 迭代展开空白区域；使用队列避免递归，旗子格会被跳过。
  expandCells(cells: Cell[] = []) {
    // 直接点击的问号格可以打开；空白展开遇到的问号格保持标记。
    const initialCells = new Set(cells);
    let pointer = 0;
    while (pointer < cells.length) {
      const cell = cells[pointer++];
      if (!cell.opened && cell.mark !== "flag" && (initialCells.has(cell) || cell.mark === "none")) {
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
    this.messageBox.alert("VICTORY", { center: true });
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
