'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Project } from '@/types/project';
import { ChecklistModuleWithMultiTesterResults } from '@/types/checklist';

interface ImportedModule {
  moduleId: string | null;
  moduleName: string;
  moduleDescription?: string;
  moduleThumbnailUrl?: string;
  instanceLabel: string;
  testCases: {
    testcaseId: string | null;
    title: string;
    description?: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
}

interface ImportChecklistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (modules: ImportedModule[]) => void;
  currentProjectId: string;
  existingModuleLabels: string[];
}

export function ImportChecklistDialog({
  isOpen,
  onClose,
  onImport,
  currentProjectId,
  existingModuleLabels,
}: ImportChecklistDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on open
  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    } else {
      // Reset state when dialog closes
      setSelectedProjectId(null);
      setSearchQuery('');
      setError(null);
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setLoadingProjects(true);
    setError(null);
    try {
      const response = await fetch('/api/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch projects');
      }
      const result = await response.json();
      if (result.success) {
        // Exclude current project
        const filteredProjects = (result.data || []).filter(
          (p: Project) => p.id !== currentProjectId
        );
        setProjects(filteredProjects);
      } else {
        throw new Error(result.error || 'Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProjectId) return;

    setImporting(true);
    setError(null);
    try {
      // Fetch source project's checklist
      const response = await fetch(
        `/api/checklists/${selectedProjectId}?view=multi-tester`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch source checklist');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch source checklist');
      }

      const sourceModules: ChecklistModuleWithMultiTesterResults[] =
        result.data?.modules || [];

      if (sourceModules.length === 0) {
        setError('Source project has no modules to import');
        setImporting(false);
        return;
      }

      // Extract skeleton data
      const importedModules: ImportedModule[] = sourceModules.map((mod) => ({
        moduleId: mod.moduleId || null,
        moduleName: mod.moduleName,
        moduleDescription: mod.moduleDescription,
        moduleThumbnailUrl: mod.moduleThumbnailUrl,
        instanceLabel: mod.instanceLabel || mod.moduleName,
        testCases: (mod.testCases || []).map((tc) => ({
          testcaseId: tc.testCase?.id || null,
          title: tc.testCase?.title || 'Untitled',
          description: tc.testCase?.description,
          priority: tc.testCase?.priority || 'Medium',
        })),
      }));

      // Pass to parent handler
      onImport(importedModules);
      onClose();
    } catch (err) {
      console.error('Error importing checklist:', err);
      setError(err instanceof Error ? err.message : 'Failed to import checklist');
    } finally {
      setImporting(false);
    }
  };

  // Filter projects by search query
  const filteredProjects = projects.filter((project) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.name.toLowerCase().includes(query) ||
      project.platform?.toLowerCase().includes(query) ||
      project.status?.toLowerCase().includes(query)
    );
  });

  // Get selected project details
  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
      onClick={(e) => {
        if (e.target === e.currentTarget && !importing) onClose();
      }}
    >
      <div className="bg-dark-secondary rounded-xl border border-dark-border w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border">
          <div>
            <h2 className="text-xl font-bold text-white">Import from Project</h2>
            <p className="text-sm text-gray-400 mt-1">
              Copy all modules and test cases from another project
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={importing}
            className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors disabled:opacity-50"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col p-6">
          {/* Search */}
          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pl-10 bg-dark-elevated border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
            />
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Project List */}
          <div className="flex-1 overflow-y-auto">
            {loadingProjects ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <span className="ml-3 text-gray-400">Loading projects...</span>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">📂</div>
                <p className="text-gray-400">
                  {searchQuery ? 'No projects match your search' : 'No other projects available'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProjects.map((project) => {
                  const isSelected = selectedProjectId === project.id;
                  return (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProjectId(project.id)}
                      disabled={importing}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-primary-500/10 border-primary-500'
                          : 'bg-dark-elevated border-dark-border hover:border-gray-600'
                      } disabled:opacity-50`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">
                            {project.name}
                          </h3>
                          <div className="flex items-center gap-3 mt-1.5 text-sm text-gray-400">
                            {project.platform && (
                              <span className="px-2 py-0.5 bg-dark-border rounded text-xs">
                                {project.platform}
                              </span>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded text-xs ${
                                project.status === 'Completed'
                                  ? 'bg-green-500/20 text-green-400'
                                  : project.status === 'In Progress'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {project.status || 'Not Started'}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="text-primary-500">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Import Notice */}
          {selectedProject && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-300">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div>
                  <p>
                    <strong>Only structure will be copied:</strong> Module names, test case titles, descriptions, and priorities.
                  </p>
                  <p className="mt-1 text-blue-400/80">
                    Notes, test results, and attachments will NOT be copied.
                  </p>
                  {existingModuleLabels.length > 0 && (
                    <p className="mt-1 text-yellow-400/80">
                      Duplicate module names will be renamed with "(imported)" suffix.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-dark-border">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={importing}
          >
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedProjectId || importing}
          >
            {importing ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"></span>
                Importing...
              </>
            ) : (
              'Import Checklist'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
