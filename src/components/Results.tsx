'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Chain } from '@/lib/types';

interface ResultsProps {
  chains: Chain[];
  isCalculating: boolean;
  hasCalculated: boolean;
  validationError: string | null;
}

const CHUNK_SIZE = 1000;

export default function Results({
  chains,
  isCalculating,
  hasCalculated,
  validationError,
}: ResultsProps) {
  const [displayCount, setDisplayCount] = useState(CHUNK_SIZE);
  const [excludedStarters, setExcludedStarters] = useState<Set<string>>(new Set());
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Extract unique starting words from chains
  const startingWords = useMemo(() => {
    const starters = new Map<string, number>();
    for (const chain of chains) {
      if (chain.guesses.length > 0) {
        const starter = chain.guesses[0].toUpperCase();
        starters.set(starter, (starters.get(starter) || 0) + 1);
      }
    }
    // Sort by count (descending), then alphabetically
    return Array.from(starters.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [chains]);

  // Filter chains based on excluded starters
  const filteredChains = useMemo(() => {
    if (excludedStarters.size === 0) return chains;
    return chains.filter(chain => {
      if (chain.guesses.length === 0) return true;
      return !excludedStarters.has(chain.guesses[0].toUpperCase());
    });
  }, [chains, excludedStarters]);

  // Reset display count and excluded starters when chains change
  useEffect(() => {
    setDisplayCount(CHUNK_SIZE);
    setExcludedStarters(new Set());
  }, [chains]);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayCount < filteredChains.length) {
          setDisplayCount(prev => Math.min(prev + CHUNK_SIZE, filteredChains.length));
        }
      },
      {
        root: containerRef.current,
        rootMargin: '100px',
        threshold: 0,
      }
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [displayCount, filteredChains.length]);

  const toggleStarter = (word: string) => {
    setExcludedStarters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(word)) {
        newSet.delete(word);
      } else {
        newSet.add(word);
      }
      return newSet;
    });
    setDisplayCount(CHUNK_SIZE); // Reset display count when filter changes
  };

  const selectAll = () => {
    setExcludedStarters(new Set());
    setDisplayCount(CHUNK_SIZE);
  };

  const selectNone = () => {
    setExcludedStarters(new Set(startingWords.map(([word]) => word)));
    setDisplayCount(CHUNK_SIZE);
  };

  if (validationError) {
    return (
      <div className="w-full max-w-[600px] mt-8">
        <div className="border-t border-gray-700 pt-6">
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-red-400 text-lg">⚠</span>
              <div>
                <p className="text-red-400 font-medium text-sm">Invalid Pattern</p>
                <p className="text-red-300/80 text-sm mt-1">{validationError}</p>
                <p className="text-gray-500 text-xs mt-2">
                  Change the grid colors or switch to &quot;None&quot; progress mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

  const displayedChains = filteredChains.slice(0, displayCount);
  const hasMore = displayCount < filteredChains.length;

  return (
    <div className="w-full max-w-[600px] mt-8">
      <div className="border-t border-gray-700 pt-6">
        <h2 className="text-lg font-bold text-white mb-4">
          Results{' '}
          <span className="text-gray-400 font-normal">
            ({filteredChains.length} chain{filteredChains.length !== 1 ? 's' : ''} found
            {excludedStarters.size > 0 && ` of ${chains.length}`})
          </span>
        </h2>

        <div
          ref={containerRef}
          className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar"
        >
          {displayedChains.map((chain, index) => (
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

          {/* Invisible loader element for infinite scroll */}
          {hasMore && (
            <div ref={loaderRef} className="py-2 text-center text-gray-500 text-sm">
              Loading more...
            </div>
          )}
        </div>

        {/* Show count info */}
        {displayCount < filteredChains.length && (
          <p className="text-gray-500 text-xs text-center mt-2">
            Showing {displayCount} of {filteredChains.length} chains. Scroll for more.
          </p>
        )}

        {/* Starting Words Filter */}
        {startingWords.length > 1 && (
          <div className="mt-6 pt-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-300">
                Filter by Starting Word
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  All
                </button>
                <span className="text-gray-600">|</span>
                <button
                  onClick={selectNone}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  None
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {startingWords.map(([word, count]) => {
                const isChecked = !excludedStarters.has(word);
                return (
                  <label
                    key={word}
                    className={`
                      flex items-center gap-1.5 px-2 py-1 rounded cursor-pointer transition-all text-xs
                      ${isChecked
                        ? 'bg-tile-green/20 text-tile-green border border-tile-green/40'
                        : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleStarter(word)}
                      className="sr-only"
                    />
                    <span className="font-mono font-bold">{word}</span>
                    <span className={`text-[10px] ${isChecked ? 'text-tile-green/70' : 'text-gray-600'}`}>
                      ({count})
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
