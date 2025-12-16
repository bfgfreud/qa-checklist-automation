'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface TruncatedTextProps {
  text: string;
  maxLines?: 1 | 2;
  className?: string;
  expandOnClick?: boolean;
  as?: 'span' | 'p' | 'div';
}

export const TruncatedText: React.FC<TruncatedTextProps> = ({
  text,
  maxLines = 1,
  className = '',
  expandOnClick = true,
  as: Component = 'span',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  // Track if it WAS truncated before expanding (so we can collapse it back)
  const [wasTruncated, setWasTruncated] = useState(false);
  const textRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if text is actually truncated (only when not expanded)
  const checkTruncation = useCallback(() => {
    if (isExpanded) return; // Don't check when expanded
    const element = textRef.current;
    if (element) {
      const isOverflowing = element.scrollWidth > element.clientWidth ||
                           element.scrollHeight > element.clientHeight;
      setIsTruncated(isOverflowing);
      if (isOverflowing) {
        setWasTruncated(true); // Remember it was truncated
      }
    }
  }, [isExpanded]);

  useEffect(() => {
    checkTruncation();
    // Recheck on window resize
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [checkTruncation, text]);

  // Also check after a brief delay to handle dynamic content
  useEffect(() => {
    const timeout = setTimeout(checkTruncation, 100);
    return () => clearTimeout(timeout);
  }, [checkTruncation, text]);

  const handleTextClick = (e: React.MouseEvent) => {
    // Only toggle if text was truncatable
    if (expandOnClick && (isTruncated || wasTruncated)) {
      e.stopPropagation();
      setIsExpanded(!isExpanded);
      setShowTooltip(false);
    }
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsExpanded(false);
    setShowTooltip(false);
  };

  const handleMouseEnter = () => {
    if (isTruncated && !isExpanded) {
      hoverTimeoutRef.current = setTimeout(() => {
        setShowTooltip(true);
      }, 300);
    }
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowTooltip(false);
  };

  // Position tooltip
  useEffect(() => {
    if (showTooltip && tooltipRef.current && textRef.current) {
      const textRect = textRef.current.getBoundingClientRect();
      const tooltip = tooltipRef.current;
      const tooltipRect = tooltip.getBoundingClientRect();

      // Position above the text by default
      let top = textRect.top - tooltipRect.height - 8;
      let left = textRect.left;

      // If tooltip would go off top of screen, show below
      if (top < 8) {
        top = textRect.bottom + 8;
      }

      // Keep tooltip within screen bounds horizontally
      if (left + tooltipRect.width > window.innerWidth - 8) {
        left = window.innerWidth - tooltipRect.width - 8;
      }
      if (left < 8) {
        left = 8;
      }

      tooltip.style.top = `${top}px`;
      tooltip.style.left = `${left}px`;
    }
  }, [showTooltip]);

  const truncationClass = maxLines === 1
    ? 'truncate'
    : 'line-clamp-2';

  const baseClasses = isExpanded
    ? 'whitespace-pre-wrap break-words'
    : truncationClass;

  const interactiveClasses = (isTruncated || wasTruncated) && expandOnClick
    ? 'cursor-pointer hover:text-gray-200'
    : '';

  return (
    <>
      <Component
        ref={textRef as React.RefObject<HTMLSpanElement & HTMLParagraphElement & HTMLDivElement>}
        className={`${baseClasses} ${interactiveClasses} ${className}`}
        onClick={handleTextClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title={isTruncated && !expandOnClick ? text : undefined}
      >
        {text}
        {isTruncated && !isExpanded && expandOnClick && (
          <span className="text-gray-500 ml-1 text-xs inline-flex items-center">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </span>
        )}
      </Component>
      {/* Separate collapse button when expanded - outside the text flow */}
      {isExpanded && expandOnClick && wasTruncated && (
        <button
          type="button"
          onClick={handleCollapseClick}
          className="text-gray-500 hover:text-gray-300 ml-1 text-xs inline-flex items-center cursor-pointer transition-colors"
          aria-label="Collapse text"
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Custom Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="fixed z-[9999] max-w-md px-3 py-2 text-sm text-white bg-dark-elevated border border-dark-primary rounded-lg shadow-xl whitespace-pre-wrap break-words pointer-events-none"
          style={{ maxHeight: '200px', overflowY: 'auto' }}
        >
          {text}
        </div>
      )}
    </>
  );
};
