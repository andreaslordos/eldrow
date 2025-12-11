'use client';

import { useCallback, useEffect, useRef } from 'react';
import Tile from './Tile';
import { GridState, ColorValue } from '@/lib/types';

interface GridProps {
  grid: GridState;
  selectedRow: number;
  selectedCol: number;
  onGridChange: (grid: GridState) => void;
  onSelectionChange: (row: number, col: number) => void;
}

export default function Grid({
  grid,
  selectedRow,
  selectedCol,
  onGridChange,
  onSelectionChange,
}: GridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTileClick = useCallback(
    (row: number, col: number) => {
      onSelectionChange(row, col);
    },
    [onSelectionChange]
  );

  const handleColorChange = useCallback(
    (row: number, col: number, color: ColorValue) => {
      const newGrid = grid.map((r, ri) =>
        r.map((tile, ci) =>
          ri === row && ci === col ? { ...tile, color } : tile
        )
      );
      onGridChange(newGrid);
    },
    [grid, onGridChange]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isLetter = /^[a-zA-Z]$/.test(e.key);
      const isBackspace = e.key === 'Backspace';
      const isArrowKey = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key);
      const isTab = e.key === 'Tab';

      if (!isLetter && !isBackspace && !isArrowKey && !isTab) return;

      // Don't handle if focus is on an input element
      if (document.activeElement?.tagName === 'INPUT') return;

      e.preventDefault();

      if (isLetter) {
        // Type letter into current tile
        const newGrid = grid.map((r, ri) =>
          r.map((tile, ci) =>
            ri === selectedRow && ci === selectedCol
              ? { ...tile, letter: e.key.toLowerCase() }
              : tile
          )
        );
        onGridChange(newGrid);

        // Move to next tile
        if (selectedCol < 4) {
          onSelectionChange(selectedRow, selectedCol + 1);
        } else if (selectedRow < 5) {
          onSelectionChange(selectedRow + 1, 0);
        }
      } else if (isBackspace) {
        // Clear current tile
        const currentTile = grid[selectedRow][selectedCol];

        if (currentTile.letter) {
          // Clear current tile
          const newGrid = grid.map((r, ri) =>
            r.map((tile, ci) =>
              ri === selectedRow && ci === selectedCol
                ? { ...tile, letter: '' }
                : tile
            )
          );
          onGridChange(newGrid);
        } else {
          // Move to previous tile and clear it
          let newRow = selectedRow;
          let newCol = selectedCol - 1;

          if (newCol < 0) {
            if (newRow > 0) {
              newRow--;
              newCol = 4;
            } else {
              return; // Already at the start
            }
          }

          const newGrid = grid.map((r, ri) =>
            r.map((tile, ci) =>
              ri === newRow && ci === newCol ? { ...tile, letter: '' } : tile
            )
          );
          onGridChange(newGrid);
          onSelectionChange(newRow, newCol);
        }
      } else if (isArrowKey) {
        let newRow = selectedRow;
        let newCol = selectedCol;

        switch (e.key) {
          case 'ArrowUp':
            newRow = Math.max(0, selectedRow - 1);
            break;
          case 'ArrowDown':
            newRow = Math.min(5, selectedRow + 1);
            break;
          case 'ArrowLeft':
            newCol = Math.max(0, selectedCol - 1);
            break;
          case 'ArrowRight':
            newCol = Math.min(4, selectedCol + 1);
            break;
        }

        onSelectionChange(newRow, newCol);
      } else if (isTab) {
        // Tab moves to next tile, Shift+Tab moves to previous
        if (e.shiftKey) {
          let newRow = selectedRow;
          let newCol = selectedCol - 1;
          if (newCol < 0) {
            newRow--;
            newCol = 4;
          }
          if (newRow >= 0) {
            onSelectionChange(newRow, newCol);
          }
        } else {
          let newRow = selectedRow;
          let newCol = selectedCol + 1;
          if (newCol > 4) {
            newRow++;
            newCol = 0;
          }
          if (newRow <= 5) {
            onSelectionChange(newRow, newCol);
          }
        }
      }
    },
    [grid, selectedRow, selectedCol, onGridChange, onSelectionChange]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-[5px] outline-none"
      tabIndex={0}
    >
      {grid.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-[5px]">
          {row.map((tile, colIndex) => (
            <Tile
              key={colIndex}
              letter={tile.letter}
              color={tile.color}
              isSelected={selectedRow === rowIndex && selectedCol === colIndex}
              onClick={() => handleTileClick(rowIndex, colIndex)}
              onColorChange={(color) => handleColorChange(rowIndex, colIndex, color)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
