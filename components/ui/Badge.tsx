'use client';

import React from 'react';
import { Priority } from '@/types/module';

interface BadgeProps {
  priority: Priority;
}

export const Badge: React.FC<BadgeProps> = ({ priority }) => {
  const colors = {
    High: 'bg-red-500/20 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Low: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span
      className={`text-xs px-1.5 py-0.5 rounded border flex-shrink-0 ${colors[priority]}`}
    >
      {priority}
    </span>
  );
};
