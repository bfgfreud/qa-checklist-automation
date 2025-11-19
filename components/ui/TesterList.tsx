'use client';

import React from 'react';
import { Tester } from '@/types/tester';
import { TesterAvatar } from './TesterAvatar';

export interface TesterListProps {
  testers: Tester[];
  maxVisible?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const TesterList: React.FC<TesterListProps> = ({
  testers,
  maxVisible = 5,
  size = 'md',
}) => {
  if (testers.length === 0) {
    return (
      <div className="text-gray-500 text-sm italic">No testers assigned</div>
    );
  }

  const visibleTesters = testers.slice(0, maxVisible);
  const remainingCount = testers.length - maxVisible;

  return (
    <div className="flex items-center gap-1">
      {/* Render visible testers */}
      {visibleTesters.map((tester, index) => (
        <div
          key={tester.id}
          style={{
            marginLeft: index > 0 ? '-8px' : '0',
            zIndex: visibleTesters.length - index,
          }}
          className="relative"
        >
          <TesterAvatar tester={tester} size={size} />
        </div>
      ))}

      {/* Show remaining count if more testers */}
      {remainingCount > 0 && (
        <div
          className={`${
            size === 'sm' ? 'w-6 h-6 text-xs' : size === 'md' ? 'w-8 h-8 text-sm' : 'w-10 h-10 text-base'
          } rounded-full flex items-center justify-center font-semibold bg-dark-elevated border border-dark-border text-gray-400`}
          style={{ marginLeft: '-8px', zIndex: 0 }}
          title={`+${remainingCount} more tester${remainingCount > 1 ? 's' : ''}`}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};
