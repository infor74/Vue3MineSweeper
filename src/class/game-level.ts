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

export type GameLevelConfig = typeof GameLevel[keyof typeof GameLevel];
