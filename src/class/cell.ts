import Game from '@class/game'
import { recordAdjacentCellsLocation } from "@utils/utils";

type CellMark = 'none' | 'flag' | 'question'

export default class Cell {
    r = NaN;
    c = NaN;
    // flag = false;
    mark: CellMark = 'none';
    isMine = false;
    opened = false;
    adjacentCells: [ number, number ][] = [];
    adjacentMines: number = 0;

    constructor(
        [ r, c ]: [ number, number ],
        [ maxR, maxC ]: [ number, number ]
    ) {
        this.r = r;
        this.c = c;

        this.adjacentCells = recordAdjacentCellsLocation([ r, c ], [ maxR, maxC ])
    }

    open() {
        this.opened = true;
        this.mark = 'none';
    }

    handleLeftClick(game: Game) {
        // console.log(this.r, this.c);
        if (this.mark === 'flag' || this.opened) return
        // 首次点击, 更新标识, 生成地雷
        if (!game.firstClicked) {
            game.generateMines(this);
        }
        if (this.isMine) {
            game.over();
            return
        } else {
            game.expandCells([ this ]);
            return
        }
    }

    handleRightClick(game: Game) {
        if (this.opened) {
            return
        }
        const markList: CellMark[] = [ 'none', 'flag', 'question' ];
        let currentIndex = markList.findIndex(item => item === this.mark);
        if (currentIndex === markList.length - 1) {
            currentIndex = -1;
        }
        this.mark = markList[currentIndex + 1]
        if (!game.firstClicked) return
        if (game.totalMines > 0 && this.mark === 'flag') {
            game.totalMines -= 1
            if (game.totalMines === 0) {
                game.victory();
                return;
            }
        } else if (this.mark === 'question') {
            game.totalMines += 1
        }
    }
}