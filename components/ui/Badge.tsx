import React from 'react';
import { Priority } from '@/types/module';

export interface BadgeProps {
  priority?: Priority;
  variant?: 'default' | 'outline' | 'solid';
  children?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ priority, variant = 'solid', children, className = '' }) => {
  // If priority is provided, use priority-based styling
  if (priority) {
    const variants = {
      High: 'bg-red-500 text-white',
      Medium: 'bg-yellow-500 text-black',
      Low: 'bg-green-500 text-white',
    };

    const icons = {
      High: '🔴',
      Medium: '🟡',
      Low: '🟢',
    };

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${variants[priority]} ${className}`}
      >
        <span>{icons[priority]}</span>
        <span>{priority}</span>
      </span>
    );
  }

  // Otherwise, use variant-based styling for generic badges
  const baseStyles = 'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium';

  const variantStyles = {
    default: 'bg-primary-500/20 text-primary-400 border border-primary-500/30',
    outline: 'bg-transparent text-dark-text-secondary border border-dark-border',
    solid: 'bg-dark-elevated text-dark-text-primary border border-dark-border',
  };

  return (
    <span className={`${baseStyles} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
};
