'use client';

import { useState, useCallback, useEffect } from 'react';
import Grid from '@/components/Grid';
import OptionsPanel from '@/components/OptionsPanel';
import Results from '@/components/Results';
import { GridState, TileState, ProgressMode, Chain, RowSpec } from '@/lib/types';
import { WordleReverser, encodeTrits } from '@/lib/wordleLogic';

// Import word lists
import answersData from '../../public/answers.json';
import validWordsData from '../../public/validWords.json';

// Initialize empty grid
const createEmptyGrid = (): GridState => {
  return Array(6)
    .fill(null)
    .map(() =>
      Array(5)
        .fill(null)
        .map((): TileState => ({ letter: '', color: 0 }))
    );
};

export default function Home() {
  // Grid state
  const [grid, setGrid] = useState<GridState>(createEmptyGrid);
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);

  // Options state
  const [answer, setAnswer] = useState('');
  const [progressMode, setProgressMode] = useState<ProgressMode>('strict');
  const [noRepeat, setNoRepeat] = useState(true);
  const [weirdFallback, setWeirdFallback] = useState(true);

  // Results state
  const [chains, setChains] = useState<Chain[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // WordleReverser instance
  const [reverser, setReverser] = useState<WordleReverser | null>(null);

  // Initialize reverser on mount
  useEffect(() => {
    const rev = new WordleReverser(
      answersData as string[],
      answersData as string[],
      validWordsData as string[]
    );
    setReverser(rev);
  }, []);

  const handleSelectionChange = useCallback((row: number, col: number) => {
    setSelectedRow(row);
    setSelectedCol(col);
  }, []);

  const handleCalculate = useCallback(() => {
    if (!reverser || answer.length !== 5) return;

    setIsCalculating(true);
    setHasCalculated(true);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        // Convert grid to RowSpecs
        // Only include rows that have at least one non-gray color
        const rows: RowSpec[] = [];

        for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
          const row = grid[rowIdx];
          const hasColor = row.some(tile => tile.color !== 0);

          if (hasColor) {
            // Build pattern code from colors
            const trits = row.map(tile => tile.color);
            const patternCode = encodeTrits(trits);

            // Build guess string (letters with '*' for empty)
            const hasAnyLetter = row.some(tile => tile.letter !== '');
            let guess: string | null = null;

            if (hasAnyLetter) {
              // If some letters are filled, create pattern with wildcards
              guess = row.map(tile => tile.letter || '*').join('');
            }

            rows.push({ patternCode, guess });
          }
        }

        // Enumerate chains
        const foundChains: Chain[] = [];
        const maxSolutions = 1000; // Limit to prevent browser hang

        for (const chain of reverser.enumerateChains(
          rows,
          answer,
          progressMode,
          noRepeat,
          weirdFallback,
          maxSolutions
        )) {
          foundChains.push(chain);
        }

        setChains(foundChains);
      } catch (error) {
        console.error('Error calculating chains:', error);
        setChains([]);
      } finally {
        setIsCalculating(false);
      }
    }, 50);
  }, [reverser, grid, answer, progressMode, noRepeat, weirdFallback]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white tracking-wider">
          ELDROW
        </h1>
        <p className="text-gray-500 text-center text-sm mt-1">
          Reverse Wordle Solver
        </p>
      </header>

      {/* Grid */}
      <Grid
        grid={grid}
        selectedRow={selectedRow}
        selectedCol={selectedCol}
        onGridChange={setGrid}
        onSelectionChange={handleSelectionChange}
      />

      {/* Instructions */}
      <div className="mt-4 mb-6 text-center text-gray-500 text-sm max-w-[350px]">
        <p>Click tiles to cycle colors. Type letters (optional). </p>
        <p>Use arrow keys to navigate.</p>
      </div>

      {/* Options Panel */}
      <OptionsPanel
        answer={answer}
        onAnswerChange={setAnswer}
        progressMode={progressMode}
        onProgressModeChange={setProgressMode}
        noRepeat={noRepeat}
        onNoRepeatChange={setNoRepeat}
        weirdFallback={weirdFallback}
        onWeirdFallbackChange={setWeirdFallback}
        onCalculate={handleCalculate}
        isCalculating={isCalculating}
      />

      {/* Results */}
      <Results
        chains={chains}
        isCalculating={isCalculating}
        hasCalculated={hasCalculated}
      />
    </main>
  );
}
