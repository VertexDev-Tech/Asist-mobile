import React from 'react';
import { View, StyleSheet } from 'react-native';

export type WolfPose = 'idle' | 'alert' | 'running' | 'celebrating' | 'sleeping';

const COLORS = {
  B: '#1a1a2e',
  D: '#2d2d44',
  W: '#e8e8f0',
  G: '#6b7280',
  C: '#00d4ff',
  K: '#0ea5e9',
  Y: '#fbbf24',
  P: '#f472b6',
  N: '#111827',
  A: '#9ca3af',
} as const;

type C = keyof typeof COLORS;
type PixelGrid = (C | null)[][];
const _ = null;

const baseIdle: PixelGrid = [
  /* 0*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
  /* 1*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'C', _, _, _, _, _],
  /* 2*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'C', 'B', 'B', _, _, _],
  /* 3*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'W', 'W', 'W', 'B', 'B', _, _],
  /* 4*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'W', 'C', 'C', 'W', 'B', 'B', _, _],
  /* 5*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'W', 'W', 'N', 'N', 'W', 'W', 'B', _, _],
  /* 6*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'W', 'W', 'W', 'W', 'W', 'W', 'B', _, _],
  /* 7*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', _, _],
  /* 8*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'B', 'D', 'D', 'C', 'C', 'K', 'K', 'D', 'D', 'B', 'B', _, _],
  /* 9*/ [_, _, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'D', 'D', 'D', 'C', 'W', 'C', 'C', 'W', 'D', 'D', 'B', 'B', _, _],
  /*10*/ [_, _, _, _, _, _, _, _, _, _, _, 'B', 'B', 'D', 'D', 'D', 'C', 'C', 'K', 'K', 'C', 'D', 'D', 'D', 'B', 'B', _, _],
  /*11*/ [_, _, _, _, _, _, _, _, _, _, 'B', 'B', 'D', 'D', 'D', 'D', 'D', 'C', 'C', 'C', 'D', 'D', 'D', 'D', 'B', 'B', _, _],
  /*12*/ [_, _, _, _, _, _, _, _, 'B', 'B', 'B', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'B', 'B', _, _],
  /*13*/ [_, _, _, _, _, _, 'B', 'B', 'W', 'W', 'W', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'D', 'B', 'B', _, _],
  /*14*/ [_, _, _, _, _, 'B', 'B', 'W', 'W', 'W', 'W', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', 'B', _, _, _],
  /*15*/ [_, _, _, _, _, 'B', _, _, 'B', 'B', _, _, 'B', 'B', _, _, 'B', 'B', _, _, 'B', 'B', _, _, 'B', _, _, _],
  /*16*/ [_, _, _, _, _, _, _, _, 'B', 'B', _, _, 'B', 'B', _, _, 'W', 'W', _, _, 'W', 'W', _, _, 'B', _, _, _],
  /*17*/ [_, _, _, _, _, _, _, _, 'W', 'W', _, _, 'W', 'W', _, _, 'W', 'W', _, _, 'W', 'W', _, _, 'W', _, _, _],
  /*18*/ [_, _, _, _, _, _, _, _, 'G', 'G', _, _, 'G', 'G', _, _, 'G', 'G', _, _, 'G', 'G', _, _, 'G', _, _, _],
  /*19*/ [_, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _, _],
];

const buildAlert = (): PixelGrid => {
  const g = baseIdle.map((r) => [...r]);
  g[0][21] = 'C';
  g[0][22] = 'C';
  g[1][20] = 'B';
  g[1][21] = 'B';
  g[1][22] = 'B';
  g[1][23] = 'B';
  g[1][24] = 'C';
  g[2][19] = 'B';
  g[2][25] = 'B';
  return g;
};

const buildRunning = (): PixelGrid => {
  const g = baseIdle.map((r) => [...r]);
  for (let r = 15; r <= 18; r++) {
    for (let c = 7; c <= 26; c++) {
      g[r][c] = _;
    }
  }
  g[15][23] = 'B';
  g[15][24] = 'B';
  g[16][24] = 'W';
  g[16][25] = 'W';
  g[17][25] = 'W';
  g[17][26] = 'W';
  g[18][25] = 'G';
  g[18][26] = 'G';

  g[15][19] = 'B';
  g[15][20] = 'B';
  g[16][17] = 'W';
  g[16][18] = 'W';
  g[17][17] = 'W';
  g[17][18] = 'W';
  g[18][17] = 'G';
  g[18][18] = 'G';

  g[15][7] = 'B';
  g[15][8] = 'B';
  g[16][6] = 'B';
  g[16][7] = 'B';
  g[17][5] = 'W';
  g[17][6] = 'W';
  g[18][5] = 'G';
  g[18][6] = 'G';

  g[15][13] = 'B';
  g[15][14] = 'B';
  g[16][13] = 'B';
  g[16][14] = 'B';
  g[17][13] = 'W';
  g[17][14] = 'W';
  g[18][13] = 'G';
  g[18][14] = 'G';

  g[12][7] = _;
  g[12][8] = _;
  g[13][5] = _;
  g[13][6] = _;
  g[14][5] = _;
  g[14][6] = _;
  g[14][7] = _;

  g[10][2] = 'W';
  g[10][3] = 'W';
  g[10][4] = 'W';
  g[10][5] = 'B';
  g[11][0] = 'W';
  g[11][1] = 'W';
  g[11][2] = 'W';
  g[11][3] = 'B';
  g[11][4] = 'B';
  g[11][5] = 'B';

  g[7][26] = 'C';
  g[7][27] = 'C';
  g[6][26] = 'C';
  g[5][27] = 'P';
  return g;
};

const buildCelebrating = (): PixelGrid => {
  const g = baseIdle.map((r) => [...r]);
  g[5][27] = 'P';
  g[6][26] = 'P';
  g[7][27] = 'Y';
  g[4][22] = 'C';
  g[4][23] = 'C';
  g[11][1] = 'A';
  g[11][2] = 'A';
  g[12][0] = 'A';
  g[12][1] = 'A';
  g[12][2] = 'A';
  g[13][1] = 'A';
  g[13][2] = 'A';
  g[13][3] = 'A';

  g[2][26] = 'Y';
  g[3][27] = 'Y';
  g[3][25] = 'Y';
  g[4][26] = 'Y';
  g[3][15] = 'C';
  g[4][14] = 'C';
  g[4][16] = 'C';
  g[5][15] = 'C';
  g[7][8] = 'Y';
  g[8][7] = 'C';
  g[8][9] = 'C';
  g[9][8] = 'Y';
  g[6][2] = 'C';
  g[5][3] = 'Y';
  g[6][4] = 'C';
  g[5][5] = 'Y';
  g[4][3] = 'C';
  return g;
};

const buildSleeping = (): PixelGrid => {
  const g: PixelGrid = Array(20)
    .fill(null)
    .map(() => Array(28).fill(_));

  for (let c = 17; c <= 22; c++) {
    g[17][c] = 'W';
    g[18][c] = 'G';
  }

  g[15][16] = 'B';
  g[15][17] = 'B';
  g[15][18] = 'W';
  g[15][19] = 'W';
  g[15][20] = 'W';
  g[15][21] = 'W';
  g[15][22] = 'N';
  g[14][15] = 'B';
  g[14][16] = 'B';
  g[14][17] = 'B';
  g[14][18] = 'W';
  g[14][19] = 'W';
  g[14][20] = 'W';
  g[13][15] = 'B';
  g[13][16] = 'B';
  g[13][17] = 'B';
  g[13][18] = 'B';
  g[12][15] = 'B';
  g[12][16] = 'B';
  g[11][15] = 'B';

  for (let c = 9; c <= 17; c++) g[16][c] = 'B';
  for (let c = 8; c <= 16; c++) g[15][c] = g[15][c] || 'D';
  for (let c = 7; c <= 15; c++) g[14][c] = g[14][c] || 'D';
  for (let c = 8; c <= 14; c++) g[13][c] = g[13][c] || 'C';
  for (let c = 9; c <= 13; c++) g[12][c] = g[12][c] || 'D';

  g[14][10] = 'W';
  g[14][11] = 'C';
  g[15][9] = 'W';
  g[15][10] = 'W';
  g[15][11] = 'W';
  g[15][12] = 'W';
  g[16][10] = 'W';
  g[15][13] = 'W';
  g[15][14] = 'C';

  g[14][6] = 'B';
  g[14][7] = 'B';
  g[15][5] = 'B';
  g[15][6] = 'B';
  g[15][7] = 'B';
  g[15][8] = 'B';
  g[16][5] = 'W';
  g[16][6] = 'W';
  g[16][7] = 'W';
  g[16][8] = 'W';

  g[10][3] = 'C';
  g[9][4] = 'C';
  g[8][3] = 'W';
  return g;
};

const POSES: Record<WolfPose, PixelGrid> = {
  idle: baseIdle,
  alert: buildAlert(),
  running: buildRunning(),
  celebrating: buildCelebrating(),
  sleeping: buildSleeping(),
};

interface PixelWolfProps {
  pose?: WolfPose;
  pixelSize?: number;
  flipHorizontal?: boolean;
}

export const PixelWolf: React.FC<PixelWolfProps> = ({
  pose = 'idle',
  pixelSize = 3.5,
  flipHorizontal = false,
}) => {
  const grid = POSES[pose] ?? baseIdle;
  const cols = 28;
  const rows = grid.length;
  const width = cols * pixelSize;
  const height = rows * pixelSize;

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          transform: [{ scaleX: flipHorizontal ? -1 : 1 }],
        },
      ]}
    >
      {grid.map((row, rIdx) => {
        const segments: { start: number; len: number; color: string }[] = [];
        let curColor: string | null = null;
        let start = 0;
        let len = 0;

        for (let cIdx = 0; cIdx < cols; cIdx++) {
          const key = row[cIdx];
          const color = key ? COLORS[key] : null;

          if (color === curColor) {
            if (color !== null) len++;
          } else {
            if (curColor !== null) {
              segments.push({ start, len, color: curColor });
            }
            curColor = color;
            start = cIdx;
            len = 1;
          }
        }
        if (curColor !== null) {
          segments.push({ start, len, color: curColor });
        }

        return (
          <View key={`row-${rIdx}`} style={[styles.row, { height: pixelSize, top: rIdx * pixelSize }]}>
            {segments.map((seg, sIdx) => (
              <View
                key={`seg-${sIdx}`}
                style={{
                  position: 'absolute',
                  left: seg.start * pixelSize,
                  width: seg.len * pixelSize,
                  height: pixelSize,
                  backgroundColor: seg.color,
                }}
              />
            ))}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
});

export default PixelWolf;
