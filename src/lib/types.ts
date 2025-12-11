// Color values: 0 = gray (absent), 1 = yellow (present), 2 = green (correct)
export type ColorValue = 0 | 1 | 2;

export interface TileState {
  letter: string; // '' or 'a'-'z'
  color: ColorValue;
}

export type GridState = TileState[][];

export interface RowSpec {
  patternCode: number;
  guess: string | null; // null or '*'-containing pattern or full word
}

export interface Chain {
  answer: string;
  guesses: string[];
}

export type ProgressMode = 'none' | 'hard' | 'strict';

export interface EnumerateOptions {
  answerOfDay: string;
  progressMode: ProgressMode;
  noRepeat: boolean;
  useWeirdFallback: boolean;
  maxSolutions?: number;
}
