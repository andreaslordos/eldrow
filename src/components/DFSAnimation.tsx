'use client';

import { useState, useEffect, useCallback } from 'react';

interface NodeState {
  id: string;
  status: 'idle' | 'exploring' | 'backtrack' | 'solution' | 'visited';
}

// Tree structure for DFS visualization
const TREE_NODES = [
  { id: 'root', label: 'Start', x: 150, y: 20, children: ['a', 'b'] },
  { id: 'a', label: 'CRANE', x: 75, y: 80, children: ['c', 'd'] },
  { id: 'b', label: 'AUDIO', x: 225, y: 80, children: ['e', 'f'] },
  { id: 'c', label: 'SLATE', x: 37, y: 140, children: [] },
  { id: 'd', label: 'STARE', x: 112, y: 140, children: [] },
  { id: 'e', label: 'RAISE', x: 187, y: 140, children: [] },
  { id: 'f', label: 'TEARS', x: 262, y: 140, children: [] },
];

const EDGES = [
  { from: 'root', to: 'a' },
  { from: 'root', to: 'b' },
  { from: 'a', to: 'c' },
  { from: 'a', to: 'd' },
  { from: 'b', to: 'e' },
  { from: 'b', to: 'f' },
];

// DFS animation sequence
const DFS_SEQUENCE: Array<{ nodeId: string; action: 'explore' | 'backtrack' | 'solution' }> = [
  { nodeId: 'root', action: 'explore' },
  { nodeId: 'a', action: 'explore' },
  { nodeId: 'c', action: 'explore' },
  { nodeId: 'c', action: 'backtrack' },
  { nodeId: 'd', action: 'explore' },
  { nodeId: 'd', action: 'solution' },
  { nodeId: 'd', action: 'backtrack' },
  { nodeId: 'a', action: 'backtrack' },
  { nodeId: 'b', action: 'explore' },
  { nodeId: 'e', action: 'explore' },
  { nodeId: 'e', action: 'solution' },
  { nodeId: 'e', action: 'backtrack' },
  { nodeId: 'f', action: 'explore' },
  { nodeId: 'f', action: 'backtrack' },
  { nodeId: 'b', action: 'backtrack' },
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
            setSolutionsFound(prev => [...prev, nodeId]);
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
      case 'visited': return '#3a3a3c'; // gray
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
      <svg
        viewBox="0 0 300 180"
        className="w-full max-w-[300px] mx-auto"
        style={{ minHeight: '180px' }}
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

          return (
            <g key={n.id} className={getNodeClass(status)}>
              <circle
                cx={n.x}
                cy={n.y}
                r={n.id === 'root' ? 18 : 15}
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
                fontSize={n.id === 'root' ? 8 : 6}
                fontWeight="bold"
                className="select-none pointer-events-none"
              >
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3 mt-4">
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
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-tile-yellow" />
          <span>Exploring</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-tile-green" />
          <span>Solution Found</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 rounded-full bg-tile-gray" />
          <span>Visited</span>
        </div>
      </div>

      {/* Solutions found */}
      {solutionsFound.length > 0 && (
        <div className="mt-3 text-center text-sm text-tile-green">
          {solutionsFound.length} solution{solutionsFound.length !== 1 ? 's' : ''} found!
        </div>
      )}
    </div>
  );
}
