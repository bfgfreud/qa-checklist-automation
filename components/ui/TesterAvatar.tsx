'use client';

import React from 'react';
import { Tester } from '@/types/tester';

export interface TesterAvatarProps {
  tester: Tester;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export const TesterAvatar: React.FC<TesterAvatarProps> = ({
  tester,
  size = 'md',
  showTooltip = true,
}) => {
  // Get initials from name (first letter of each word, max 2 letters)
  const getInitials = (name: string): string => {
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
      return words[0].substring(0, 2).toUpperCase();
    }
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  };

  // Size classes
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  };

  const initials = getInitials(tester.name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-semibold text-white relative group`}
      style={{ backgroundColor: tester.color }}
      title={showTooltip ? tester.name : undefined}
      aria-label={`Tester: ${tester.name}`}
    >
      {initials}

      {/* Tooltip on hover */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-dark-elevated border border-dark-border rounded text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          {tester.name}
          {tester.email && (
            <div className="text-gray-400 text-xs">{tester.email}</div>
          )}
        </div>
      )}
    </div>
  );
};
