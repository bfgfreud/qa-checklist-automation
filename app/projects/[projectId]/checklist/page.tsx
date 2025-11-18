'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Module } from '@/types/module';
import { Project } from '@/types/project';
import { ChecklistModuleWithResults, TestStatus } from '@/types/checklist';
import { ModuleBuilder } from '@/components/checklist/ModuleBuilder';
import { TestExecution } from '@/components/checklist/TestExecution';

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const showToast = (_msg: string, _type?: string) => console.log(`Toast [${_type}]:`, _msg);
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);
  const [checklistModules, setChecklistModules] = useState<ChecklistModuleWithResults[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug: Log state changes
  React.useEffect(() => {
    console.log('[DEBUG STATE] checklistModules updated:', checklistModules);
  }, [checklistModules]);

  // Use ref to prevent multiple initial loads
  const hasLoadedRef = React.useRef(false);

  // Initial load - ONLY RUN ONCE EVER
  useEffect(() => {
    if (hasLoadedRef.current) {
      console.log('[DEBUG] Skipping load - already loaded');
      return; // Prevent multiple loads
    }

    console.log('[DEBUG] Initial load starting...');
    hasLoadedRef.current = true;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch project
        console.log('[DEBUG] Fetching project...');
        const projectRes = await fetch(`/api/projects/${projectId}`);
        if (projectRes.ok) {
          const projectResult = await projectRes.json();
          if (projectResult.success) setProject(projectResult.data);
        }

        // Fetch modules
        console.log('[DEBUG] Fetching modules...');
        const modulesRes = await fetch('/api/modules');
        if (modulesRes.ok) {
          const modulesResult = await modulesRes.json();
          if (modulesResult.success) {
            const normalized = modulesResult.data.map((module: Record<string, unknown>) => ({
              ...module,
              testCases: module.testcases || module.testCases || []
            }));
            setAvailableModules(normalized);
          }
        }

        // Fetch checklist
        console.log('[DEBUG] Fetching checklist...');
        const checklistRes = await fetch(`/api/checklists/${projectId}`);
        if (checklistRes.ok) {
          const checklistResult = await checklistRes.json();
          if (checklistResult.success) {
            console.log('[DEBUG] Checklist data received:', checklistResult.data);
            console.log('[DEBUG] Setting modules array:', checklistResult.data.modules);
            setChecklistModules(checklistResult.data.modules); // <-- FIX: Use .modules array!
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
        console.log('[DEBUG] Initial load complete');
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // NO DEPENDENCIES - run once only!

  // Add module to checklist
  const handleAddModule = async (moduleId: string, instanceLabel?: string) => {
    console.log('[DEBUG] handleAddModule called with:', { moduleId, instanceLabel, projectId });
    try {
      console.log('[DEBUG] Making POST request to /api/checklists/modules');
      const response = await fetch('/api/checklists/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          moduleId,
          instanceLabel,
        }),
      });

      console.log('[DEBUG] Response status:', response.status);
      if (!response.ok) {
        throw new Error('Failed to add module');
      }

      const result = await response.json();
      console.log('[DEBUG] Response result:', result);
      if (result.success) {
        showToast('Module added to checklist', 'success');
        console.log('[DEBUG] Refreshing checklist data...');

        // Refresh checklist data
        const checklistRes = await fetch(`/api/checklists/${projectId}`, {
          cache: 'no-store' // Force fresh data
        });
        if (checklistRes.ok) {
          const checklistResult = await checklistRes.json();
          if (checklistResult.success) {
            console.log('[DEBUG] Setting updated checklist modules:', checklistResult.data.modules);
            console.log('[DEBUG] Module count:', checklistResult.data.modules.length);
            // Force a new array reference to trigger React re-render
            setChecklistModules([...checklistResult.data.modules]);
          }
        }
        console.log('[DEBUG] Module added successfully!');
      } else {
        throw new Error(result.error || 'Failed to add module');
      }
    } catch (err) {
      console.error('Error adding module:', err);
      showToast(err instanceof Error ? err.message : 'Failed to add module', 'error');
      throw err;
    }
  };

  // Remove module from checklist
  const handleRemoveModule = async (checklistModuleId: string) => {
    try {
      const response = await fetch(`/api/checklists/modules/${checklistModuleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove module');
      }

      const result = await response.json();
      if (result.success) {
        showToast('Module removed from checklist', 'success');

        // Refresh checklist data
        const checklistRes = await fetch(`/api/checklists/${projectId}`, {
          cache: 'no-store' // Force fresh data
        });
        if (checklistRes.ok) {
          const checklistResult = await checklistRes.json();
          if (checklistResult.success) {
            console.log('[DEBUG] After delete, setting modules:', checklistResult.data.modules.length);
            // Force a new array reference to trigger React re-render
            setChecklistModules([...checklistResult.data.modules]);
          }
        }
      } else {
        throw new Error(result.error || 'Failed to remove module');
      }
    } catch (err) {
      console.error('Error removing module:', err);
      showToast(err instanceof Error ? err.message : 'Failed to remove module', 'error');
      throw err;
    }
  };

  // Update test result status
  const handleUpdateTestResult = async (resultId: string, status: TestStatus, notes?: string) => {
    try {
      const response = await fetch(`/api/checklists/test-results/${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      if (!response.ok) {
        throw new Error('Failed to update test result');
      }

      const result = await response.json();
      if (result.success) {
        // Update local state optimistically
        setChecklistModules((prev) =>
          prev.map((module) => ({
            ...module,
            testResults: module.testResults.map((test) =>
              test.id === resultId
                ? { ...test, status, notes, testedAt: new Date().toISOString() }
                : test
            ),
          }))
        );
      } else {
        throw new Error(result.error || 'Failed to update test result');
      }
    } catch (err) {
      console.error('Error updating test result:', err);
      showToast(err instanceof Error ? err.message : 'Failed to update test result', 'error');
      throw err;
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    // Ensure checklistModules is always an array
    const modules = Array.isArray(checklistModules) ? checklistModules : [];
    const allTests = modules.flatMap((m) => m.testResults || []);
    const total = allTests.length;
    const pending = allTests.filter((t) => t.status === 'Pending').length;
    const passed = allTests.filter((t) => t.status === 'Pass').length;
    const failed = allTests.filter((t) => t.status === 'Fail').length;
    const skipped = allTests.filter((t) => t.status === 'Skipped').length;
    const completed = passed + failed + skipped;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, pending, passed, failed, skipped, progress };
  }, [checklistModules]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-dark-text-secondary">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Project not found'}</p>
          <button
            onClick={() => router.push('/projects')}
            className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      {/* Header */}
      <header className="bg-dark-surface border-b border-dark-border">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
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
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <p className="text-sm text-dark-text-secondary">Test Checklist Builder</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-dark-text-secondary">Overall Progress</p>
                <p className="text-2xl font-bold text-primary-500">{stats.progress}%</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex" style={{ height: 'calc(100vh - 89px)' }}>
        {/* Left Sidebar - Module Builder */}
        <div className="w-[420px] flex-shrink-0 overflow-hidden border-r border-dark-border">
          <ModuleBuilder
            projectName={project.name}
            availableModules={availableModules}
            addedModules={checklistModules}
            onAddModule={handleAddModule}
            onRemoveModule={handleRemoveModule}
            isLoading={isLoading}
          />
        </div>

        {/* Right Content - Test Execution */}
        <div className="flex-1 overflow-hidden">
          <TestExecution
            projectName={project.name}
            modules={checklistModules}
            totalTests={stats.total}
            pendingTests={stats.pending}
            passedTests={stats.passed}
            failedTests={stats.failed}
            skippedTests={stats.skipped}
            overallProgress={stats.progress}
            onUpdateTestResult={handleUpdateTestResult}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}
