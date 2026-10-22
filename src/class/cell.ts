import type Game from '@class/game'
import { GameStatus } from '@class/game-status'
import { recordAdjacentCellsLocation } from "@utils/utils";

enum CellMark {
    None = 'none',
    Flag = 'flag',
    Question = 'question',
}

export default class Cell {
    r = NaN;
    c = NaN;
    // flag = false;
    mark: CellMark = CellMark.None;
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
        this.mark = CellMark.None;
    }

    handleLeftClick(game: Game) {
        if (game.status === GameStatus.Ended) return
        // console.log(this.r, this.c);
        if (this.mark === CellMark.Flag || this.opened) return
        // 棣栨鐐瑰嚮, 鏇存柊鏍囪瘑, 鐢熸垚鍦伴浄
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
        if (game.status === GameStatus.Ended || this.opened) return

        // 按当前标记状态轮转；只有布雷后才更新剩余雷数和真实地雷记录。
        switch (this.mark) {
            case CellMark.None:
                // 无标记切换为旗子，减少未标记雷数。
                this.mark = CellMark.Flag;
                if (!game.firstClicked) return

                game.unmarkMines -= 1;
                if (this.isMine) {
                    // 正确标记真实地雷后，从待确认地雷列表中移除。
                    game.unflaggedMineLocations = game.unflaggedMineLocations.filter(([ r, c ]) => (
                        r !== this.r || c !== this.c
                    ));
                    if (game.unflaggedMineLocations.length === 0) game.victory();
                }
                break;

            case CellMark.Flag:
                // 旗子切换为问号，恢复未标记雷数。
                this.mark = CellMark.Question;
                if (!game.firstClicked) return

                game.unmarkMines += 1;
                if (this.isMine) {
                    // 取消真实地雷上的旗子后，重新加入待确认列表。
                    game.unflaggedMineLocations.push([ this.r, this.c ]);
                }
                break;

            case CellMark.Question:
                // 问号切换为空标记，不影响计数。
                this.mark = CellMark.None;
                break;
        }
    }
}
