'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ChecklistModuleWithResults, TestStatus } from '@/types/checklist';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TestCaseRow } from './TestCaseRow';

export interface TestExecutionProps {
  projectName: string;
  modules: ChecklistModuleWithResults[];
  totalTests: number;
  pendingTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  overallProgress: number;
  onUpdateTestResult: (resultId: string, status: TestStatus, notes?: string) => Promise<void>;
  isLoading?: boolean;
}

type FilterType = 'All' | 'Pending' | 'Pass' | 'Fail' | 'Skipped';
type SortType = 'module' | 'status' | 'priority';

export const TestExecution: React.FC<TestExecutionProps> = ({
  projectName,
  modules,
  totalTests,
  pendingTests,
  passedTests,
  failedTests,
  skippedTests,
  overallProgress,
  onUpdateTestResult,
  isLoading = false,
}) => {
  // Ensure modules is always an array
  const safeModules = Array.isArray(modules) ? modules : [];

  const [filter, setFilter] = useState<FilterType>('All');
  const [sort, setSort] = useState<SortType>('module');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(() =>
    new Set(safeModules.map((m) => m.id))
  );

  // Auto-expand newly added modules
  useEffect(() => {
    const currentModuleIds = new Set(safeModules.map((m) => m.id));
    const expandedIds = new Set(expandedModules);

    // Check if there are new modules not in expandedModules
    let hasNewModules = false;
    currentModuleIds.forEach((id) => {
      if (!expandedIds.has(id)) {
        expandedIds.add(id);
        hasNewModules = true;
      }
    });

    // Update expandedModules if we found new modules
    if (hasNewModules) {
      console.log('[DEBUG] Auto-expanding newly added modules');
      setExpandedModules(expandedIds);
    }
  }, [safeModules]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const toggleAllModules = () => {
    if (expandedModules.size === safeModules.length) {
      setExpandedModules(new Set());
    } else {
      setExpandedModules(new Set(safeModules.map((m) => m.id)));
    }
  };

  // Filter and sort modules
  const filteredModules = useMemo(() => {
    console.log('[DEBUG TestExecution] safeModules count:', safeModules.length);
    const result = safeModules
      .map((module) => {
        const filteredTests =
          filter === 'All'
            ? module.testResults
            : module.testResults.filter((test) => test.status === filter);

        return { ...module, testResults: filteredTests };
      })
      .filter((module) => {
        const hasTests = module.testResults.length > 0;
        if (!hasTests) {
          console.log('[DEBUG TestExecution] Filtering out module (no tests):', module.moduleName);
        }
        return hasTests;
      });
    console.log('[DEBUG TestExecution] After filtering:', result.length, 'modules');
    return result;
  }, [safeModules, filter]);

  const sortedModules = useMemo(() => {
    if (sort === 'module') {
      return [...filteredModules].sort((a, b) => a.orderIndex - b.orderIndex);
    }
    if (sort === 'status') {
      return [...filteredModules].sort((a, b) => a.progress - b.progress);
    }
    if (sort === 'priority') {
      return [...filteredModules].sort((a, b) => {
        const aPriority = Math.max(
          ...a.testResults.map((t) =>
            t.testcasePriority === 'High' ? 3 : t.testcasePriority === 'Medium' ? 2 : 1
          )
        );
        const bPriority = Math.max(
          ...b.testResults.map((t) =>
            t.testcasePriority === 'High' ? 3 : t.testcasePriority === 'Medium' ? 2 : 1
          )
        );
        return bPriority - aPriority;
      });
    }
    return filteredModules;
  }, [filteredModules, sort]);

  const getDisplayName = (module: ChecklistModuleWithResults) => {
    if (module.instanceLabel) {
      return `${module.moduleName} - ${module.instanceLabel}`;
    }
    return `${module.moduleName} (${module.instanceNumber})`;
  };

  const filterButtons: { type: FilterType; label: string; count: number; color: string }[] = [
    { type: 'All', label: 'All', count: totalTests, color: 'bg-dark-elevated' },
    { type: 'Pending', label: 'Pending', count: pendingTests, color: 'bg-gray-600' },
    { type: 'Pass', label: 'Pass', count: passedTests, color: 'bg-green-600' },
    { type: 'Fail', label: 'Fail', count: failedTests, color: 'bg-red-600' },
    { type: 'Skipped', label: 'Skipped', count: skippedTests, color: 'bg-yellow-600' },
  ];

  return (
    <div className="h-full flex flex-col bg-dark-bg overflow-hidden">
      {/* Header */}
      <div className="bg-dark-surface border-b border-dark-border p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-white mb-4">Test Execution</h1>

        {/* Overall Progress */}
        <div className="mb-4">
          <ProgressBar value={overallProgress} size="lg" showLabel={true} />
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
          {filterButtons.map((btn) => (
            <div
              key={btn.type}
              className={`${btn.color} rounded-lg p-3 text-center ${
                btn.type !== 'All' ? 'text-white' : 'text-dark-text-primary'
              }`}
            >
              <div className="text-2xl font-bold">{btn.count}</div>
              <div className="text-xs opacity-80">{btn.label}</div>
            </div>
          ))}
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-text-secondary">Filter:</span>
            {filterButtons.map((btn) => (
              <button
                key={btn.type}
                onClick={() => setFilter(btn.type)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                  focus:outline-none focus:ring-2 focus:ring-primary-500
                  ${
                    filter === btn.type
                      ? 'bg-primary-500 text-white shadow-lg'
                      : 'bg-dark-elevated text-dark-text-secondary hover:bg-dark-border'
                  }
                `}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-text-secondary">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortType)}
              className="px-3 py-1.5 bg-dark-elevated border border-dark-border rounded-lg text-dark-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="module">By Module</option>
              <option value="status">By Progress</option>
              <option value="priority">By Priority</option>
            </select>
          </div>

          {/* Expand/Collapse All */}
          <Button size="sm" variant="ghost" onClick={toggleAllModules}>
            {expandedModules.size === safeModules.length ? 'Collapse All' : 'Expand All'}
          </Button>
        </div>
      </div>

      {/* Test Cases */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-surface rounded-lg p-4 animate-pulse">
                <div className="h-6 bg-dark-border rounded w-1/3 mb-3"></div>
                <div className="h-4 bg-dark-border rounded w-full mb-2"></div>
                <div className="h-4 bg-dark-border rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : sortedModules.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-dark-text-secondary">
              {filter === 'All'
                ? 'No test cases available. Add modules to the checklist to get started.'
                : `No ${filter.toLowerCase()} tests found.`}
            </p>
            {safeModules.length > sortedModules.length && (
              <p className="text-dark-text-tertiary text-sm mt-2">
                ({safeModules.length - sortedModules.length} module(s) hidden - no test cases)
              </p>
            )}
          </div>
        ) : (
          <>
            {safeModules.length > sortedModules.length && (
              <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-400 text-sm">
                  ℹ️ {safeModules.length - sortedModules.length} module(s) are hidden because they have no test cases.
                </p>
              </div>
            )}
            <div className="space-y-4">
              {sortedModules.map((module) => {
                const isExpanded = expandedModules.has(module.id);
                return (
                <div
                  key={module.id}
                  className="bg-dark-surface border border-dark-border rounded-lg overflow-hidden"
                >
                  {/* Module Header */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-elevated transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                    aria-expanded={isExpanded}
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-dark-text-secondary transition-transform ${
                          isExpanded ? 'rotate-90' : ''
                        }`}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M9 5l7 7-7 7"></path>
                      </svg>
                      <h3 className="text-lg font-semibold text-white">{getDisplayName(module)}</h3>
                      <Badge variant="outline" className="text-xs">
                        {module.testResults.length} test{module.testResults.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="w-48">
                      <ProgressBar value={module.progress} size="sm" showLabel={true} />
                    </div>
                  </button>

                  {/* Module Test Cases */}
                  {isExpanded && (
                    <div className="p-4 space-y-3 bg-dark-bg">
                      {module.testResults.map((testResult) => (
                        <TestCaseRow
                          key={testResult.id}
                          testResult={testResult}
                          onStatusChange={onUpdateTestResult}
                        />
                      ))}
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
