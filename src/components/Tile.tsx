'use client';

import { ColorValue } from '@/lib/types';

interface TileProps {
  letter: string;
  color: ColorValue;
  isSelected: boolean;
  onClick: () => void;
  onColorChange: (color: ColorValue) => void;
}

const COLOR_CLASSES: Record<ColorValue, string> = {
  0: 'bg-tile-gray border-tile-border',
  1: 'bg-tile-yellow border-tile-yellow',
  2: 'bg-tile-green border-tile-green',
};

export default function Tile({
  letter,
  color,
  isSelected,
  onClick,
  onColorChange,
}: TileProps) {
  const handleClick = () => {
    onClick();
    // Cycle color: gray(0) -> yellow(1) -> green(2) -> gray(0)
    const nextColor = ((color + 1) % 3) as ColorValue;
    onColorChange(nextColor);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        w-[62px] h-[62px]
        border-2
        flex items-center justify-center
        text-3xl font-bold uppercase
        text-white
        transition-colors duration-100
        cursor-pointer
        select-none
        ${COLOR_CLASSES[color]}
        ${isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-background' : ''}
      `}
    >
      {letter}
    </button>
  );
}
