/*
* 记录目标格子周围坐标
* */
export function recordAdjacentCellsLocation(
    [ r, c ]: [ number, number ],
    [ maxR, maxC ]: [ number, number ],
) {
  let currentRow = [];
  let nextRow = [];
  return [
    [ r - 1, c - 1 ], [ r - 1, c ], [ r - 1, c + 1 ],
    [ r, c - 1 ], [], [ r, c + 1 ],
    [ r + 1, c - 1 ], [ r + 1, c ], [ r + 1, c + 1 ],
  ].filter(([ _r, _c ]) => (
      _r >= 0 && _r < maxR && _c >= 0 && _c < maxC
  )) as [ number, number ][];
}

/*
* 洗牌算法
*/
function shuffle<T>(
    source: T[],
): T[] {
  const result = [ ...source ];
  for (let i = result.length - 1; i >= 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    [ result[i], result[j] ] = [ result[j], result[i] ];
  }
  return result;
}

/*
* 传入可用坐标[x,y]组成的二维数组
* 打乱顺序
* 再取前n项生成地雷
*/
type CellLocation = [ number, number ];

export function initMines(
    source: CellLocation[],
    n: number,
): CellLocation[] {
  const result = shuffle(source);
  // 截取, 根据坐标排序, 返回结果
  return result.slice(0, n)
      .sort((
          [ ax, ay ],
          [ bx, by ],
      ) => {
        if (ax !== bx) {
          return ax - bx;
        }
        return ay - by;
      });
}