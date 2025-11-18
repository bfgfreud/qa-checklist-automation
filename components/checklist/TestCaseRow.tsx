'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChecklistTestResult, TestStatus } from '@/types/checklist';
import { Badge } from '@/components/ui/Badge';

export interface TestCaseRowProps {
  testResult: ChecklistTestResult;
  onStatusChange: (resultId: string, status: TestStatus, notes?: string) => Promise<void>;
}

export const TestCaseRow: React.FC<TestCaseRowProps> = ({ testResult, onStatusChange }) => {
  const [isNotesExpanded, setIsNotesExpanded] = useState(false);
  const [notes, setNotes] = useState(testResult.notes || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const notesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setNotes(testResult.notes || '');
  }, [testResult.notes]);

  // Auto-expand notes when status is Fail
  useEffect(() => {
    if (testResult.status === 'Fail') {
      setIsNotesExpanded(true);
    }
  }, [testResult.status]);

  const handleStatusChange = async (newStatus: TestStatus) => {
    if (isUpdating || newStatus === testResult.status) return;

    setIsUpdating(true);
    try {
      await onStatusChange(testResult.id, newStatus, notes);

      // Auto-expand notes for Fail status
      if (newStatus === 'Fail') {
        setIsNotesExpanded(true);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);

    // Debounce auto-save
    if (notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current);
    }

    notesTimeoutRef.current = setTimeout(() => {
      onStatusChange(testResult.id, testResult.status, value);
    }, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === 'Space' && e.target === e.currentTarget) {
      e.preventDefault();
      const nextStatus: TestStatus =
        testResult.status === 'Pending'
          ? 'Pass'
          : testResult.status === 'Pass'
          ? 'Fail'
          : testResult.status === 'Fail'
          ? 'Skipped'
          : 'Pending';
      handleStatusChange(nextStatus);
    }
  };

  const priorityColors = {
    High: 'bg-red-500/10 text-red-400 border-red-500/30',
    Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    Low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  };

  const statusButtons: { status: TestStatus; label: string; color: string }[] = [
    { status: 'Pending', label: 'Pending', color: 'bg-gray-600 hover:bg-gray-500 text-gray-200' },
    { status: 'Pass', label: 'Pass', color: 'bg-green-600 hover:bg-green-500 text-white' },
    { status: 'Fail', label: 'Fail', color: 'bg-red-600 hover:bg-red-500 text-white' },
    { status: 'Skipped', label: 'Skipped', color: 'bg-yellow-600 hover:bg-yellow-500 text-white' },
  ];

  return (
    <div
      className="bg-dark-surface border border-dark-border rounded-lg p-4 hover:border-primary-500/30 transition-colors"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      data-testid={`test-case-${testResult.id}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Test Case Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="text-base font-medium text-dark-text-primary truncate">
              {testResult.testcaseTitle}
            </h4>
            <Badge variant="outline" className={`${priorityColors[testResult.testcasePriority]} text-xs`}>
              {testResult.testcasePriority}
            </Badge>
          </div>
          {testResult.testcaseDescription && (
            <p className="text-sm text-dark-text-secondary mb-3 line-clamp-2">
              {testResult.testcaseDescription}
            </p>
          )}
          {testResult.testedAt && (
            <p className="text-xs text-dark-text-tertiary">
              Last updated: {new Date(testResult.testedAt).toLocaleString()}
            </p>
          )}
        </div>

        {/* Status Buttons */}
        <div className="flex gap-2 flex-shrink-0">
          {statusButtons.map((btn) => (
            <button
              key={btn.status}
              onClick={() => handleStatusChange(btn.status)}
              disabled={isUpdating}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-dark-bg
                disabled:opacity-50 disabled:cursor-not-allowed
                ${testResult.status === btn.status ? btn.color + ' ring-2 ring-white/20 shadow-lg' : 'bg-dark-elevated hover:bg-dark-border text-dark-text-secondary'}
              `}
              aria-label={`Mark as ${btn.label}`}
              aria-pressed={testResult.status === btn.status}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      <div className="mt-3">
        <button
          onClick={() => setIsNotesExpanded(!isNotesExpanded)}
          className="text-sm text-primary-500 hover:text-primary-400 focus:outline-none focus:underline"
          aria-expanded={isNotesExpanded}
        >
          {isNotesExpanded ? 'Hide Notes' : 'Add Notes'}
        </button>
        {isNotesExpanded && (
          <textarea
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            placeholder="Add notes about this test (e.g., failure reason, observations)..."
            className="mt-2 w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-dark-text-primary placeholder-dark-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={3}
            aria-label="Test case notes"
          />
        )}
      </div>
    </div>
  );
};
