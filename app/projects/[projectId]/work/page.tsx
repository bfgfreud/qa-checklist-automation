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

export default function WorkingModePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [checklist, setChecklist] = useState<ProjectChecklistWithTesters | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode: 'all' shows all testers, 'single' shows one tester's view
  const [viewMode, setViewMode] = useState<'all' | 'single'>('all');
  const [selectedTester, setSelectedTester] = useState<Tester | null>(null);

  // Current user (for now, we'll detect if they're assigned)
  const [currentTester, setCurrentTester] = useState<Tester | null>(null);
  const [showJoinDialog, setShowJoinDialog] = useState(false);

  // Expanded test cases (for notes and attachments)
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  // Polling interval (5 seconds)
  const [isPolling, setIsPolling] = useState(true);

  // Load project and checklist data
  const fetchData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [projectRes, checklistRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/checklists/${projectId}`),
      ]);

      const [projectResult, checklistResult] = await Promise.all([
        projectRes.ok ? projectRes.json() : null,
        checklistRes.ok ? checklistRes.json() : null,
      ]);

      if (projectResult?.success) {
        setProject(projectResult.data);
      }

      if (checklistResult?.success) {
        const data: ProjectChecklistWithTesters = checklistResult.data;
        setChecklist(data);

        // If only one tester, default to single view
        if (data.assignedTesters.length === 1 && !selectedTester) {
          setViewMode('single');
          setSelectedTester(data.assignedTesters[0]);
          setCurrentTester(data.assignedTesters[0]);
        }

        // TODO: Detect if current user is in assignedTesters
        // For now, we'll assume they're not assigned if no tester found
        // setShowJoinDialog(true);
      }
    } catch (err) {
      console.error('Error loading project:', err);
      setError('Failed to load project data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchData();
  }, [projectId]);

  // Polling for updates (every 5 seconds)
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

  const updateTestNotes = (resultId: string, testerId: string, notes: string, currentStatus: TestStatus) => {
    // Clear existing timeout for this result
    if (notesTimeoutRef.current[resultId]) {
      clearTimeout(notesTimeoutRef.current[resultId]);
    }

    // Set new timeout for auto-save (1.5 seconds after user stops typing)
    notesTimeoutRef.current[resultId] = setTimeout(async () => {
      try {
        const response = await fetch(`/api/test-results/${resultId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ testerId, status: currentStatus, notes }),
        });

        if (!response.ok) {
          throw new Error('Failed to save notes');
        }

        // Silently refresh data in background
        fetchData(false);
      } catch (err) {
        console.error('Error saving notes:', err);
        alert('Failed to save notes. Please try again.');
      }
    }, 1500);
  };

  // Update test result status
  const updateTestStatus = async (
    resultId: string,
    testerId: string,
    status: TestStatus,
    notes?: string
  ) => {
    // Optimistically update the UI
    if (checklist) {
      const updatedChecklist = { ...checklist };
      updatedChecklist.modules.forEach((module) => {
        module.testCases.forEach((testCase) => {
          const result = testCase.results.find((r) => r.id === resultId);
          if (result) {
            result.status = status;
            result.testedAt = new Date().toISOString();
            // Recalculate overall status (weakest status logic)
            const statuses = testCase.results.map((r) => r.status);
            testCase.overallStatus = getWeakestStatus(statuses);
          }
        });
      });
      setChecklist(updatedChecklist);
    }

    try {
      const response = await fetch(`/api/test-results/${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testerId, status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update test result');
      }

      // Refresh checklist data in background
      fetchData(false);
    } catch (err) {
      console.error('Error updating test result:', err);
      alert('Failed to update test result. Please try again.');
      // Revert optimistic update by refreshing
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

  // Join project as tester
  const handleJoinProject = async () => {
    // TODO: Implement tester assignment
    // For now, just close the dialog
    setShowJoinDialog(false);
  };

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
              {checklist.assignedTesters.length > 1 && (
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
                      if (!selectedTester && checklist.assignedTesters.length > 0) {
                        setSelectedTester(checklist.assignedTesters[0]);
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

              {/* Tester Selector (for single view) */}
              {viewMode === 'single' && checklist.assignedTesters.length > 1 && (
                <select
                  value={selectedTester?.id || ''}
                  onChange={(e) => {
                    const tester = checklist.assignedTesters.find((t) => t.id === e.target.value);
                    setSelectedTester(tester || null);
                  }}
                  className="bg-dark-elevated border border-dark-border text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {checklist.assignedTesters.map((tester) => (
                    <option key={tester.id} value={tester.id}>
                      {tester.name}
                    </option>
                  ))}
                </select>
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
                {/* Module Header */}
                <div className="px-6 py-4 bg-dark-elevated border-b border-dark-border">
                  <h2 className="text-xl font-bold text-white">
                    {module.moduleName}
                    {module.instanceLabel && module.instanceLabel !== module.moduleName && (
                      <span className="ml-2 text-base text-primary-500">
                        ({module.instanceLabel})
                      </span>
                    )}
                  </h2>
                  {module.moduleDescription && (
                    <p className="text-sm text-gray-400 mt-1">{module.moduleDescription}</p>
                  )}
                </div>

                {/* Test Cases */}
                <div className="divide-y divide-dark-border">
                  {module.testCases.map((testCase) => {
                    const isExpanded = expandedTests.has(testCase.testCase.id);
                    const testCaseId = testCase.testCase.id;

                    return (
                      <div key={testCaseId} className="p-6">
                        {/* Test Case Title and Overall Status */}
                        <div className="flex items-start gap-4 mb-4">
                          {/* Status Indicator */}
                          <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                            testCase.overallStatus === 'Pass' ? 'bg-green-500' :
                            testCase.overallStatus === 'Fail' ? 'bg-red-500' :
                            testCase.overallStatus === 'Skipped' ? 'bg-yellow-500' :
                            'bg-gray-500'
                          }`} />

                          {/* Test Case Info */}
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-white">
                                {testCase.testCase.title}
                              </h3>
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                testCase.testCase.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                testCase.testCase.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {testCase.testCase.priority}
                              </span>
                            </div>
                            {testCase.testCase.description && (
                              <p className="text-sm text-gray-400 mt-1">
                                {testCase.testCase.description}
                              </p>
                            )}
                          </div>

                          {/* Overall Status Badge */}
                          <span className={`px-3 py-1 rounded text-sm font-semibold ${
                            testCase.overallStatus === 'Pass' ? 'bg-green-500/20 text-green-400' :
                            testCase.overallStatus === 'Fail' ? 'bg-red-500/20 text-red-400' :
                            testCase.overallStatus === 'Skipped' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {testCase.overallStatus}
                          </span>
                        </div>

                        {/* Tester Results */}
                        <div className="space-y-3 ml-7">
                          {testCase.results
                            .filter((result) =>
                              viewMode === 'all' || result.tester.id === selectedTester?.id
                            )
                            .map((result) => (
                            <div
                              key={result.id}
                              className="bg-dark-elevated rounded-lg p-4"
                            >
                              {/* Tester Row */}
                              <div className="flex items-center gap-4">
                                {/* Tester Avatar */}
                                <TesterAvatar tester={result.tester} size="sm" />
                                <span className="text-sm font-medium text-white">
                                  {result.tester.name}
                                </span>

                                {/* Status Buttons */}
                                <div className="flex-1 flex items-center gap-2">
                                  {(['Pending', 'Pass', 'Fail', 'Skipped'] as TestStatus[]).map((status) => (
                                    <button
                                      key={status}
                                      onClick={() => updateTestStatus(result.id, result.tester.id, status, result.notes || undefined)}
                                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                        result.status === status
                                          ? status === 'Pass' ? 'bg-green-500 text-white' :
                                            status === 'Fail' ? 'bg-red-500 text-white' :
                                            status === 'Skipped' ? 'bg-yellow-500 text-white' :
                                            'bg-gray-500 text-white'
                                          : 'bg-dark-border text-gray-400 hover:bg-dark-primary'
                                      }`}
                                    >
                                      {status}
                                    </button>
                                  ))}
                                </div>

                                {/* Tested At */}
                                {result.testedAt && (
                                  <span className="text-xs text-gray-500">
                                    {new Date(result.testedAt).toLocaleTimeString()}
                                  </span>
                                )}

                                {/* Expand Button */}
                                <button
                                  onClick={() => toggleTestExpansion(testCaseId + result.tester.id)}
                                  className="text-gray-400 hover:text-gray-200 p-1"
                                >
                                  <svg
                                    className={`w-5 h-5 transition-transform ${
                                      expandedTests.has(testCaseId + result.tester.id) ? 'rotate-180' : ''
                                    }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                </button>
                              </div>

                              {/* Expanded: Notes and Attachments */}
                              {expandedTests.has(testCaseId + result.tester.id) && (
                                <div className="mt-4 space-y-4">
                                  {/* Notes */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                      Notes
                                    </label>
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
                                      placeholder="Add notes about this test..."
                                      className="w-full bg-dark-bg border border-dark-border text-white rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                      rows={3}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                      Auto-saves 1.5s after you stop typing
                                    </p>
                                  </div>

                                  {/* Attachments */}
                                  <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">
                                      Attachments ({result.attachments.length})
                                    </label>

                                    {/* Image Gallery */}
                                    {result.attachments.length > 0 && (
                                      <div className="mb-4">
                                        <ImageGallery
                                          attachments={result.attachments}
                                          onDelete={(attachmentId) => {
                                            // Refresh checklist after delete
                                            fetchData(false);
                                          }}
                                        />
                                      </div>
                                    )}

                                    {/* Image Uploader */}
                                    <ImageUploader
                                      testResultId={result.id}
                                      onUploadComplete={(url) => {
                                        // Refresh checklist after upload
                                        fetchData(false);
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Join Project Dialog */}
      {showJoinDialog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 max-w-md">
            <h3 className="text-xl font-bold text-white mb-2">Join Project?</h3>
            <p className="text-gray-400 mb-6">
              You&apos;re not assigned to this project as a tester. Would you like to join?
            </p>
            <div className="flex items-center gap-3">
              <Button onClick={handleJoinProject}>
                Join Project
              </Button>
              <Button variant="secondary" onClick={() => setShowJoinDialog(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
