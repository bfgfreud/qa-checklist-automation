'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import { Tester } from '@/types/tester';
import { ChecklistModuleWithMultiTesterResults } from '@/types/checklist';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { TesterList } from '@/components/ui/TesterList';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';

export default function ProjectOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [modules, setModules] = useState<ChecklistModuleWithMultiTesterResults[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    progress: 0,
  });

  // Load project data (parallel fetching for better performance)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel - use multi-tester view for accurate counts
        const [projectRes, testersRes, checklistRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch(`/api/projects/${projectId}/testers`),
          fetch(`/api/checklists/${projectId}?view=multi-tester&_t=${Date.now()}`), // Multi-tester + cache bust
        ]);

        // Parse all responses
        const [projectResult, testersResult, checklistResult] = await Promise.all([
          projectRes.ok ? projectRes.json() : null,
          testersRes.ok ? testersRes.json() : null,
          checklistRes.ok ? checklistRes.json() : null,
        ]);

        // Update project
        if (projectResult?.success) {
          setProject(projectResult.data);
        }

        // Update testers
        if (testersResult?.success) {
          setTesters(testersResult.data || []);
        }

        // Update checklist and calculate stats using multi-tester data
        if (checklistResult?.success) {
          const checklistModules = checklistResult.data.modules || [];
          setModules(checklistModules);

          // Calculate stats from unique testcases (not per-tester results)
          // Each testCase appears once with aggregated overallStatus
          const allTestCases = checklistModules.flatMap((m: ChecklistModuleWithMultiTesterResults) => m.testCases || []);
          const total = allTestCases.length;
          const pending = allTestCases.filter((tc) => tc.overallStatus === 'Pending').length;
          const passed = allTestCases.filter((tc) => tc.overallStatus === 'Pass').length;
          const failed = allTestCases.filter((tc) => tc.overallStatus === 'Fail').length;
          const skipped = allTestCases.filter((tc) => tc.overallStatus === 'Skipped').length;
          const completed = passed + failed + skipped;
          const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

          setStats({ total, pending, passed, failed, skipped, progress });
        }
      } catch (err) {
        console.error('Error loading project:', err);
        setError('Failed to load project data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  // Status badge colors
  const statusColors = {
    Draft: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    'In Progress': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    Completed: 'bg-green-500/20 text-green-300 border border-green-500/30',
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.push('/projects')}
              className="text-primary-500 hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-2"
              aria-label="Back to projects"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              {project.description && (
                <p className="text-gray-400 mt-1">{project.description}</p>
              )}
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[project.status]}`}>
              {project.status}
            </span>
          </div>

          {/* Project Details */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            {project.version && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Version:</span>
                <span>{project.version}</span>
              </div>
            )}
            {project.platform && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Platform:</span>
                <span>{project.platform}</span>
              </div>
            )}
            {project.dueDate && (
              <div className="flex items-center gap-2">
                <span className="font-semibold">Due Date:</span>
                <span>{format(new Date(project.dueDate), 'MMM dd, yyyy')}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-semibold">Priority:</span>
              <span className={
                project.priority === 'High' ? 'text-red-400' :
                project.priority === 'Medium' ? 'text-yellow-400' :
                'text-gray-400'
              }>
                {project.priority}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Buttons */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Project Overview</h2>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              onClick={() => router.push(`/projects/${projectId}/edit`)}
            >
              Edit Checklist
            </Button>
            <Button onClick={() => router.push(`/projects/${projectId}/work`)}>
              Start Testing
            </Button>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Overall Progress</h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <ProgressBar value={stats.progress} max={100} size="lg" showLabel={false} />
            </div>
            <div className="text-3xl font-bold text-primary-500">{stats.progress}%</div>
          </div>

          {/* Test Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-dark-elevated rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-300">{stats.total}</div>
              <div className="text-sm text-gray-500">Total Tests</div>
            </div>
            <div className="bg-dark-elevated rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.pending}</div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
            <div className="bg-dark-elevated rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.passed}</div>
              <div className="text-sm text-gray-500">Passed</div>
            </div>
            <div className="bg-dark-elevated rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="bg-dark-elevated rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400">{stats.skipped}</div>
              <div className="text-sm text-gray-500">Skipped</div>
            </div>
          </div>
        </div>

        {/* Assigned Testers */}
        {testers.length > 0 && (
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-4">Assigned Testers</h3>
            <TesterList testers={testers} maxVisible={10} size="md" />
          </div>
        )}

        {/* Module Summary */}
        <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Modules ({modules.length})
          </h3>

          {modules.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-bold text-white mb-2">No modules added yet</h3>
              <p className="text-gray-400 mb-6">
                Start building your checklist by adding test modules
              </p>
              <Button onClick={() => router.push(`/projects/${projectId}/edit`)}>
                Add Modules
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {modules.map((module) => {
                const isExpanded = expandedModules.has(module.id);

                // Calculate module stats from testCases array
                const testCases = module.testCases || [];
                const totalTests = testCases.length;
                const pendingTests = testCases.filter((tc) => tc.overallStatus === 'Pending').length;
                const passedTests = testCases.filter((tc) => tc.overallStatus === 'Pass').length;
                const failedTests = testCases.filter((tc) => tc.overallStatus === 'Fail').length;
                const skippedTests = testCases.filter((tc) => tc.overallStatus === 'Skipped').length;
                const completedTests = passedTests + failedTests + skippedTests;
                const moduleProgress = totalTests > 0
                  ? Math.round((completedTests / totalTests) * 100)
                  : 0;

                return (
                  <div
                    key={module.id}
                    className="bg-dark-elevated border border-dark-border rounded-lg overflow-hidden"
                  >
                    {/* Module Header */}
                    <button
                      onClick={() => toggleModule(module.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-dark-border transition-colors"
                    >
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-3">
                          <h4 className="text-lg font-semibold text-white">
                            {module.moduleName}
                            {module.instanceLabel && module.instanceLabel !== module.moduleName && (
                              <span className="ml-2 text-sm text-primary-500">
                                ({module.instanceLabel})
                              </span>
                            )}
                          </h4>
                        </div>
                        {module.moduleDescription && (
                          <p className="text-sm text-gray-400 mt-1">
                            {module.moduleDescription}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-6 ml-4">
                        {/* Test Count */}
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white">
                            {totalTests}
                          </div>
                          <div className="text-xs text-gray-500">Tests</div>
                        </div>

                        {/* Status Breakdown */}
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-400">{pendingTests}</span>
                          <span className="text-green-400">{passedTests}</span>
                          <span className="text-red-400">{failedTests}</span>
                          <span className="text-yellow-400">{skippedTests}</span>
                        </div>

                        {/* Progress */}
                        <div className="w-32">
                          <ProgressBar value={moduleProgress} max={100} size="sm" showLabel={false} />
                        </div>

                        {/* Expand Icon */}
                        <svg
                          className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Module Test Cases */}
                    {isExpanded && (
                      <div className="px-6 py-4 border-t border-dark-border bg-dark-bg">
                        <div className="space-y-2">
                          {testCases.map((testCase) => (
                            <div
                              key={testCase.testCase.id}
                              className="flex items-center gap-3 py-2 px-3 bg-dark-elevated rounded"
                            >
                              {/* Status Indicator */}
                              <div className={`w-2 h-2 rounded-full ${
                                testCase.overallStatus === 'Pass' ? 'bg-green-500' :
                                testCase.overallStatus === 'Fail' ? 'bg-red-500' :
                                testCase.overallStatus === 'Skipped' ? 'bg-yellow-500' :
                                'bg-gray-500'
                              }`} />

                              {/* Test Case Title */}
                              <div className="flex-1">
                                <div className="text-sm text-white">
                                  {testCase.testCase.title}
                                </div>
                                {testCase.testCase.description && (
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {testCase.testCase.description}
                                  </div>
                                )}
                              </div>

                              {/* Priority */}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                testCase.testCase.priority === 'High' ? 'bg-red-500/20 text-red-400' :
                                testCase.testCase.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {testCase.testCase.priority}
                              </span>

                              {/* Status */}
                              <span className={`text-xs px-2 py-0.5 rounded ${
                                testCase.overallStatus === 'Pass' ? 'bg-green-500/20 text-green-400' :
                                testCase.overallStatus === 'Fail' ? 'bg-red-500/20 text-red-400' :
                                testCase.overallStatus === 'Skipped' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-gray-500/20 text-gray-400'
                              }`}>
                                {testCase.overallStatus}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
