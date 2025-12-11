'use client';

import { useState, useEffect, useCallback } from 'react';

interface NodeState {
  id: string;
  status: 'idle' | 'exploring' | 'backtrack' | 'solution' | 'visited';
}

// Two-level tree: Row 1 candidates, then Row 2 candidates under valid Row 1 words
// Scenario: Finding chains where Row 1 is all gray, Row 2 is all green against CRANE
const TREE_NODES = [
  { id: 'root', label: 'Start', x: 200, y: 20, children: ['a', 'b', 'c'] },
  // Row 1 candidates
  { id: 'a', label: 'LYMPH', x: 70, y: 80, children: ['a1', 'a2'] },   // Valid - no shared letters
  { id: 'b', label: 'TRACE', x: 200, y: 80, children: [] },            // Invalid - has R,A,C,E
  { id: 'c', label: 'JUMPY', x: 330, y: 80, children: ['c1'] },        // Valid - no shared letters
  // Row 2 candidates under LYMPH
  { id: 'a1', label: 'CRANE', x: 40, y: 140, children: [] },           // Valid - matches answer!
  { id: 'a2', label: 'BRICK', x: 100, y: 140, children: [] },          // Invalid - not the answer
  // Row 2 candidates under JUMPY
  { id: 'c1', label: 'CRANE', x: 330, y: 140, children: [] },          // Valid - matches answer!
];

const EDGES = [
  { from: 'root', to: 'a' },
  { from: 'root', to: 'b' },
  { from: 'root', to: 'c' },
  { from: 'a', to: 'a1' },
  { from: 'a', to: 'a2' },
  { from: 'c', to: 'c1' },
];

// DFS animation sequence - exploring the tree depth-first
const DFS_SEQUENCE: Array<{ nodeId: string; action: 'explore' | 'backtrack' | 'solution'; chain?: string[] }> = [
  { nodeId: 'root', action: 'explore' },
  { nodeId: 'a', action: 'explore' },      // Check LYMPH for Row 1
  { nodeId: 'a1', action: 'explore' },     // Check CRANE for Row 2
  { nodeId: 'a1', action: 'solution', chain: ['LYMPH', 'CRANE'] },  // Found valid chain!
  { nodeId: 'a1', action: 'backtrack' },
  { nodeId: 'a2', action: 'explore' },     // Check BRICK for Row 2
  { nodeId: 'a2', action: 'backtrack' },   // BRICK doesn't match pattern
  { nodeId: 'a', action: 'backtrack' },    // Done with LYMPH subtree
  { nodeId: 'b', action: 'explore' },      // Check TRACE for Row 1
  { nodeId: 'b', action: 'backtrack' },    // TRACE fails (shares letters with CRANE)
  { nodeId: 'c', action: 'explore' },      // Check JUMPY for Row 1
  { nodeId: 'c1', action: 'explore' },     // Check CRANE for Row 2
  { nodeId: 'c1', action: 'solution', chain: ['JUMPY', 'CRANE'] },  // Found valid chain!
  { nodeId: 'c1', action: 'backtrack' },
  { nodeId: 'c', action: 'backtrack' },    // Done with JUMPY subtree
  { nodeId: 'root', action: 'backtrack' },
];

export default function DFSAnimation() {
  const [nodeStates, setNodeStates] = useState<Map<string, NodeState>>(() => {
    const map = new Map();
    TREE_NODES.forEach(node => {
      map.set(node.id, { id: node.id, status: 'idle' });
    });
    return map;
  });
  const [currentStep, setCurrentStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [chainsFound, setChainsFound] = useState<string[][]>([]);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setChainsFound([]);
    setNodeStates(() => {
      const map = new Map();
      TREE_NODES.forEach(node => {
        map.set(node.id, { id: node.id, status: 'idle' });
      });
      return map;
    });
  }, []);

  const step = useCallback(() => {
    setCurrentStep(prev => {
      const next = prev + 1;
      if (next >= DFS_SEQUENCE.length) {
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  }, []);

  // Process the current step's action
  useEffect(() => {
    if (currentStep < 0 || currentStep >= DFS_SEQUENCE.length) return;

    const { nodeId, action, chain } = DFS_SEQUENCE[currentStep];

    setNodeStates(prevStates => {
      const newStates = new Map(prevStates);
      const currentState = newStates.get(nodeId);
      if (currentState) {
        let newStatus: NodeState['status'] = 'idle';
        if (action === 'explore') {
          newStatus = 'exploring';
        } else if (action === 'backtrack') {
          newStatus = currentState.status === 'solution' ? 'solution' : 'visited';
        } else if (action === 'solution') {
          newStatus = 'solution';
        }
        newStates.set(nodeId, { ...currentState, status: newStatus });
      }
      return newStates;
    });

    // Add chain outside of setNodeStates to avoid duplicate calls
    if (action === 'solution' && chain) {
      setChainsFound(prev => {
        // Check if this chain is already added
        const chainStr = chain.join('→');
        if (prev.some(c => c.join('→') === chainStr)) {
          return prev;
        }
        return [...prev, chain];
      });
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      step();
    }, 600);

    return () => clearInterval(interval);
  }, [isPlaying, step]);

  useEffect(() => {
    if (currentStep >= DFS_SEQUENCE.length - 1) {
      setIsPlaying(false);
    }
  }, [currentStep]);

  const getNodeColor = (status: NodeState['status']) => {
    switch (status) {
      case 'exploring': return '#b59f3b'; // yellow
      case 'solution': return '#538d4e'; // green
      case 'visited': return '#6b2121'; // red-ish for rejected
      case 'backtrack': return '#3a3a3c';
      default: return '#2a2a2b'; // idle
    }
  };

  const getNodeClass = (status: NodeState['status']) => {
    if (status === 'exploring') return 'animate-pulse';
    return '';
  };

  const node = (id: string) => TREE_NODES.find(n => n.id === id);

  return (
    <div className="w-full">
      {/* Context label */}
      <div className="text-center mb-2 text-xs text-gray-500">
        Finding 2-word chains ending in <span className="text-tile-green font-mono">CRANE</span>
      </div>

      <svg
        viewBox="0 0 400 170"
        className="w-full max-w-[400px] mx-auto"
        style={{ minHeight: '170px' }}
      >
        {/* Edges */}
        {EDGES.map(edge => {
          const fromNode = node(edge.from);
          const toNode = node(edge.to);
          if (!fromNode || !toNode) return null;

          const fromState = nodeStates.get(edge.from);
          const toState = nodeStates.get(edge.to);
          const isActive =
            (fromState?.status === 'exploring' || fromState?.status === 'solution') &&
            (toState?.status === 'exploring' || toState?.status === 'solution');

          return (
            <line
              key={`${edge.from}-${edge.to}`}
              x1={fromNode.x}
              y1={fromNode.y + 15}
              x2={toNode.x}
              y2={toNode.y - 15}
              stroke={isActive ? '#b59f3b' : '#3a3a3c'}
              strokeWidth={isActive ? 2 : 1}
              className="transition-all duration-300"
            />
          );
        })}

        {/* Row labels */}
        <text x="10" y="84" fill="#666" fontSize="9" fontFamily="sans-serif">Row 1</text>
        <text x="10" y="144" fill="#666" fontSize="9" fontFamily="sans-serif">Row 2</text>

        {/* Nodes */}
        {TREE_NODES.map(n => {
          const state = nodeStates.get(n.id);
          const status = state?.status || 'idle';
          const isRoot = n.id === 'root';

          return (
            <g key={n.id} className={getNodeClass(status)}>
              <rect
                x={n.x - (isRoot ? 22 : 28)}
                y={n.y - 12}
                width={isRoot ? 44 : 56}
                height={24}
                rx={4}
                fill={getNodeColor(status)}
                stroke={status === 'exploring' ? '#fff' : 'transparent'}
                strokeWidth={2}
                className="transition-all duration-300"
              />
              <text
                x={n.x}
                y={n.y + 4}
                textAnchor="middle"
                fill="#fff"
                fontSize={isRoot ? 10 : 9}
                fontWeight="bold"
                fontFamily="monospace"
                className="select-none pointer-events-none"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-3">
        <button
          onClick={() => {
            if (currentStep >= DFS_SEQUENCE.length - 1) {
              reset();
              setTimeout(() => setIsPlaying(true), 100);
            } else {
              setIsPlaying(!isPlaying);
            }
          }}
          className="px-4 py-2 bg-tile-green hover:bg-green-600 text-white text-sm rounded-md transition-colors"
        >
          {currentStep >= DFS_SEQUENCE.length - 1 ? 'Restart' : isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={step}
          disabled={isPlaying || currentStep >= DFS_SEQUENCE.length - 1}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm rounded-md transition-colors"
        >
          Step
        </button>
        <button
          onClick={reset}
          className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-md transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-3 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-tile-yellow" />
          <span>Checking</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-tile-green" />
          <span>Valid</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded" style={{ backgroundColor: '#6b2121' }} />
          <span>Invalid</span>
        </div>
      </div>

      {/* Chains found */}
      {chainsFound.length > 0 && (
        <div className="mt-3 text-center text-xs">
          <span className="text-gray-400">Found: </span>
          <span className="text-tile-green font-mono">
            {chainsFound.map(chain => chain.join(' → ')).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}
