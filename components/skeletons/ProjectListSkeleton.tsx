'use client';

import React from 'react';
import { ProjectCardSkeleton } from './ProjectCardSkeleton';

interface ProjectListSkeletonProps {
  count?: number;
}

export const ProjectListSkeleton: React.FC<ProjectListSkeletonProps> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
};
