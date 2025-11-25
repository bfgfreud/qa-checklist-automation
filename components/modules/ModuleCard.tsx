'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Module, TestCase } from '@/types/module';
import { Button } from '@/components/ui/Button';
import { TestCaseItem } from './TestCaseItem';

export interface ModuleCardProps {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onAddTestCase: (moduleId: string) => void;
  onEditTestCase: (testCase: TestCase) => void;
  onDeleteTestCase: (testCase: TestCase) => void;
  isModified?: (item: Module | TestCase) => boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  viewMode?: 'compact' | 'big';
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  onEdit,
  onDelete,
  onAddTestCase,
  onEditTestCase,
  onDeleteTestCase,
  isModified,
  isExpanded,
  onToggleExpand,
  viewMode = 'big',
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: module.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const moduleIsModified = isModified?.(module) || false;
  const isNewModule = module.id.startsWith('temp-');

  // Generate consistent color from tag name (deterministic)
  const getTagColor = (tag: string): string => {
    const colors = [
      '#FF6B35', // orange (primary)
      '#4ECDC4', // teal
      '#45B7D1', // blue
      '#96CEB4', // green
      '#FFEAA7', // yellow
      '#DDA15E', // brown
      '#BC6C25', // dark orange
      '#9B59B6', // purple
      '#E74C3C', // red
      '#3498DB', // sky blue
    ];

    // Simple hash function for consistent color
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const isCompact = viewMode === 'compact';

  // In compact mode, show max 3 tags with "+N more" indicator
  const displayTags = isCompact && module.tags && module.tags.length > 3
    ? module.tags.slice(0, 3)
    : module.tags || [];
  const hiddenTagsCount = isCompact && module.tags ? Math.max(0, module.tags.length - 3) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-dark-secondary border rounded-lg hover:border-primary-500 transition-all ${
        isCompact ? 'p-3' : 'p-6'
      } ${moduleIsModified ? 'border-orange-500' : 'border-dark-primary'}`}
    >
      {/* Module Header */}
      <div className={`flex items-start ${isCompact ? 'gap-2' : 'gap-4'}`}>
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
          aria-label="Drag to reorder module"
        >
          <svg className={isCompact ? 'w-4 h-4' : 'w-6 h-6'} viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="5" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="8" cy="19" r="1.5" />
            <circle cx="16" cy="5" r="1.5" />
            <circle cx="16" cy="12" r="1.5" />
            <circle cx="16" cy="19" r="1.5" />
          </svg>
        </button>

        {/* Module Info */}
        <div className="flex-1 min-w-0">
          <div className={`flex items-start justify-between ${isCompact ? 'mb-1' : 'mb-2'}`}>
            <div className="flex-1 min-w-0">
              <h3 className={`font-bold text-white flex items-center gap-2 ${isCompact ? 'text-base' : 'text-xl'}`}>
                {module.icon && <span className={isCompact ? 'text-base' : ''}>{module.icon}</span>}
                <span className="truncate">{module.name}</span>
                {moduleIsModified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 bg-orange-500/20 text-orange-400 rounded-full flex-shrink-0">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    {isNewModule ? 'New' : 'Edited'}
                  </span>
                )}
              </h3>
              {/* Description - hidden in compact mode */}
              {!isCompact && module.description && (
                <p className="text-gray-400 text-sm mt-1">{module.description}</p>
              )}

              {/* Tags display - limited in compact mode */}
              {displayTags.length > 0 && (
                <div className={`flex flex-wrap gap-1.5 ${isCompact ? 'mt-1' : 'mt-3'}`}>
                  {displayTags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: getTagColor(tag), color: '#fff' }}
                    >
                      {tag}
                    </span>
                  ))}
                  {hiddenTagsCount > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-600 text-gray-300">
                      +{hiddenTagsCount} more
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm" onClick={() => onEdit(module)}>
                Edit
              </Button>
              <Button variant="danger" size="sm" onClick={() => onDelete(module)}>
                Delete
              </Button>
            </div>
          </div>

          {/* Test Case Count */}
          <div className={`flex items-center justify-between ${isCompact ? 'mb-2' : 'mb-3'}`}>
            <p className="text-sm text-gray-400">
              {module.testCases.length} test case{module.testCases.length !== 1 ? 's' : ''}
            </p>
            <button
              onClick={onToggleExpand}
              className="text-sm text-primary-500 hover:text-primary-400 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 rounded px-2 py-1 transition-colors"
              aria-expanded={isExpanded}
              aria-label={isExpanded ? 'Collapse test cases' : 'Expand test cases'}
            >
              <span className="inline-flex items-center gap-1">
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                {isExpanded ? 'Hide' : 'Show'} Test Cases
              </span>
            </button>
          </div>

          {/* Test Cases List */}
          {isExpanded && (
            <div className={isCompact ? 'space-y-2' : 'space-y-3'}>
              <SortableContext
                items={module.testCases.map((tc) => tc.id)}
                strategy={verticalListSortingStrategy}
              >
                {module.testCases.map((testCase) => (
                  <TestCaseItem
                    key={testCase.id}
                    testCase={testCase}
                    onEdit={onEditTestCase}
                    onDelete={onDeleteTestCase}
                    isModified={isModified}
                  />
                ))}
              </SortableContext>

              {/* Add Test Case Button */}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onAddTestCase(module.id)}
                className="w-full"
              >
                + Add Test Case
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
