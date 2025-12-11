'use client';

import { ProgressMode } from '@/lib/types';
import Tooltip from './Tooltip';

interface OptionsPanelProps {
  answer: string;
  onAnswerChange: (answer: string) => void;
  progressMode: ProgressMode;
  onProgressModeChange: (mode: ProgressMode) => void;
  weirdFallback: boolean;
  onWeirdFallbackChange: (value: boolean) => void;
  onCalculate: () => void;
  isCalculating: boolean;
}

const PROGRESS_MODE_OPTIONS: { value: ProgressMode; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'hard', label: 'Hard' },
  { value: 'strict', label: 'Strict' },
];

const TOOLTIPS = {
  progressMode: 'None: No constraints between guesses. Hard: Like Wordle hard mode, constraints from previous row only. Strict: All prior rows constrain future guesses - revealed letters must appear in all subsequent guesses.',
  weirdFallback: 'When enabled, if no valid chains are found with common words, the solver will try using obscure/unusual words as a fallback.',
};

export default function OptionsPanel({
  answer,
  onAnswerChange,
  progressMode,
  onProgressModeChange,
  weirdFallback,
  onWeirdFallbackChange,
  onCalculate,
  isCalculating,
}: OptionsPanelProps) {
  const isValidAnswer = /^[a-zA-Z]{5}$/.test(answer);

  return (
    <div className="w-full max-w-[350px] bg-options-bg rounded-lg p-4 space-y-4">
      {/* Answer Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Answer (the target word)
        </label>
        <input
          type="text"
          value={answer}
          onChange={(e) => onAnswerChange(e.target.value.toLowerCase().slice(0, 5))}
          placeholder="Enter 5-letter answer"
          maxLength={5}
          className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-tile-green focus:border-transparent uppercase tracking-widest text-center text-lg font-bold"
        />
      </div>

      {/* Progress Mode */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <label className="block text-sm font-medium text-gray-300">
            Progress Mode
          </label>
          <Tooltip content={TOOLTIPS.progressMode} />
        </div>
        <select
          value={progressMode}
          onChange={(e) => onProgressModeChange(e.target.value as ProgressMode)}
          className="w-full px-3 py-2 bg-input-bg border border-input-border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-tile-green focus:border-transparent cursor-pointer"
        >
          {PROGRESS_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Checkbox */}
      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={weirdFallback}
            onChange={(e) => onWeirdFallbackChange(e.target.checked)}
            className="w-4 h-4 rounded border-input-border bg-input-bg text-tile-green focus:ring-tile-green focus:ring-offset-0 cursor-pointer"
          />
          <span className="text-sm text-gray-300">Weird Words</span>
          <Tooltip content={TOOLTIPS.weirdFallback} />
        </label>
      </div>

      {/* Calculate Button */}
      <button
        onClick={onCalculate}
        disabled={!isValidAnswer || isCalculating}
        className={`
          w-full py-3 px-4 rounded-md font-bold text-lg uppercase tracking-wider
          transition-all duration-200
          ${
            isValidAnswer && !isCalculating
              ? 'bg-tile-green hover:bg-green-600 text-white cursor-pointer'
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {isCalculating ? 'Calculating...' : 'Calculate'}
      </button>
    </div>
  );
}
