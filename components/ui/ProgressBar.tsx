import React from 'react';

export interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  size = 'md',
  showLabel = true,
  variant = 'default',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const variants = {
    default: 'from-primary-500 to-primary-600',
    success: 'from-green-500 to-green-600',
    warning: 'from-yellow-500 to-yellow-600',
    danger: 'from-red-500 to-red-600',
  };

  const getVariantByPercentage = () => {
    if (variant !== 'default') return variant;
    if (percentage === 100) return 'success';
    if (percentage >= 75) return 'default';
    if (percentage >= 50) return 'warning';
    return 'danger';
  };

  const currentVariant = getVariantByPercentage();

  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-center justify-between mb-1">
        {showLabel && (
          <span className="text-sm font-medium text-dark-text-secondary">
            {Math.round(percentage)}%
          </span>
        )}
      </div>
      <div
        className={`w-full bg-dark-elevated rounded-full overflow-hidden ${sizes[size]}`}
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full bg-gradient-to-r ${variants[currentVariant]} transition-all duration-500 ease-out rounded-full`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
