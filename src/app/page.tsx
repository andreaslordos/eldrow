'use client';

import { useState, useCallback, useEffect } from 'react';
import Grid from '@/components/Grid';
import OptionsPanel from '@/components/OptionsPanel';
import Results from '@/components/Results';
import HowItWorksModal from '@/components/HowItWorksModal';
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
  const [weirdFallback, setWeirdFallback] = useState(true);

  // Results state
  const [chains, setChains] = useState<Chain[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Modal state
  const [showHowItWorks, setShowHowItWorks] = useState(false);

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

  // Validate grid against progress mode rules
  const validateProgressMode = useCallback((lastRow: number): string | null => {
    if (progressMode === 'none') return null;

    // For hard/strict mode: if a position is green in row N, it must be green in subsequent rows
    // Hard: only check against immediate previous row
    // Strict: check against all previous rows

    for (let rowIdx = 1; rowIdx <= lastRow; rowIdx++) {
      const checkFromRow = progressMode === 'hard' ? rowIdx - 1 : 0;

      for (let checkRow = checkFromRow; checkRow < rowIdx; checkRow++) {
        for (let col = 0; col < 5; col++) {
          // If previous row has green at this position
          if (grid[checkRow][col].color === 2) {
            // Current row must also have green at this position
            if (grid[rowIdx][col].color !== 2) {
              const modeName = progressMode === 'hard' ? 'Hard' : 'Strict';
              return `${modeName} mode violation: Row ${rowIdx + 1} must have green in position ${col + 1} (locked from Row ${checkRow + 1})`;
            }
          }
        }
      }
    }

    return null;
  }, [grid, progressMode]);

  const handleCalculate = useCallback(() => {
    if (!reverser || answer.length !== 5) return;

    setValidationError(null);
    setIsCalculating(true);
    setHasCalculated(true);

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      try {
        // Convert grid to RowSpecs
        // Check if any row is all green (successful guess = won the game)
        let winningRow = -1;
        for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
          if (grid[rowIdx].every(tile => tile.color === 2)) {
            winningRow = rowIdx;
            break;
          }
        }

        // If there's a winning row, process up to and including it
        // If no winning row (user failed), process all 6 rows
        let lastActiveRow: number;
        if (winningRow !== -1) {
          lastActiveRow = winningRow;
        } else {
          // No all-green row = user failed, need all 6 guesses
          // But only if they've set up at least one row
          let hasAnyColor = false;
          for (let rowIdx = 0; rowIdx < 6; rowIdx++) {
            if (grid[rowIdx].some(tile => tile.color !== 0)) {
              hasAnyColor = true;
              break;
            }
          }
          lastActiveRow = hasAnyColor ? 5 : -1;
        }

        // Validate progress mode before calculating
        const error = validateProgressMode(lastActiveRow);
        if (error) {
          setValidationError(error);
          setChains([]);
          setIsCalculating(false);
          return;
        }

        const rows: RowSpec[] = [];

        // Process all rows from 0 to lastActiveRow (inclusive)
        for (let rowIdx = 0; rowIdx <= lastActiveRow; rowIdx++) {
          const row = grid[rowIdx];

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

        // Enumerate chains
        const foundChains: Chain[] = [];
        const maxSolutions = 10000; // Increased limit for infinite scroll

        for (const chain of reverser.enumerateChains(
          rows,
          answer,
          progressMode,
          true, // noRepeat always true
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
  }, [reverser, grid, answer, progressMode, weirdFallback, validateProgressMode]);

  return (
    <main className="min-h-screen bg-background flex flex-col items-center py-8 px-4">
      {/* Header */}
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-white tracking-wider">
          ELDROW
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Reverse Wordle Solver
        </p>
        <button
          onClick={() => setShowHowItWorks(true)}
          className="text-xs text-gray-400 hover:text-white transition-colors underline underline-offset-2 mt-2"
        >
          How does this work?
        </button>
      </header>

      {/* How It Works Modal */}
      <HowItWorksModal
        isOpen={showHowItWorks}
        onClose={() => setShowHowItWorks(false)}
      />

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
        validationError={validationError}
      />
    </main>
  );
}
