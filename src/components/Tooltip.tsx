'use client';

import { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'top' | 'bottom'>('top');
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      // Show tooltip below if too close to top of viewport
      if (rect.top < 100) {
        setPosition('bottom');
      } else {
        setPosition('top');
      }
    }
  }, [isVisible]);

  return (
    <span className="relative inline-flex items-center">
      <span
        ref={triggerRef}
        className="cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        tabIndex={0}
      >
        {children || (
          <span className="inline-flex items-center justify-center w-4 h-4 text-xs rounded-full bg-gray-600 text-gray-300 hover:bg-gray-500 transition-colors">
            ?
          </span>
        )}
      </span>
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 w-64 px-3 py-2
            text-sm text-white bg-gray-800 rounded-lg shadow-lg
            ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2
          `}
        >
          {content}
          <div
            className={`
              absolute w-2 h-2 bg-gray-800 rotate-45
              left-1/2 -translate-x-1/2
              ${position === 'top' ? '-bottom-1' : '-top-1'}
            `}
          />
        </div>
      )}
    </span>
  );
}
