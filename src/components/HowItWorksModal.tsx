'use client';

import Modal from './Modal';
import DFSAnimation from './DFSAnimation';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Mini tile component for visual examples
function MiniTile({ letter, color }: { letter: string; color: 'gray' | 'yellow' | 'green' }) {
  const colorClasses = {
    gray: 'bg-tile-gray',
    yellow: 'bg-tile-yellow',
    green: 'bg-tile-green',
  };

  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 text-sm sm:text-base font-bold text-white rounded ${colorClasses[color]}`}
    >
      {letter}
    </span>
  );
}

// Row of mini tiles
function MiniRow({ letters, colors }: { letters: string[]; colors: Array<'gray' | 'yellow' | 'green'> }) {
  return (
    <div className="flex gap-1">
      {letters.map((letter, i) => (
        <MiniTile key={i} letter={letter} color={colors[i]} />
      ))}
    </div>
  );
}

export default function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center pr-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white">How Eldrow Works</h2>
          <p className="text-gray-400 text-sm mt-1">Reverse Wordle Solver</p>
        </div>

        {/* What is Eldrow */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-2">What is Eldrow?</h3>
          <p className="text-gray-300 text-sm leading-relaxed">
            Eldrow is a &quot;reverse&quot; Wordle solver. Instead of guessing words to find the answer,
            you provide the <span className="text-tile-yellow">color patterns</span> from your Wordle game,
            and Eldrow finds all possible word sequences that could produce those patterns.
          </p>
        </section>

        {/* How to Use */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">How to Use</h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tile-green text-white text-sm flex items-center justify-center font-bold">1</span>
              <div>
                <p className="text-gray-300 text-sm">
                  <strong>Click tiles to set colors.</strong> Each click cycles through:
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <MiniTile letter="" color="gray" />
                  <span>→</span>
                  <MiniTile letter="" color="yellow" />
                  <span>→</span>
                  <MiniTile letter="" color="green" />
                  <span>→</span>
                  <MiniTile letter="" color="gray" />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tile-green text-white text-sm flex items-center justify-center font-bold">2</span>
              <div>
                <p className="text-gray-300 text-sm">
                  <strong>Optionally type letters</strong> to constrain which words can match. Empty tiles act as wildcards.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-tile-green text-white text-sm flex items-center justify-center font-bold">3</span>
              <div>
                <p className="text-gray-300 text-sm">
                  <strong>Enter the answer</strong> (the target word) and click Calculate.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Example */}
        <section className="bg-gray-800/50 rounded-lg p-4">
          <h3 className="text-base font-semibold text-white mb-3">Example</h3>
          <p className="text-gray-400 text-xs mb-3">
            If the answer is <span className="text-tile-green font-mono">GUESS</span> and you enter this pattern:
          </p>
          <div className="flex flex-col gap-2 mb-3">
            <MiniRow letters={['C', 'R', 'A', 'N', 'E']} colors={['gray', 'gray', 'gray', 'gray', 'gray']} />
            <MiniRow letters={['S', 'L', 'U', 'G', 'S']} colors={['yellow', 'gray', 'yellow', 'yellow', 'green']} />
          </div>
          <p className="text-gray-400 text-xs">
            Eldrow will find all valid first words (like CRANE, AUDIO, etc.) that could lead to this pattern.
          </p>
        </section>

        {/* The Algorithm */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">The Algorithm</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-4">
            Eldrow uses <strong className="text-tile-yellow">Depth-First Search (DFS)</strong> to find valid word chains.
            For each row, it checks candidate words against your color pattern—if a word produces the exact pattern
            you specified when scored against the answer, it&apos;s valid.
          </p>

          <div className="bg-gray-800/50 rounded-lg p-4">
            <DFSAnimation />
          </div>

          <div className="mt-4 text-gray-400 text-xs space-y-1">
            <p>• <strong className="text-tile-yellow">Yellow</strong> = currently checking</p>
            <p>• <strong className="text-tile-green">Green</strong> = valid (produces the required pattern)</p>
            <p>• <strong style={{ color: '#6b2121' }}>Red</strong> = invalid (shares letters with answer)</p>
          </div>
        </section>

        {/* Progress Modes */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Progress Modes</h3>
          <div className="space-y-3">
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-gray-600 rounded text-xs text-white font-medium">None</span>
                <span className="text-gray-500 text-xs">Fastest</span>
              </div>
              <p className="text-gray-400 text-xs">
                No constraints between guesses. Any valid word can follow any other.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-tile-yellow rounded text-xs text-black font-medium">Hard</span>
                <span className="text-gray-500 text-xs">Like Wordle Hard Mode</span>
              </div>
              <p className="text-gray-400 text-xs">
                Each guess must use hints from the previous guess. Green letters stay fixed,
                yellow letters must appear somewhere.
              </p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 bg-tile-green rounded text-xs text-white font-medium">Strict</span>
                <span className="text-gray-500 text-xs">Most restrictive</span>
              </div>
              <p className="text-gray-400 text-xs">
                All prior rows constrain future guesses. Once a letter is revealed (green/yellow),
                it must appear in all subsequent guesses.
              </p>
            </div>
          </div>
        </section>

        {/* Other Options */}
        <section>
          <h3 className="text-lg font-semibold text-white mb-3">Other Options</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <strong className="text-white">Weird Words:</strong>{' '}
              <span className="text-gray-400">
                Includes obscure words (like AALII or ZOEAE) as a fallback if no common words work.
              </span>
            </p>
          </div>
        </section>

        {/* Tips */}
        <section className="border-t border-gray-700 pt-4">
          <h3 className="text-base font-semibold text-white mb-2">Tips</h3>
          <ul className="text-gray-400 text-xs space-y-1 list-disc list-inside">
            <li>Use arrow keys or Tab to navigate between tiles</li>
            <li>Press Backspace to clear letters</li>
            <li>All-gray rows are valid (means no letters match the answer)</li>
            <li>Scroll through results to load more chains</li>
          </ul>
        </section>
      </div>
    </Modal>
  );
}
