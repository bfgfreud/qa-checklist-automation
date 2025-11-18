'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TestCase, Module } from '@/types/module';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

export interface TestCaseItemProps {
  testCase: TestCase;
  onEdit: (testCase: TestCase) => void;
  onDelete: (testCase: TestCase) => void;
  isModified?: (item: Module | TestCase) => boolean;
}

export const TestCaseItem: React.FC<TestCaseItemProps> = ({ testCase, onEdit, onDelete, isModified }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: testCase.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const testCaseIsModified = isModified?.(testCase) || false;
  const isNewTestCase = testCase.id.startsWith('temp-');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-dark-elevated border rounded-lg p-4 hover:border-primary-500 transition-all ${
        testCaseIsModified ? 'border-orange-500' : 'border-dark-primary'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-500 hover:text-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-1"
          aria-label="Drag to reorder test case"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="8" cy="5" r="1.5" />
            <circle cx="8" cy="12" r="1.5" />
            <circle cx="8" cy="19" r="1.5" />
            <circle cx="16" cy="5" r="1.5" />
            <circle cx="16" cy="12" r="1.5" />
            <circle cx="16" cy="19" r="1.5" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h4 className="font-semibold text-white mb-1 flex items-center gap-2">
                <span>{testCase.title}</span>
                {testCaseIsModified && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    {isNewTestCase ? 'New' : 'Edited'}
                  </span>
                )}
              </h4>
              {testCase.description && (
                <p className="text-sm text-gray-400 line-clamp-2">{testCase.description}</p>
              )}
            </div>
            <Badge priority={testCase.priority} />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(testCase)}
            aria-label={`Edit ${testCase.title}`}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(testCase)}
            aria-label={`Delete ${testCase.title}`}
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};
