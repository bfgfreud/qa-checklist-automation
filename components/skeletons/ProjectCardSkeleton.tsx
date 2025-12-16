'use client';

import React from 'react';

export const ProjectCardSkeleton: React.FC = () => {
  return (
    <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          {/* Title */}
          <div className="h-7 w-48 bg-dark-elevated rounded mb-3"></div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <div className="h-6 w-14 bg-dark-elevated rounded-full"></div>
            <div className="h-6 w-16 bg-dark-elevated rounded-full"></div>
            <div className="h-6 w-20 bg-dark-elevated rounded-full"></div>
          </div>

          {/* Description */}
          <div className="h-4 w-full bg-dark-elevated rounded mb-2"></div>
          <div className="h-4 w-3/4 bg-dark-elevated rounded mb-3"></div>

          {/* Due Date */}
          <div className="h-4 w-32 bg-dark-elevated rounded"></div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          <div className="w-9 h-9 bg-dark-elevated rounded-lg"></div>
          <div className="w-9 h-9 bg-dark-elevated rounded-lg"></div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-4 pt-4 border-t border-dark-primary">
        <div className="flex items-center justify-between mb-2">
          <div className="h-4 w-16 bg-dark-elevated rounded"></div>
          <div className="h-4 w-10 bg-dark-elevated rounded"></div>
        </div>
        <div className="h-2 bg-dark-elevated rounded-full mb-3"></div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-dark-elevated rounded px-2 py-1.5">
              <div className="h-3 w-12 bg-dark-primary rounded mb-1 mx-auto"></div>
              <div className="h-5 w-6 bg-dark-primary rounded mx-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Testers Section */}
      <div className="mt-4 pt-4 border-t border-dark-primary">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 bg-dark-elevated rounded"></div>
          <div className="flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-8 h-8 bg-dark-elevated rounded-full"></div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-dark-primary flex items-center justify-between">
        <div className="h-4 w-32 bg-dark-elevated rounded"></div>
        <div className="h-9 w-28 bg-dark-elevated rounded-lg"></div>
      </div>
    </div>
  );
};
