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
import { linkifyText } from '@/lib/utils/linkify';

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

  // Expanded attachment areas - Format: `${resultId}`
  const [expandedAttachments, setExpandedAttachments] = useState<Set<string>>(new Set());
  // Expanded read-only notes/attachments for other testers - Format: `${resultId}-notes` or `${resultId}-attachments`
  const [expandedReadOnly, setExpandedReadOnly] = useState<Set<string>>(new Set());

  // Collapsed modules - stores module IDs that are collapsed
  const [collapsedModules, setCollapsedModules] = useState<Set<string>>(new Set());

  // Status filter for testcases
  const [statusFilter, setStatusFilter] = useState<TestStatus | 'All'>('All');

  // Search query for testcases
  const [searchQuery, setSearchQuery] = useState('');

  // Polling interval (5 seconds)
  const [isPolling, setIsPolling] = useState(true);

  // Track if we're currently assigning a tester to prevent loops
  const isAssigningRef = useRef(false);

  // Track which notes field is currently focused (never clear its local edit)
  const focusedResultIdRef = useRef<string | null>(null);

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

        // Auto-assign current tester if not already assigned (only once)
        if (currentTester && !isAssigningRef.current) {
          const isAssigned = serverData.assignedTesters?.some(t => t.id === currentTester.id);

          if (!isAssigned) {
            // Set flag to prevent multiple assignment attempts
            isAssigningRef.current = true;
            console.log('[Auto-assign] Assigning current tester to project...');

            // Silently assign current tester to project
            try {
              const response = await fetch(`/api/projects/${projectId}/testers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testerId: currentTester.id })
              });

              if (response.ok) {
                console.log('[Auto-assign] Assignment successful, data will refresh via polling');
                // Don't call fetchData recursively - let the component naturally refetch
                // The useEffect below will trigger on next render cycle
              } else if (response.status === 409) {
                // Already assigned (race condition) - this is fine
                console.log('[Auto-assign] Tester already assigned (409), continuing...');
              } else {
                console.error('[Auto-assign] Assignment failed:', response.status);
              }
            } catch (err) {
              console.error('[Auto-assign] Error assigning tester:', err);
            } finally {
              // Reset flag after a short delay to allow refetch
              setTimeout(() => {
                isAssigningRef.current = false;
              }, 1000);
            }

            // Exit early - let next fetch cycle pick up the assignment
            return;
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
          allTestIds.add(`${module.id}-${testCase.testCase.id}-${result.tester.id}`);
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

  // Toggle module collapse
  const toggleModuleCollapse = (moduleId: string) => {
    setCollapsedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Quick actions
  const collapseAllModules = () => {
    if (!checklist) return;
    const allModuleIds = new Set(checklist.modules.map(m => m.id));
    setCollapsedModules(allModuleIds);
  };

  const expandAllModules = () => {
    setCollapsedModules(new Set());
  };

  const collapsePassedTests = () => {
    if (!checklist) return;
    const passedTests = new Set<string>();
    checklist.modules.forEach(module => {
      module.testCases.forEach(testCase => {
        testCase.results.forEach(result => {
          if (result.status === 'Pass') {
            const expandKey = `${module.id}-${testCase.testCase.id}-${result.tester.id}`;
            passedTests.add(expandKey);
          }
        });
      });
    });
    // Remove passed tests from expanded set (collapse them)
    setExpandedTests(prev => {
      const newSet = new Set(prev);
      passedTests.forEach(key => newSet.delete(key));
      return newSet;
    });
  };

  const expandAllTests = () => {
    if (!checklist) return;
    const allTests = new Set<string>();
    checklist.modules.forEach(module => {
      module.testCases.forEach(testCase => {
        testCase.results.forEach(result => {
          const expandKey = `${module.id}-${testCase.testCase.id}-${result.tester.id}`;
          allTests.add(expandKey);
        });
      });
    });
    setExpandedTests(allTests);
  };

  const collapseAllTests = () => {
    setExpandedTests(new Set());
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
          // NEVER clear if this field is currently focused
          if (focusedResultIdRef.current === resultId) {
            console.log(`[Notes] Skipping clear for ${resultId} - field is focused`);
            return;
          }

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
    testCaseId?: string,
    moduleId?: string
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
    if (status === 'Pass' && testCaseId && moduleId) {
      const expandKey = `${moduleId}-${testCaseId}-${testerId}`;
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
            Please click &quot;Set Your Name&quot; in the top-right corner to identify yourself before working on tests.
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
          <>
            {/* Quick Action Toolbar */}
            <div className="bg-dark-secondary border border-dark-primary rounded-lg p-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Search Bar */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Search:</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search testcases..."
                    className="px-2 py-1 bg-dark-elevated border border-dark-border text-white rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary-500 w-48"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-gray-400 hover:text-white"
                      title="Clear search"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                <span className="text-gray-600">|</span>

                {/* Module Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Modules:</span>
                  <button
                    onClick={collapseAllModules}
                    className="px-2 py-1 bg-dark-elevated hover:bg-dark-border text-gray-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={expandAllModules}
                    className="px-2 py-1 bg-dark-elevated hover:bg-dark-border text-gray-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Expand All
                  </button>
                </div>

                <span className="text-gray-600">|</span>

                {/* Testcase Actions */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Testcases:</span>
                  <button
                    onClick={expandAllTests}
                    className="px-2 py-1 bg-dark-elevated hover:bg-dark-border text-gray-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Expand All
                  </button>
                  <button
                    onClick={collapseAllTests}
                    className="px-2 py-1 bg-dark-elevated hover:bg-dark-border text-gray-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Collapse All
                  </button>
                  <button
                    onClick={collapsePassedTests}
                    className="px-2 py-1 bg-dark-elevated hover:bg-dark-border text-gray-300 hover:text-white rounded text-xs transition-colors"
                  >
                    Collapse Pass
                  </button>
                </div>

                <span className="text-gray-600">|</span>

                {/* Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">Filter:</span>
                  {(['All', 'Pending', 'Pass', 'Fail', 'Skipped'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2 py-1 rounded text-xs transition-colors ${
                        statusFilter === status
                          ? 'bg-primary-500 text-white'
                          : 'bg-dark-elevated hover:bg-dark-border text-gray-300 hover:text-white'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modules List */}
            <div className="space-y-6">
            {checklist.modules.map((module) => {
              // Calculate module-level stats
              const moduleStats = {
                total: 0,
                pending: 0,
                passed: 0,
                failed: 0,
                skipped: 0,
              };

              module.testCases.forEach((testCase) => {
                moduleStats.total++;
                switch (testCase.overallStatus) {
                  case 'Pending':
                    moduleStats.pending++;
                    break;
                  case 'Pass':
                    moduleStats.passed++;
                    break;
                  case 'Fail':
                    moduleStats.failed++;
                    break;
                  case 'Skipped':
                    moduleStats.skipped++;
                    break;
                }
              });

              const moduleProgress = moduleStats.total > 0
                ? Math.round(((moduleStats.passed + moduleStats.failed + moduleStats.skipped) / moduleStats.total) * 100)
                : 0;

              return (
              <div
                key={module.id}
                className="bg-dark-secondary border border-dark-primary rounded-lg"
              >
                {/* Module Header - Compact - Sticky */}
                <div className="px-4 py-2 bg-dark-elevated border-b border-dark-border flex items-center justify-between sticky top-[72px] z-20 rounded-t-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-white">
                        {module.moduleName}
                        {module.instanceLabel && module.instanceLabel !== module.moduleName && (
                          <span className="ml-2 text-sm text-primary-500">
                            ({module.instanceLabel})
                          </span>
                        )}
                      </h2>

                      {/* Module Progress Indicators */}
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-primary-500">{moduleProgress}%</span>
                        <span className="text-gray-500">|</span>
                        <span className="text-gray-400" title="Pending">{moduleStats.pending}</span>
                        <span className="text-green-400" title="Pass">{moduleStats.passed}</span>
                        <span className="text-red-400" title="Fail">{moduleStats.failed}</span>
                        <span className="text-yellow-400" title="Skipped">{moduleStats.skipped}</span>
                      </div>
                    </div>
                    {module.moduleDescription && (
                      <p className="text-xs text-gray-400 mt-0.5">{module.moduleDescription}</p>
                    )}
                  </div>

                  {/* Collapse/Expand Button */}
                  <button
                    onClick={() => toggleModuleCollapse(module.id)}
                    className="text-gray-400 hover:text-gray-200 p-1 flex-shrink-0 ml-2"
                    aria-label={collapsedModules.has(module.id) ? "Expand module" : "Collapse module"}
                  >
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        collapsedModules.has(module.id) ? '' : 'rotate-180'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Test Cases - Compact Data Sheet Layout */}
                {!collapsedModules.has(module.id) && (
                  <div className="divide-y divide-dark-border">
                  {module.testCases
                    .filter((testCase) => {
                      // Apply status filter
                      if (statusFilter !== 'All') {
                        // In single-tester view, filter by current tester's status
                        // In multi-tester view, filter by overall status
                        if (viewMode === 'single' && selectedTester) {
                          const selectedTesterResult = testCase.results.find(r => r.tester.id === selectedTester.id);
                          if (!selectedTesterResult || selectedTesterResult.status !== statusFilter) {
                            return false;
                          }
                        } else {
                          // Multi-tester view: use overall status
                          if (testCase.overallStatus !== statusFilter) {
                            return false;
                          }
                        }
                      }

                      // Apply search filter
                      if (searchQuery.trim()) {
                        const query = searchQuery.toLowerCase();
                        const titleMatch = testCase.testCase.title.toLowerCase().includes(query);
                        const descMatch = testCase.testCase.description?.toLowerCase().includes(query);
                        return titleMatch || descMatch;
                      }

                      return true;
                    })
                    .map((testCase) => {
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

                    // Separate own result from others
                    const ownResult = filteredResults.find(r => currentTester && r.tester.id === currentTester.id);
                    const otherResults = filteredResults.filter(r => !currentTester || r.tester.id !== currentTester.id);

                    // Render own result
                    const renderOwnResult = () => {
                      if (!ownResult) return null;

                      const result = ownResult;
                      const expandKey = `${module.id}-${testCaseId}-${result.tester.id}`;
                      const isExpanded = expandedTests.has(expandKey);
                      const isOwnResult = true;

                      return (
                        <div key={result.id} className="py-0.5">
                          {/* COLLAPSED ROW: Status circle + Title | Description + Expand Arrow */}
                          <div className="flex items-center gap-2 hover:bg-dark-elevated/50 px-2 py-0.5 rounded transition-colors">
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

                                {/* Note/Image Indicators */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {/* Note Icon */}
                                  {result.notes && result.notes.trim() && (
                                    <div className="text-blue-400" title="Has notes">
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                      </svg>
                                    </div>
                                  )}
                                  {/* Image Icon with Count */}
                                  {result.attachments && result.attachments.length > 0 && (
                                    <div className="flex items-center gap-0.5 text-purple-400" title={`${result.attachments.length} image(s)`}>
                                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                      </svg>
                                      <span className="text-xs">({result.attachments.length})</span>
                                    </div>
                                  )}
                                </div>

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
                                <div className="mt-2 ml-6 grid grid-cols-12 gap-4 bg-dark-elevated/30 p-3 rounded items-start">
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
                                              updateTestStatus(result.id, result.tester.id, status, result.notes || undefined, testCaseId, module.id);
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

                                    {/* Own Result - Editable Textarea */}
                                    {isOwnResult && (
                                      <textarea
                                        value={result.notes || ''}
                                        onChange={(e) => {
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
                                          // Track focus to prevent clearing local edit
                                          focusedResultIdRef.current = result.id;
                                          // Expand on focus
                                          e.target.rows = 6;
                                        }}
                                        onBlur={(e) => {
                                          // Clear focus tracking
                                          focusedResultIdRef.current = null;
                                          // Collapse on blur
                                          e.target.rows = 1;
                                        }}
                                        placeholder="Add notes..."
                                        className="w-full bg-dark-bg border border-dark-border text-white rounded px-2 py-1 text-xs leading-tight resize-none transition-all focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        rows={1}
                                      />
                                    )}

                                    {/* Other Tester - Compact Expandable View */}
                                    {!isOwnResult && (
                                      <div>
                                        {!expandedReadOnly.has(`${result.id}-notes`) ? (
                                          /* Collapsed - 1 line */
                                          <div
                                            onClick={() => {
                                              if (result.notes && result.notes.trim()) {
                                                setExpandedReadOnly(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.add(`${result.id}-notes`);
                                                  return newSet;
                                                });
                                              }
                                            }}
                                            className={`border border-dark-border rounded px-2 py-1 text-xs leading-tight transition-colors ${
                                              result.notes && result.notes.trim()
                                                ? 'cursor-pointer hover:border-blue-500/50 text-gray-400'
                                                : 'text-gray-600'
                                            }`}
                                            title={result.notes && result.notes.trim() ? "Click to view notes" : "No notes"}
                                          >
                                            {result.notes && result.notes.trim() ? (
                                              <span className="truncate block">📝 {linkifyText(result.notes)}</span>
                                            ) : (
                                              <span>No notes</span>
                                            )}
                                          </div>
                                        ) : (
                                          /* Expanded - Full view */
                                          <div className="border border-blue-500 rounded p-1 bg-blue-500/5">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-gray-400">Notes</span>
                                              <button
                                                onClick={() => {
                                                  setExpandedReadOnly(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(`${result.id}-notes`);
                                                    return newSet;
                                                  });
                                                }}
                                                className="text-xs text-gray-500 hover:text-white"
                                              >
                                                Collapse ▲
                                              </button>
                                            </div>
                                            <div className="bg-dark-bg border border-dark-border rounded px-2 py-1.5 text-xs text-gray-300 whitespace-pre-wrap">
                                              {result.notes ? linkifyText(result.notes) : ''}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Column 3: Attachments (35% = 4 cols) */}
                                  <div className="col-span-4">
                                    <div className="flex items-center justify-between mb-1.5">
                                      <label className="text-xs font-medium text-gray-400">
                                        Attachments ({result.attachments.length})
                                      </label>
                                      {/* Upload button - inline with label */}
                                      {isOwnResult && (
                                        <ImageUploader
                                          testResultId={result.id}
                                          onUploadComplete={(url) => {
                                            fetchData(false);
                                          }}
                                          compact={true}
                                          hidePaste={true}
                                          hideHelperText={true}
                                        />
                                      )}
                                    </div>

                                    {/* Compact Attachment Cell (Google Sheets style) */}
                                    {isOwnResult && (
                                      <div>
                                        {/* Collapsed View - Single Line */}
                                        {!expandedAttachments.has(result.id) && (
                                          <div
                                            contentEditable={true}
                                            suppressContentEditableWarning
                                            onKeyDown={(e) => {
                                              // Prevent all typing - only allow paste
                                              if (e.key !== 'v' || !e.ctrlKey) {
                                                e.preventDefault();
                                              }
                                            }}
                                            onInput={(e) => {
                                              // Clear any text that gets typed
                                              e.currentTarget.textContent = '';
                                            }}
                                            onPaste={async (e) => {
                                              e.preventDefault();
                                              const items = e.clipboardData?.items;
                                              if (!items) return;

                                              const imageFiles: File[] = [];
                                              for (let i = 0; i < items.length; i++) {
                                                const item = items[i];
                                                if (item.type.startsWith('image/')) {
                                                  const file = item.getAsFile();
                                                  if (file) imageFiles.push(file);
                                                }
                                              }

                                              if (imageFiles.length > 0) {
                                                for (const file of imageFiles) {
                                                  const formData = new FormData();
                                                  formData.append('file', file);

                                                  try {
                                                    const response = await fetch(`/api/test-results/${result.id}/attachments`, {
                                                      method: 'POST',
                                                      body: formData,
                                                    });

                                                    if (response.ok) {
                                                      fetchData(false);
                                                    }
                                                  } catch (error) {
                                                    console.error('Upload error:', error);
                                                  }
                                                }
                                              }
                                            }}
                                            onClick={() => {
                                              if (result.attachments.length > 0) {
                                                setExpandedAttachments(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.add(result.id);
                                                  return newSet;
                                                });
                                              }
                                            }}
                                            onFocus={(e) => {
                                              e.currentTarget.style.borderColor = '#3b82f6';
                                              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                                            }}
                                            onBlur={(e) => {
                                              e.currentTarget.style.borderColor = '';
                                              e.currentTarget.style.backgroundColor = '';
                                            }}
                                            className="border border-dashed border-dark-border rounded px-2 py-1 cursor-pointer transition-colors hover:border-primary-500/50 text-xs leading-tight text-gray-500"
                                            title="Click to expand or press Ctrl+V to paste"
                                            spellCheck="false"
                                          >
                                            {result.attachments.length > 0 ? (
                                              <span className="pointer-events-none select-none">
                                                📎 {result.attachments.length} image{result.attachments.length > 1 ? 's' : ''} • Click to view
                                              </span>
                                            ) : (
                                              <span className="pointer-events-none select-none">
                                                Click here and press Ctrl+V to paste
                                              </span>
                                            )}
                                          </div>
                                        )}

                                        {/* Expanded View - Show Thumbnails */}
                                        {expandedAttachments.has(result.id) && (
                                          <div className="border-2 border-primary-500 rounded p-1 bg-primary-500/5">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-gray-400">Image Attachments</span>
                                              <button
                                                onClick={() => {
                                                  setExpandedAttachments(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(result.id);
                                                    return newSet;
                                                  });
                                                }}
                                                className="text-xs text-gray-500 hover:text-white"
                                              >
                                                Collapse ▲
                                              </button>
                                            </div>
                                            <ImageGallery
                                              attachments={result.attachments}
                                              onDelete={(attachmentId) => {
                                                fetchData(false);
                                              }}
                                              readonly={false}
                                              compact={true}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}

                                    {/* Read-only view for non-owners - Compact Expandable */}
                                    {!isOwnResult && (
                                      <div>
                                        {!expandedReadOnly.has(`${result.id}-attachments`) ? (
                                          /* Collapsed - 1 line */
                                          <div
                                            onClick={() => {
                                              if (result.attachments.length > 0) {
                                                setExpandedReadOnly(prev => {
                                                  const newSet = new Set(prev);
                                                  newSet.add(`${result.id}-attachments`);
                                                  return newSet;
                                                });
                                              }
                                            }}
                                            className={`border border-dark-border rounded px-2 py-1 text-xs leading-tight transition-colors ${
                                              result.attachments.length > 0
                                                ? 'cursor-pointer hover:border-purple-500/50 text-gray-400'
                                                : 'text-gray-600'
                                            }`}
                                            title={result.attachments.length > 0 ? "Click to view images" : "No images"}
                                          >
                                            {result.attachments.length > 0 ? (
                                              <span>📎 {result.attachments.length} image{result.attachments.length > 1 ? 's' : ''} • Click to view</span>
                                            ) : (
                                              <span>No images</span>
                                            )}
                                          </div>
                                        ) : (
                                          /* Expanded - Show thumbnails */
                                          <div className="border border-purple-500 rounded p-1 bg-purple-500/5">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-gray-400">Images ({result.attachments.length})</span>
                                              <button
                                                onClick={() => {
                                                  setExpandedReadOnly(prev => {
                                                    const newSet = new Set(prev);
                                                    newSet.delete(`${result.id}-attachments`);
                                                    return newSet;
                                                  });
                                                }}
                                                className="text-xs text-gray-500 hover:text-white"
                                              >
                                                Collapse ▲
                                              </button>
                                            </div>
                                            <ImageGallery
                                              attachments={result.attachments}
                                              onDelete={() => {}}
                                              readonly={true}
                                              compact={true}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        };

                    return (
                      <div key={testCaseId} className="py-0.5 px-4">
                        {/* OWN RESULT - Full UI */}
                        {renderOwnResult()}

                        {/* OTHER TESTERS - Compact 1-line View */}
                        {otherResults.length > 0 && (
                          <div className="ml-6 mt-1 mb-3 space-y-0.5">
                            {otherResults.map((result) => {
                              const notesKey = `${result.id}-notes-expanded`;
                              const imagesKey = `${result.id}-images-popup`;
                              const notesExpanded = expandedReadOnly.has(notesKey);

                              return (
                                <div key={result.id} className="flex items-center gap-2 px-2 py-0.5 text-xs hover:bg-dark-elevated/30 rounded">
                                  {/* Tester Name - Colored Badge (same color as avatar) */}
                                  <span
                                    className="px-1.5 py-0.5 rounded border font-medium text-xs text-white"
                                    style={{
                                      backgroundColor: `${result.tester.color}33`, // 20% opacity
                                      borderColor: `${result.tester.color}66`, // 40% opacity
                                      color: result.tester.color
                                    }}
                                  >
                                    {result.tester.name}
                                  </span>

                                  {/* Status Dot */}
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                      result.status === 'Pass' ? 'bg-green-500' :
                                      result.status === 'Fail' ? 'bg-red-500' :
                                      result.status === 'Skipped' ? 'bg-yellow-500' :
                                      'bg-gray-500'
                                    }`}
                                    title={result.status}
                                  />

                                  {/* Note Preview/Expanded - Takes remaining space */}
                                  <div className="flex-1 min-w-0">
                                    {result.notes && result.notes.trim() ? (
                                      !notesExpanded ? (
                                        /* Collapsed - 1 line with truncate */
                                        <div
                                          onClick={() => {
                                            setExpandedReadOnly(prev => {
                                              const newSet = new Set(prev);
                                              newSet.add(notesKey);
                                              return newSet;
                                            });
                                          }}
                                          className="truncate text-gray-400 cursor-pointer hover:text-gray-300"
                                          title="Click to expand notes"
                                        >
                                          📝 {result.notes}
                                        </div>
                                      ) : (
                                        /* Expanded - Full text with line breaks */
                                        <div
                                          onClick={() => {
                                            setExpandedReadOnly(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(notesKey);
                                              return newSet;
                                            });
                                          }}
                                          className="text-gray-400 cursor-pointer hover:text-gray-300 whitespace-pre-wrap"
                                          title="Click to collapse notes"
                                        >
                                          📝 {result.notes}
                                        </div>
                                      )
                                    ) : (
                                      <span className="text-gray-600 italic">No notes</span>
                                    )}
                                  </div>

                                  {/* Image Count - Fixed position at the end */}
                                  <div className="flex-shrink-0">
                                    {result.attachments && result.attachments.length > 0 ? (
                                      <button
                                        onClick={() => {
                                          setExpandedReadOnly(prev => {
                                            const newSet = new Set(prev);
                                            newSet.add(imagesKey);
                                            return newSet;
                                          });
                                        }}
                                        className="flex items-center gap-0.5 text-purple-400 hover:text-purple-300"
                                        title="Click to view images"
                                      >
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                        </svg>
                                        <span>({result.attachments.length})</span>
                                      </button>
                                    ) : (
                                      <span className="text-gray-600 text-xs">No images</span>
                                    )}
                                  </div>

                                  {/* Image Popup Modal */}
                                  {expandedReadOnly.has(imagesKey) && (
                                    <div
                                      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
                                      onClick={() => {
                                        setExpandedReadOnly(prev => {
                                          const newSet = new Set(prev);
                                          newSet.delete(imagesKey);
                                          return newSet;
                                        });
                                      }}
                                    >
                                      <div
                                        className="bg-dark-secondary rounded-lg p-4 max-w-4xl max-h-[80vh] overflow-auto"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <div className="flex items-center justify-between mb-3">
                                          <h3 className="text-white font-medium">{result.tester.name}&apos;s Images</h3>
                                          <button
                                            onClick={() => {
                                              setExpandedReadOnly(prev => {
                                                const newSet = new Set(prev);
                                                newSet.delete(imagesKey);
                                                return newSet;
                                              });
                                            }}
                                            className="text-gray-400 hover:text-white"
                                          >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                        </div>
                                        <ImageGallery
                                          attachments={result.attachments}
                                          onDelete={() => {}}
                                          readonly={true}
                                          compact={false}
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>
              );
            })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
