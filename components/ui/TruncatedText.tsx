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
  const textRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check if text is actually truncated
  const checkTruncation = useCallback(() => {
    const element = textRef.current;
    if (element) {
      const isOverflowing = element.scrollWidth > element.clientWidth ||
                           element.scrollHeight > element.clientHeight;
      setIsTruncated(isOverflowing);
    }
  }, []);

  useEffect(() => {
    checkTruncation();
    // Recheck on window resize
    window.addEventListener('resize', checkTruncation);
    return () => window.removeEventListener('resize', checkTruncation);
  }, [checkTruncation, text, isExpanded]);

  // Also check after a brief delay to handle dynamic content
  useEffect(() => {
    const timeout = setTimeout(checkTruncation, 100);
    return () => clearTimeout(timeout);
  }, [checkTruncation, text]);

  const handleClick = () => {
    if (expandOnClick && isTruncated) {
      setIsExpanded(!isExpanded);
      setShowTooltip(false);
    }
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

  const interactiveClasses = isTruncated && expandOnClick
    ? 'cursor-pointer hover:text-gray-200'
    : '';

  return (
    <>
      <Component
        ref={textRef as React.RefObject<HTMLSpanElement & HTMLParagraphElement & HTMLDivElement>}
        className={`${baseClasses} ${interactiveClasses} ${className}`}
        onClick={handleClick}
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
        {isExpanded && expandOnClick && (
          <span className="text-gray-500 ml-1 text-xs inline-flex items-center">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 15l7-7 7 7" />
            </svg>
          </span>
        )}
      </Component>

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
