'use client';

import { useState, useEffect, useCallback } from 'react';

interface NodeState {
  id: string;
  status: 'idle' | 'exploring' | 'backtrack' | 'solution' | 'visited';
}

// Tree structure showing Eldrow searching for valid first words
// Scenario: Answer is CRANE, Row 1 is all gray, Row 2 is all green
// We're finding words that share NO letters with CRANE
const TREE_NODES = [
  { id: 'root', label: 'Row 1', x: 150, y: 20, children: ['a', 'b', 'c', 'd'] },
  { id: 'a', label: 'LYMPH', x: 45, y: 90, children: [] },   // Valid - no shared letters
  { id: 'b', label: 'TRACE', x: 105, y: 90, children: [] },  // Invalid - has R,A,C,E
  { id: 'c', label: 'JUMPY', x: 195, y: 90, children: [] },  // Valid - no shared letters
  { id: 'd', label: 'FRESH', x: 255, y: 90, children: [] },  // Invalid - has R,E
];

const EDGES = [
  { from: 'root', to: 'a' },
  { from: 'root', to: 'b' },
  { from: 'root', to: 'c' },
  { from: 'root', to: 'd' },
];

// DFS animation sequence - checking each candidate word
const DFS_SEQUENCE: Array<{ nodeId: string; action: 'explore' | 'backtrack' | 'solution' }> = [
  { nodeId: 'root', action: 'explore' },
  { nodeId: 'a', action: 'explore' },    // Check LYMPH
  { nodeId: 'a', action: 'solution' },   // LYMPH works! (all gray against CRANE)
  { nodeId: 'a', action: 'backtrack' },
  { nodeId: 'b', action: 'explore' },    // Check TRACE
  { nodeId: 'b', action: 'backtrack' },  // TRACE fails (has R,A,C,E)
  { nodeId: 'c', action: 'explore' },    // Check JUMPY
  { nodeId: 'c', action: 'solution' },   // JUMPY works!
  { nodeId: 'c', action: 'backtrack' },
  { nodeId: 'd', action: 'explore' },    // Check FRESH
  { nodeId: 'd', action: 'backtrack' },  // FRESH fails (has R,E)
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
  const [solutionsFound, setSolutionsFound] = useState<string[]>([]);

  const reset = useCallback(() => {
    setCurrentStep(-1);
    setSolutionsFound([]);
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

      const { nodeId, action } = DFS_SEQUENCE[next];

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
            const nodeLabel = TREE_NODES.find(n => n.id === nodeId)?.label || nodeId;
            setSolutionsFound(prev => [...prev, nodeLabel]);
          }
          newStates.set(nodeId, { ...currentState, status: newStatus });
        }
        return newStates;
      });

      return next;
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      step();
    }, 700);

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
    if (status === 'solution') return 'animate-bounce-subtle';
    return '';
  };

  const node = (id: string) => TREE_NODES.find(n => n.id === id);

  return (
    <div className="w-full">
      {/* Context label */}
      <div className="text-center mb-2 text-xs text-gray-500">
        Finding words that produce <span className="text-tile-gray px-1 rounded">all gray</span> against <span className="text-tile-green font-mono">CRANE</span>
      </div>

      <svg
        viewBox="0 0 300 130"
        className="w-full max-w-[300px] mx-auto"
        style={{ minHeight: '130px' }}
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

        {/* Nodes */}
        {TREE_NODES.map(n => {
          const state = nodeStates.get(n.id);
          const status = state?.status || 'idle';
          const isRoot = n.id === 'root';

          return (
            <g key={n.id} className={getNodeClass(status)}>
              {isRoot ? (
                <rect
                  x={n.x - 25}
                  y={n.y - 12}
                  width={50}
                  height={24}
                  rx={4}
                  fill={getNodeColor(status)}
                  stroke={status === 'exploring' ? '#fff' : 'transparent'}
                  strokeWidth={2}
                  className="transition-all duration-300"
                />
              ) : (
                <rect
                  x={n.x - 28}
                  y={n.y - 12}
                  width={56}
                  height={24}
                  rx={4}
                  fill={getNodeColor(status)}
                  stroke={status === 'exploring' ? '#fff' : 'transparent'}
                  strokeWidth={2}
                  className="transition-all duration-300"
                />
              )}
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

      {/* Solutions found */}
      {solutionsFound.length > 0 && (
        <div className="mt-3 text-center text-xs">
          <span className="text-gray-400">Valid chains: </span>
          <span className="text-tile-green font-mono">
            {solutionsFound.join(', ')} → CRANE
          </span>
        </div>
      )}
    </div>
  );
}
