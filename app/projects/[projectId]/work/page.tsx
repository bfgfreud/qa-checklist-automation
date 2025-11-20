'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import { Tester } from '@/types/tester';
import { ProjectChecklistWithTesters, TestStatus } from '@/types/checklist';
import { Button } from '@/components/ui/Button';
import { TesterAvatar } from '@/components/ui/TesterAvatar';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { ImageGallery } from '@/components/ui/ImageGallery';
import { useCurrentTester } from '@/contexts/TesterContext';

export default function WorkingModePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { currentTester } = useCurrentTester();

  const [project, setProject] = useState<Project | null>(null);
  const [checklist, setChecklist] = useState<ProjectChecklistWithTesters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'all' shows all testers, 'single' shows one tester's view
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [selectedTester, setSelectedTester] = useState<Tester | null>(null);

  // Expanded test cases (for notes and attachments)
  // Default: all expanded. Format: `${testCaseId}-${testerId}`
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // Polling interval (5 seconds)
  const [isPolling, setIsPolling] = useState(true);

  // Track pending updates to prevent polling from overwriting optimistic updates
  const pendingUpdatesRef = useRef<Set<string>>(new Set());
  const pausePollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track local edits to preserve them during polling
  const localEditsRef = useRef<{
    [resultId: string]: {
      notes?: string;
      status?: TestStatus;
      testedAt?: string;
      lastActivity?: number;
    }
  }>({});

  // Helper to check if two objects are deeply equal
  const isDeepEqual = (obj1: any, obj2: any): boolean => {
    if (obj1 === obj2) return true;
    if (obj1 == null || obj2 == null) return false;
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) return false;

    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!isDeepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  };

  // Load project and checklist data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [projectRes, checklistRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/checklists/${projectId}?view=multi-tester`),
      ]);

      const [projectResult, checklistResult] = await Promise.all([
        projectRes.ok ? projectRes.json() : null,
        checklistRes.ok ? checklistRes.json() : null,
      ]);

      if (projectResult?.success) {
        // Only update project if it changed
        if (!isDeepEqual(project, projectResult.data)) {
          setProject(projectResult.data);
        }
      }

      if (checklistResult?.success) {
        const serverData: ProjectChecklistWithTesters = checklistResult.data;

        // Auto-assign current tester if not already assigned
        if (currentTester) {
          const isAssigned = serverData.assignedTesters?.some(t => t.id === currentTester.id);

          if (!isAssigned) {
            // Silently assign current tester to project
            try {
              await fetch(`/api/projects/${projectId}/testers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testerId: currentTester.id })
              });

              // Reload data to get updated assignments
              await fetchData(showLoading);
              return;
            } catch (err) {
              console.error('Error auto-assigning tester:', err);
            }
          }
        }

        // Build the new checklist state
        let newChecklist: ProjectChecklistWithTesters;

        // If user has active edits, merge with server data
        if (Object.keys(localEditsRef.current).length > 0) {
          console.log('[Polling] Merging server data with local edits:', Object.keys(localEditsRef.current));

          // Start with server data structure, preserving object references where possible
          newChecklist = {
            ...serverData,
            modules: serverData.modules.map(module => ({
              ...module,
              testCases: module.testCases.map(testCase => {
                const results = testCase.results.map(result => {
                  const localEdit = localEditsRef.current[result.id];

                  if (localEdit) {
                    console.log(`[Polling] Applying local edit to result ${result.id}`);
                    // Apply local edits on top of server data
                    return {
                      ...result,
                      status: localEdit.status !== undefined ? localEdit.status : result.status,
                      notes: localEdit.notes !== undefined ? localEdit.notes : result.notes,
                      testedAt: localEdit.testedAt !== undefined ? localEdit.testedAt : result.testedAt,
                    };
                  }

                  return result;
                });

                // Recalculate overall status
                const statuses = results.map(r => r.status);
                return {
                  ...testCase,
                  results,
                  overallStatus: getWeakestStatus(statuses)
                };
              })
            }))
          };
        } else {
          // No local edits - use server data as-is
          newChecklist = serverData;
        }

        // CRITICAL: Only update state if checklist actually changed
        // This prevents unnecessary re-renders and scroll jumps
        if (!checklist || !isDeepEqual(checklist, newChecklist)) {
          console.log('[Polling] Checklist changed, updating state');
          setChecklist(newChecklist);
        } else {
          console.log('[Polling] No changes detected, skipping state update');
        }

        // If only one tester, default to single view with current user
        if (serverData.assignedTesters && serverData.assignedTesters.length === 1 && !selectedTester) {
          setViewMode('single');
          setSelectedTester(currentTester || serverData.assignedTesters[0]);
        }

        // If multiple testers and current user hasn't selected yet, default to current user in single view
        if (serverData.assignedTesters && serverData.assignedTesters.length > 1 && !selectedTester && currentTester) {
          const currentUserIsAssigned = serverData.assignedTesters.some(t => t.id === currentTester.id);
          if (currentUserIsAssigned) {
            setSelectedTester(currentTester);
          }
        }
      }
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load - reload when currentTester changes (e.g., user switches identity)
  useEffect(() => {
    fetchData();
  }, [projectId, currentTester?.id]);

  // Initialize all testcases as expanded by default
  useEffect(() => {
    if (!checklist) return;

    const allTestIds = new Set<string>();
    checklist.modules.forEach((module) => {
      module.testCases.forEach((testCase) => {
        testCase.results.forEach((result) => {
          // Only expand non-Pass results by default (optimization)
          // Actually, user wants all expanded by default, so expand all
          allTestIds.add(`${testCase.testCase.id}-${result.tester.id}`);
        });
      });
    });

    setExpandedTests(allTestIds);
  }, [checklist?.modules.length]); // Only run when modules count changes (initial load)

  // Polling for updates (every 5 seconds)
  // Now safe to poll even with local edits - they'll be preserved!
  useEffect(() => {
    if (!isPolling) return;

    const intervalId = setInterval(() => {
      fetchData(false); // Don't show loading spinner on poll
    }, 5000);

    return () => clearInterval(intervalId);
  }, [projectId, isPolling]);

  // Toggle test case expansion
  const toggleTestExpansion = (testCaseId: string) => {
    setExpandedTests((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  };

  // Debounced notes update
  const notesTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});
  const notesClearTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateTestNotes = (resultId: string, testerId: string, notes: string, currentStatus: TestStatus) => {
    // Store local edit immediately to preserve it during polling
    localEditsRef.current[resultId] = {
      ...localEditsRef.current[resultId],
      notes,
      lastActivity: Date.now() // Track last typing activity
    };

    // Clear existing timeouts for this result
    if (notesTimeoutRef.current[resultId]) {
      clearTimeout(notesTimeoutRef.current[resultId]);
    }
    if (notesClearTimeoutRef.current[resultId]) {
      clearTimeout(notesClearTimeoutRef.current[resultId]);
    }

    // Set new timeout for auto-save (1.5 seconds after user stops typing)
    notesTimeoutRef.current[resultId] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/checklists/test-results/${resultId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testerId, status: currentStatus, notes }),
        });

        if (!response.ok) {
          throw new Error('Failed to save notes');
        }

        console.log(`[Notes] Saved successfully for ${resultId}, will clear local edit after 10s of inactivity`);

        // Clear local edit after 10 seconds of NO MORE TYPING
        // This is longer than the save debounce, so it only clears if user has stopped working
        notesClearTimeoutRef.current[resultId] = setTimeout(() => {
          const edit = localEditsRef.current[resultId];
          if (edit && edit.lastActivity) {
            const timeSinceLastActivity = Date.now() - edit.lastActivity;
            // Only clear if more than 10 seconds since last typing
            if (timeSinceLastActivity >= 10000) {
              console.log(`[Notes] Clearing local edit for ${resultId} after inactivity`);
              delete localEditsRef.current[resultId];
            }
          }
        }, 10000);

      } catch (err) {
        console.error('Error saving notes:', err);
        alert('Failed to save notes. Please try again.');
        // Keep local edit on error so user doesn't lose their work
      }
    }, 1500);
  };

  // Update test result status
  const statusClearTimeoutRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  const updateTestStatus = async (
    resultId: string,
    testerId: string,
    status: TestStatus,
    notes?: string,
    testCaseId?: string
  ) => {
    const testedAt = new Date().toISOString();

    // Store local edit immediately to preserve it during polling
    localEditsRef.current[resultId] = {
      ...localEditsRef.current[resultId],
      status,
      testedAt,
      lastActivity: Date.now()
    };

    // Clear any existing clear timeout
    if (statusClearTimeoutRef.current[resultId]) {
      clearTimeout(statusClearTimeoutRef.current[resultId]);
    }

    // AUTO-COLLAPSE on Pass: Remove from expanded set
    if (status === 'Pass' && testCaseId) {
      const expandKey = `${testCaseId}-${testerId}`;
      setExpandedTests(prev => {
        const newSet = new Set(prev);
        newSet.delete(expandKey);
        return newSet;
      });
    }

    // Optimistically update the UI (preserve exact structure and order)
    if (checklist) {
      // CRITICAL: Shallow copy modules array to preserve order
      const updatedChecklist = {
        ...checklist,
        modules: checklist.modules.map(module => ({
          ...module,
          testCases: module.testCases.map(testCase => {
            const resultToUpdate = testCase.results.find((r: any) => r.id === resultId);

            if (resultToUpdate) {
              // Found the result to update
              const updatedResults = testCase.results.map((r: any) =>
                r.id === resultId
                  ? { ...r, status, testedAt }
                  : r
              );

              // Recalculate overall status with new data
              const statuses = updatedResults.map((r: any) => r.status);

              return {
                ...testCase,
                results: updatedResults,
                overallStatus: getWeakestStatus(statuses)
              };
            }

            return testCase; // No change for this test case
          })
        }))
      };

      setChecklist(updatedChecklist);
    }

    try {
      const response = await fetch(`/api/checklists/test-results/${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerId, status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update test result');
      }

      console.log(`[Status] Updated successfully for ${resultId}, will clear after 10s inactivity`);

      // Clear local edit after 10 seconds of no more clicks
      statusClearTimeoutRef.current[resultId] = setTimeout(() => {
        const edit = localEditsRef.current[resultId];
        if (edit && edit.lastActivity) {
          const timeSinceLastActivity = Date.now() - edit.lastActivity;
          if (timeSinceLastActivity >= 10000) {
            console.log(`[Status] Clearing local edit for ${resultId} after inactivity`);
            delete localEditsRef.current[resultId];
          }
        }
      }, 10000);

    } catch (err) {
      console.error('Error updating test result:', err);
      alert('Failed to update test result. Please try again.');
      // Keep local edit on error so user doesn't lose their change
      fetchData(false);
    }
  };

  // Calculate weakest status (Fail > Skipped > Pass > Pending)
  const getWeakestStatus = (statuses: TestStatus[]): TestStatus => {
    if (statuses.includes('Fail')) return 'Fail';
    if (statuses.includes('Skipped')) return 'Skipped';
    if (statuses.includes('Pass')) return 'Pass';
    return 'Pending';
  };

  // Prompt user to set their name first
  if (!currentTester) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center max-w-md">
          <svg className="w-16 h-16 text-primary-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-2xl font-bold text-white mb-2">Set Your Name First</h2>
          <p className="text-gray-400 mb-6">
            Please click "Set Your Name" in the top-right corner to identify yourself before working on tests.
          </p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !project || !checklist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Checklist not found'}</p>
          <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  // Calculate overall stats
  const stats = {
    total: 0,
    pending: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  checklist.modules.forEach((module) => {
    module.testCases.forEach((testCase) => {
      stats.total++;
      switch (testCase.overallStatus) {
        case 'Pending':
          stats.pending++;
          break;
        case 'Pass':
          stats.passed++;
          break;
        case 'Fail':
          stats.failed++;
          break;
        case 'Skipped':
          stats.skipped++;
          break;
      }
    });
  });

  const progress = stats.total > 0
    ? Math.round(((stats.passed + stats.failed + stats.skipped) / stats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-primary sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Left: Back button and title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="text-primary-500 hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-2"
                aria-label="Back to project overview"
              >
                <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <p className="text-sm text-gray-400">Test Execution</p>
              </div>
            </div>

            {/* Right: Stats and view toggle */}
            <div className="flex items-center gap-6">
              {/* Polling Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isPolling ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
                <span className="text-xs text-gray-500">
                  {isPolling ? 'Live' : 'Paused'}
                </span>
                {/* Debug: Show active edits count */}
                {Object.keys(localEditsRef.current).length > 0 && (
                  <span className="text-xs text-yellow-400 ml-2">
                    ({Object.keys(localEditsRef.current).length} unsaved)
                  </span>
                )}
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-primary-500">{progress}%</div>
                  <div className="text-xs text-gray-500">Progress</div>
                </div>
                <div className="text-gray-400">{stats.pending}</div>
                <div className="text-green-400">{stats.passed}</div>
                <div className="text-red-400">{stats.failed}</div>
                <div className="text-yellow-400">{stats.skipped}</div>
              </div>

              {/* View Mode Toggle (only if multiple testers) */}
              {checklist.assignedTesters && checklist.assignedTesters.length > 1 && (
                <div className="flex items-center gap-2 bg-dark-elevated rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('all')}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      viewMode === 'all'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    All Testers
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('single');
                      // Set to current tester when switching to "My Tests Only"
                      if (currentTester) {
                        setSelectedTester(currentTester);
                      }
                    }}
                    className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                      viewMode === 'single'
                        ? 'bg-primary-500 text-white'
                        : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    My Tests Only
                  </button>
                </div>
              )}

              {/* Show current tester name in single view */}
              {viewMode === 'single' && currentTester && (
                <div className="flex items-center gap-2 bg-dark-elevated rounded-lg px-4 py-2 border border-dark-border">
                  <span className="text-sm text-gray-400">Viewing tests for:</span>
                  <TesterAvatar tester={currentTester} size="sm" />
                  <span className="text-sm font-medium text-white">{currentTester.name}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {checklist.modules.length === 0 ? (
          <div className="text-center py-12 bg-dark-secondary border border-dark-primary rounded-lg">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-white mb-2">No modules in checklist</h3>
            <p className="text-gray-400 mb-6">
              Add modules to the checklist before starting testing
            </p>
            <Button onClick={() => router.push(`/projects/${projectId}/edit`)}>
              Add Modules
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {checklist.modules.map((module) => (
              <div
                key={module.id}
                className="bg-dark-secondary border border-dark-primary rounded-lg overflow-hidden"
              >
                {/* Module Header - Compact */}
                <div className="px-4 py-2 bg-dark-elevated border-b border-dark-border">
                  <h2 className="text-lg font-bold text-white">
                    {module.moduleName}
                    {module.instanceLabel && module.instanceLabel !== module.moduleName && (
                      <span className="ml-2 text-sm text-primary-500">
                        ({module.instanceLabel})
                      </span>
                    )}
                  </h2>
                  {module.moduleDescription && (
                    <p className="text-xs text-gray-400 mt-0.5">{module.moduleDescription}</p>
                  )}
                </div>

                {/* Test Cases - Compact Data Sheet Layout */}
                <div className="divide-y divide-dark-border">
                  {module.testCases.map((testCase) => {
                    const testCaseId = testCase.testCase.id;

                    // Filter results based on view mode
                    const filteredResults = testCase.results.filter((result) => {
                      // Filter out Legacy Tester if real testers exist
                      const hasRealTesters = checklist.assignedTesters && checklist.assignedTesters.some(t => t.email !== 'legacy@system');
                      const isLegacyTester = result.tester.email === 'legacy@system';

                      if (hasRealTesters && isLegacyTester) {
                        return false;
                      }

                      // Apply view mode filter
                      return viewMode === 'all' || result.tester.id === selectedTester?.id;
                    });

                    return (
                      <div key={testCaseId} className="py-2 px-4">
                        {filteredResults.map((result) => {
                          const expandKey = `${testCaseId}-${result.tester.id}`;
                          const isExpanded = expandedTests.has(expandKey);
                          const isOwnResult = currentTester && result.tester.id === currentTester.id;

                          return (
                            <div key={result.id} className="py-2">
                              {/* COLLAPSED ROW: Status circle + Title | Description + Expand Arrow */}
                              <div className="flex items-center gap-3 hover:bg-dark-elevated/50 px-2 py-1.5 rounded transition-colors">
                                {/* Status Circle */}
                                <div
                                  className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                    result.status === 'Pass' ? 'bg-green-500' :
                                    result.status === 'Fail' ? 'bg-red-500' :
                                    result.status === 'Skipped' ? 'bg-yellow-500' :
                                    'bg-gray-500'
                                  }`}
                                  title={result.status}
                                />

                                {/* Title + Description (inline, same row) */}
                                <div className="flex-1 flex items-baseline gap-2 min-w-0">
                                  <h3 className="text-sm font-semibold text-white flex-shrink-0">
                                    {testCase.testCase.title}
                                  </h3>
                                  {testCase.testCase.description && (
                                    <>
                                      <span className="text-gray-600">|</span>
                                      <p className="text-xs text-gray-400 truncate">
                                        {testCase.testCase.description}
                                      </p>
                                    </>
                                  )}
                                </div>

                                {/* Priority Badge (optional, small) */}
                                <span className={`text-xs px-1.5 py-0.5 rounded flex-shrink-0 ${
                                  testCase.testCase.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                  testCase.testCase.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }`}>
                                  {testCase.testCase.priority}
                                </span>

                                {/* Tester name (for multi-tester view) */}
                                {viewMode === 'all' && (
                                  <span className="text-xs text-gray-500 flex-shrink-0">
                                    {result.tester.name}
                                  </span>
                                )}

                                {/* Expand/Collapse Arrow */}
                                <button
                                  onClick={() => toggleTestExpansion(expandKey)}
                                  className="text-gray-400 hover:text-gray-200 p-1 flex-shrink-0"
                                  aria-label={isExpanded ? "Collapse" : "Expand"}
                                >
                                  <svg
                                    className={`w-4 h-4 transition-transform ${
                                      isExpanded ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>

                              {/* EXPANDED SECTION: 3-column working area */}
                              {isExpanded && (
                                <div className="mt-2 ml-6 grid grid-cols-12 gap-4 bg-dark-elevated/30 p-3 rounded">
                                  {/* Column 1: Status Buttons (25% = 3 cols) */}
                                  <div className="col-span-3">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <label className="text-xs font-medium text-gray-400">Status</label>
                                      {result.testedAt && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(result.testedAt).toLocaleTimeString()}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {(['Pending', 'Pass', 'Fail', 'Skipped'] as TestStatus[]).map((status) => (
                                        <button
                                          key={status}
                                          onClick={() => {
                                            if (isOwnResult) {
                                              updateTestStatus(result.id, result.tester.id, status, result.notes || undefined, testCaseId);
                                            }
                                          }}
                                          disabled={!isOwnResult}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors flex-1 min-w-[60px] ${
                                            result.status === status
                                              ? status === 'Pass' ? 'bg-green-500 text-white' :
                                                status === 'Fail' ? 'bg-red-500 text-white' :
                                                status === 'Skipped' ? 'bg-yellow-500 text-white' :
                                                'bg-gray-500 text-white'
                                              : isOwnResult
                                                ? 'bg-dark-border text-gray-400 hover:bg-dark-primary cursor-pointer'
                                                : 'bg-dark-border text-gray-600 cursor-not-allowed opacity-50'
                                          }`}
                                        >
                                          {status}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Column 2: Notes (40% = 5 cols) */}
                                  <div className="col-span-5">
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                      Notes {!isOwnResult && <span className="text-xs text-gray-500">(Read-only)</span>}
                                    </label>
                                    <textarea
                                      value={result.notes || ''}
                                      onChange={(e) => {
                                        if (!isOwnResult) return;

                                        const newNotes = e.target.value;
                                        // Update local state immediately
                                        if (checklist) {
                                          const updatedChecklist = { ...checklist };
                                          updatedChecklist.modules.forEach((m) => {
                                            m.testCases.forEach((tc) => {
                                              const r = tc.results.find((res) => res.id === result.id);
                                              if (r) {
                                                r.notes = newNotes;
                                              }
                                            });
                                          });
                                          setChecklist(updatedChecklist);
                                        }
                                        // Debounced save
                                        updateTestNotes(result.id, result.tester.id, newNotes, result.status);
                                      }}
                                      onFocus={(e) => {
                                        // Expand on focus
                                        e.target.rows = 6;
                                      }}
                                      onBlur={(e) => {
                                        // Collapse on blur
                                        e.target.rows = 1;
                                      }}
                                      readOnly={!isOwnResult}
                                      placeholder={isOwnResult ? "Add notes..." : ""}
                                      className={`w-full bg-dark-bg border border-dark-border text-white rounded px-2 py-1.5 text-xs resize-none transition-all ${
                                        isOwnResult
                                          ? 'focus:outline-none focus:ring-1 focus:ring-primary-500'
                                          : 'opacity-60 cursor-not-allowed'
                                      }`}
                                      rows={1}
                                    />
                                  </div>

                                  {/* Column 3: Attachments (35% = 4 cols) */}
                                  <div className="col-span-4">
                                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                                      Attachments ({result.attachments.length})
                                    </label>

                                    {/* Compact thumbnail grid */}
                                    {result.attachments.length > 0 && (
                                      <div className="mb-2">
                                        <ImageGallery
                                          attachments={result.attachments}
                                          onDelete={isOwnResult ? (attachmentId) => {
                                            fetchData(false);
                                          } : undefined}
                                          readonly={!isOwnResult}
                                          compact={true}
                                        />
                                      </div>
                                    )}

                                    {/* Upload buttons - only show for own results */}
                                    {isOwnResult && (
                                      <ImageUploader
                                        testResultId={result.id}
                                        onUploadComplete={(url) => {
                                          fetchData(false);
                                        }}
                                        compact={true}
                                      />
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
