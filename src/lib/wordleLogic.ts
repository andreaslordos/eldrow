import { RowSpec, Chain, ProgressMode } from './types';

// Pattern encoding utilities
export function encodeTrits(trits: number[]): number {
  let code = 0;
  let mul = 1;
  for (const t of trits) {
    code += t * mul;
    mul *= 3;
  }
  return code;
}

export function decodeTrits(code: number): number[] {
  const trits: number[] = [];
  let c = code;
  for (let i = 0; i < 5; i++) {
    trits.push(c % 3);
    c = Math.floor(c / 3);
  }
  return trits;
}

// Wordle scoring: compute pattern code for guess against answer
export function score(guess: string, answer: string): number {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();

  const trits = [0, 0, 0, 0, 0];
  const remain: Record<string, number> = {};

  // Count letters in answer
  for (const ch of a) {
    remain[ch] = (remain[ch] || 0) + 1;
  }

  // First pass: mark greens
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) {
      trits[i] = 2;
      remain[g[i]]--;
    }
  }

  // Second pass: mark yellows
  for (let i = 0; i < 5; i++) {
    if (trits[i] === 0 && (remain[g[i]] || 0) > 0) {
      trits[i] = 1;
      remain[g[i]]--;
    }
  }

  return encodeTrits(trits);
}

// Check if word matches a partial pattern with '*' wildcards
function matchesPartialPattern(word: string, pattern: string): boolean {
  if (word.length !== pattern.length) return false;
  for (let i = 0; i < word.length; i++) {
    if (pattern[i] !== '*' && word[i] !== pattern[i].toLowerCase()) {
      return false;
    }
  }
  return true;
}

// Constraint types for progress modes
interface Constraints {
  fixedPositions: Map<number, string>;
  forbiddenPositions: Map<string, Set<number>>;
  requiredCounts: Map<string, number>;
}

function deriveConstraintsFromRows(
  placedRows: Array<{ guess: string; code: number }>,
  mode: ProgressMode
): Constraints {
  const fixedPositions = new Map<number, string>();
  const forbiddenPositions = new Map<string, Set<number>>();
  const requiredCounts = new Map<string, number>();

  if (mode !== 'hard' && mode !== 'strict') {
    return { fixedPositions, forbiddenPositions, requiredCounts };
  }

  const rowsToUse = mode === 'hard' ? placedRows.slice(-1) : placedRows;

  for (const { guess, code } of rowsToUse) {
    const trits = decodeTrits(code);
    const perRowCounts = new Map<string, number>();

    for (let i = 0; i < 5; i++) {
      const ch = guess[i];
      if (trits[i] === 2) {
        // Green: fixed position
        fixedPositions.set(i, ch);
        perRowCounts.set(ch, (perRowCounts.get(ch) || 0) + 1);
      } else if (trits[i] === 1) {
        // Yellow: forbidden at this position, but required somewhere
        if (!forbiddenPositions.has(ch)) {
          forbiddenPositions.set(ch, new Set());
        }
        forbiddenPositions.get(ch)!.add(i);
        perRowCounts.set(ch, (perRowCounts.get(ch) || 0) + 1);
      }
    }

    // Update required counts (max across considered rows)
    for (const [ch, count] of perRowCounts) {
      if (count > (requiredCounts.get(ch) || 0)) {
        requiredCounts.set(ch, count);
      }
    }
  }

  return { fixedPositions, forbiddenPositions, requiredCounts };
}

function guessSatisfiesConstraints(
  guess: string,
  constraints: Constraints
): boolean {
  const { fixedPositions, forbiddenPositions, requiredCounts } = constraints;

  // Check fixed positions (greens)
  for (const [i, ch] of fixedPositions) {
    if (guess[i] !== ch) return false;
  }

  // Check forbidden positions (yellows can't be at same spot)
  for (const [ch, bads] of forbiddenPositions) {
    for (const i of bads) {
      if (guess[i] === ch) return false;
    }
  }

  // Check required letter counts
  const freq = new Map<string, number>();
  for (const ch of guess) {
    freq.set(ch, (freq.get(ch) || 0) + 1);
  }
  for (const [ch, count] of requiredCounts) {
    if ((freq.get(ch) || 0) < count) return false;
  }

  return true;
}

export class WordleReverser {
  private guessWords: string[];
  private answerWords: string[];
  private weirdWords: string[];
  private guessSet: Set<string>;
  private answerSet: Set<string>;
  private weirdSet: Set<string>;

  constructor(
    guessWords: string[],
    answerWords: string[],
    weirdWords: string[] = []
  ) {
    this.guessWords = guessWords.filter(w => w.length === 5 && /^[a-z]+$/i.test(w)).map(w => w.toLowerCase());
    this.answerWords = answerWords.filter(w => w.length === 5 && /^[a-z]+$/i.test(w)).map(w => w.toLowerCase());
    this.guessSet = new Set(this.guessWords);
    this.answerSet = new Set(this.answerWords);

    // Weird words that aren't in the main list
    const guessSetCopy = this.guessSet;
    this.weirdWords = weirdWords
      .filter(w => w.length === 5 && /^[a-z]+$/i.test(w))
      .map(w => w.toLowerCase())
      .filter(w => !guessSetCopy.has(w));
    this.weirdSet = new Set(this.weirdWords);
  }

  // Filter possible answers based on known guesses and their patterns
  filterAnswers(rows: RowSpec[]): string[] {
    const known = rows
      .filter(r => r.guess && !r.guess.includes('*'))
      .map(r => ({ guess: r.guess!.toLowerCase(), code: r.patternCode }));

    if (known.length === 0) {
      return [...this.answerWords];
    }

    return this.answerWords.filter(a => {
      for (const { guess, code } of known) {
        if (score(guess, a) !== code) return false;
      }
      return true;
    });
  }

  // Build buckets: pattern code -> list of words that produce that pattern
  private buildBucketsForAnswer(answer: string): Map<number, string[]> {
    const buckets = new Map<number, string[]>();
    for (const w of this.guessWords) {
      const code = score(w, answer);
      if (!buckets.has(code)) {
        buckets.set(code, []);
      }
      buckets.get(code)!.push(w);
    }
    return buckets;
  }

  private buildWeirdBucketsForAnswer(answer: string): Map<number, string[]> {
    const buckets = new Map<number, string[]>();
    for (const w of this.weirdWords) {
      const code = score(w, answer);
      if (!buckets.has(code)) {
        buckets.set(code, []);
      }
      buckets.get(code)!.push(w);
    }
    return buckets;
  }

  private getRowCandidates(
    rows: RowSpec[],
    answer: string,
    buckets: Map<number, string[]>,
    weirdBuckets: Map<number, string[]> | null,
    weirdAllowedRows: Set<number> | null
  ): string[][] {
    const rowCandidates: string[][] = [];

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];

      if (r.guess) {
        const g = r.guess.toLowerCase();

        if (g.includes('*')) {
          // Partial pattern with wildcards
          const bucketWords = buckets.get(r.patternCode) || [];
          let matching = bucketWords.filter(w => matchesPartialPattern(w, g));

          if (weirdBuckets && weirdAllowedRows?.has(idx)) {
            const weirdBucketWords = weirdBuckets.get(r.patternCode) || [];
            const weirdMatching = weirdBucketWords.filter(w => matchesPartialPattern(w, g));
            matching = [...matching, ...weirdMatching];
          }

          rowCandidates.push(matching);
        } else {
          // Full word specified
          const isInGuessSet = this.guessSet.has(g);
          const isInWeirdSet = weirdAllowedRows?.has(idx) && this.weirdSet.has(g);

          if (score(g, answer) === r.patternCode && (isInGuessSet || isInWeirdSet)) {
            rowCandidates.push([g]);
          } else {
            rowCandidates.push([]);
          }
        }
      } else {
        // No guess specified - use all words in bucket
        let cands = [...(buckets.get(r.patternCode) || [])];

        if (weirdBuckets && weirdAllowedRows?.has(idx)) {
          cands = [...cands, ...(weirdBuckets.get(r.patternCode) || [])];
        }

        rowCandidates.push(cands);
      }
    }

    return rowCandidates;
  }

  *enumerateChains(
    rows: RowSpec[],
    answerOfDay: string,
    progressMode: ProgressMode = 'none',
    noRepeat: boolean = true,
    useWeirdFallback: boolean = true,
    maxSolutions?: number
  ): Generator<Chain> {
    const a = answerOfDay.toLowerCase();

    // Verify answer is consistent with any specified guesses
    for (const r of rows) {
      if (r.guess && !r.guess.includes('*')) {
        if (score(r.guess.toLowerCase(), a) !== r.patternCode) {
          return; // Inconsistent
        }
      }
    }

    let solutionsEmitted = 0;
    const buckets = this.buildBucketsForAnswer(a);
    const weirdBuckets = this.weirdSet.size > 0 ? this.buildWeirdBucketsForAnswer(a) : null;

    // First try without weird words
    let rowCandidates = this.getRowCandidates(rows, a, buckets, null, null);

    // Check which rows have no candidates
    const emptyRows = new Set<number>();
    rowCandidates.forEach((cands, i) => {
      if (cands.length === 0) emptyRows.add(i);
    });

    // Configurations to try
    const weirdConfigsToTry: (Set<number> | null)[] = [null];

    if (emptyRows.size > 0 && useWeirdFallback && this.weirdSet.size > 0) {
      weirdConfigsToTry.push(emptyRows);
    }

    let foundSolution = false;

    for (const weirdAllowedRows of weirdConfigsToTry) {
      if (foundSolution && weirdAllowedRows !== null) break;

      rowCandidates = this.getRowCandidates(rows, a, buckets, weirdBuckets, weirdAllowedRows);

      if (rowCandidates.some(cands => cands.length === 0)) continue;

      // Order rows for search
      const rowIndices = rows.map((_, i) => i);
      const orderedIndices = progressMode === 'none'
        ? [...rowIndices].sort((a, b) => rowCandidates[a].length - rowCandidates[b].length)
        : rowIndices; // Chronological for hard/strict

      const placed: Array<{ guess: string; code: number; rowIndex: number }> = [];
      const used = new Set<string>();

      function* dfs(k: number): Generator<Chain> {
        if (maxSolutions !== undefined && solutionsEmitted >= maxSolutions) return;

        if (k === orderedIndices.length) {
          // Found a complete chain
          const byRow = new Map(placed.map(p => [p.rowIndex, p.guess]));
          const guesses = rowIndices.map(i => byRow.get(i)!);
          yield { answer: a, guesses };
          solutionsEmitted++;
          foundSolution = true;
          return;
        }

        const i = orderedIndices[k];
        const cands = rowCandidates[i];

        // Build constraints based on progress mode
        const priorRows = placed
          .filter(p => p.rowIndex < i)
          .map(p => ({ guess: p.guess, code: rows[p.rowIndex].patternCode }));
        const constraints = deriveConstraintsFromRows(priorRows, progressMode);

        for (const w of cands) {
          if (noRepeat && used.has(w)) continue;
          if (progressMode !== 'none' && !guessSatisfiesConstraints(w, constraints)) continue;

          placed.push({ guess: w, code: rows[i].patternCode, rowIndex: i });
          used.add(w);
          yield* dfs(k + 1);
          used.delete(w);
          placed.pop();
        }
      }

      yield* dfs(0);
    }
  }
}
