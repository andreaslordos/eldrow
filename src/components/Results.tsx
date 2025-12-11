'use client';

import { Chain } from '@/lib/types';

interface ResultsProps {
  chains: Chain[];
  isCalculating: boolean;
  hasCalculated: boolean;
}

export default function Results({
  chains,
  isCalculating,
  hasCalculated,
}: ResultsProps) {
  if (isCalculating) {
    return (
      <div className="w-full max-w-[600px] mt-8">
        <div className="border-t border-gray-700 pt-6">
          <div className="flex items-center justify-center gap-3 text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-tile-green rounded-full" />
            <span>Finding valid chains...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!hasCalculated) {
    return (
      <div className="w-full max-w-[600px] mt-8">
        <div className="border-t border-gray-700 pt-6">
          <p className="text-gray-500 text-center">
            Set up your pattern and click Calculate to find valid chains.
          </p>
        </div>
      </div>
    );
  }

  if (chains.length === 0) {
    return (
      <div className="w-full max-w-[600px] mt-8">
        <div className="border-t border-gray-700 pt-6">
          <p className="text-gray-400 text-center font-medium">
            No valid chains found for this pattern.
          </p>
          <p className="text-gray-500 text-center text-sm mt-2">
            Try adjusting the colors or enabling &quot;Weird Words&quot; fallback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[600px] mt-8">
      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Results{' '}
          <span className="text-gray-400 font-normal">
            ({chains.length} chain{chains.length !== 1 ? 's' : ''} found)
          </span>
        </h2>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          {chains.map((chain, index) => (
            <div
              key={index}
              className="bg-result-bg rounded-md px-3 py-2 text-sm"
            >
              <span className="text-gray-500 mr-2">#{index + 1}</span>
              {chain.guesses.map((guess, gi) => (
                <span key={gi}>
                  <span className="text-white uppercase font-mono tracking-wider">
                    {guess}
                  </span>
                  {gi < chain.guesses.length - 1 && (
                    <span className="text-gray-500 mx-2">→</span>
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
