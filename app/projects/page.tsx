'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useProjects, useCreateProject, useDeleteProject, useUpdateProject } from '@/hooks/queries';
import { Project, CreateProjectDto, UpdateProjectDto, ProjectStatus } from '@/types/project';
import { Button } from '@/components/ui/Button';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectForm } from '@/components/projects/ProjectForm';

type SortField = 'name' | 'dueDate' | 'createdAt' | 'status';
type SortOrder = 'asc' | 'desc';

export default function ProjectsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // React Query hooks
  const { data: rawProjects, isLoading: loading, error: fetchError } = useProjects();
  const createProjectMutation = useCreateProject();
  const deleteProjectMutation = useDeleteProject();
  const updateProjectMutation = useUpdateProject();

  // Transform projects from API format to frontend format
  const projects = useMemo(() => {
    if (!rawProjects) return [];
    // API returns snake_case, transform to camelCase
    return rawProjects.map((proj) => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      version: proj.version,
      platform: proj.platform,
      status: proj.status,
      priority: proj.priority || 'Medium',
      dueDate: (proj as unknown as Record<string, string>).due_date || proj.dueDate,
      createdBy: (proj as unknown as Record<string, string>).created_by || proj.createdBy,
      createdAt: (proj as unknown as Record<string, string>).created_at || proj.createdAt,
      updatedAt: (proj as unknown as Record<string, string>).updated_at || proj.updatedAt,
    })) as Project[];
  }, [rawProjects]);

  // Draft state (local working copy for batch edits)
  const [draftProjects, setDraftProjects] = useState<Project[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track deleted projects
  const [deletedProjectIds, setDeletedProjectIds] = useState<Set<string>>(new Set());

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'All'>('All');
  const [platformFilter, setPlatformFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const [saving, setSaving] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();
  const success = (_msg: string) => console.log('Success:', _msg);
  const error = (_msg: string) => console.error('Error:', _msg);

  // Sync draft state when projects load/change
  useEffect(() => {
    if (projects.length > 0 && !hasUnsavedChanges) {
      setDraftProjects(projects);
    }
  }, [projects, hasUnsavedChanges]);

  // Log fetch errors
  useEffect(() => {
    if (fetchError) {
      error(fetchError.message || 'Failed to load projects');
    }
  }, [fetchError]);

  // Set up beforeunload warning when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Prevent navigation when there are unsaved changes
  useEffect(() => {
    // Listen to link clicks and browser back/forward
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');

      if (link && link.href && hasUnsavedChanges) {
        // Check if it's an internal navigation
        const currentOrigin = window.location.origin;
        if (link.href.startsWith(currentOrigin) || link.href.startsWith('/')) {
          const confirmLeave = window.confirm(
            'You have unsaved changes. Do you want to leave without saving?'
          );
          if (!confirmLeave) {
            e.preventDefault();
            e.stopPropagation();
          }
        }
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [hasUnsavedChanges]);

  /**
   * DRAFT MODE HANDLERS - Update local state only, no API calls
   */

  const handleCreateProject = async (data: CreateProjectDto | UpdateProjectDto) => {
    const projectName = (data as CreateProjectDto).name;

    // Check for duplicate project name (case-insensitive)
    const duplicateExists = draftProjects.some(
      (p) => p.name.toLowerCase() === projectName.toLowerCase()
    );

    if (duplicateExists) {
      error(
        `Project "${projectName}" already exists. Please choose a different name.`
      );
      return;
    }

    // Create project using mutation
    createProjectMutation.mutate(
      {
        name: projectName,
        description: data.description,
        version: data.version,
        platform: data.platform,
        status: data.status || 'Draft',
        priority: data.priority || 'Medium',
        dueDate: data.dueDate,
      },
      {
        onSuccess: (newProject) => {
          success('Project created successfully');
          setIsProjectFormOpen(false);
          // Redirect to edit mode immediately
          router.push(`/projects/${newProject.id}/edit`);
        },
        onError: (err) => {
          console.error('Error creating project:', err);
          error(err instanceof Error ? err.message : 'Failed to create project');
        },
      }
    );
  };

  const handleUpdateProject = async (data: CreateProjectDto | UpdateProjectDto) => {
    if (!editingProject) return;

    const newName = (data as UpdateProjectDto).name || editingProject.name;

    // Check for duplicate project name when renaming (case-insensitive, excluding current project)
    const duplicateExists = draftProjects.some(
      (p) =>
        p.id !== editingProject.id &&
        p.name.toLowerCase() === newName.toLowerCase()
    );

    if (duplicateExists) {
      error(
        `Project "${newName}" already exists. Please choose a different name.`
      );
      return;
    }

    setDraftProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === editingProject.id
          ? {
              ...p,
              name: newName,
              description: data.description !== undefined ? data.description : p.description,
              version: data.version !== undefined ? data.version : p.version,
              platform: data.platform !== undefined ? data.platform : p.platform,
              // Status is auto-calculated, keep existing status
              priority: data.priority || p.priority,
              dueDate: data.dueDate !== undefined ? data.dueDate : p.dueDate,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );
    setHasUnsavedChanges(true);
    setEditingProject(undefined);
    setIsProjectFormOpen(false);
  };

  const handleDeleteProject = (project: Project) => {
    if (!confirm(`Are you sure you want to delete "${project.name}"?`)) {
      return;
    }

    // Remove from draft
    setDraftProjects((prevProjects) => prevProjects.filter((p) => p.id !== project.id));

    // Track deletion if it's an existing project (not a temp one)
    if (!project.id.startsWith('temp-')) {
      setDeletedProjectIds((prev) => new Set([...prev, project.id]));
    }

    setHasUnsavedChanges(true);
  };

  /**
   * Calculate differences between server state and draft state
   */
  const calculateChanges = () => {
    const changes = {
      newProjects: [] as Project[],
      updatedProjects: [] as Project[],
      deletedProjectIds: Array.from(deletedProjectIds),
    };

    // Find new projects (temp IDs)
    changes.newProjects = draftProjects.filter((dp) => dp.id.startsWith('temp-'));

    // Find updated projects
    draftProjects.forEach((dp) => {
      if (!dp.id.startsWith('temp-')) {
        const serverProject = projects.find((p) => p.id === dp.id);
        if (serverProject) {
          const contentChanged =
            dp.name !== serverProject.name ||
            dp.description !== serverProject.description ||
            dp.version !== serverProject.version ||
            dp.platform !== serverProject.platform ||
            // Status is auto-calculated, don't check it
            dp.priority !== serverProject.priority ||
            dp.dueDate !== serverProject.dueDate;

          if (contentChanged) {
            changes.updatedProjects.push(dp);
          }
        }
      }
    });

    return changes;
  };

  /**
   * Save all changes to the API in batch
   */
  const handleSaveChanges = async () => {
    setSaving(true);
    const changes = calculateChanges();
    const errors: string[] = [];

    try {
      // 1. Delete projects
      for (const projectId of changes.deletedProjectIds) {
        try {
          await deleteProjectMutation.mutateAsync(projectId);
        } catch (err) {
          errors.push(`Failed to delete project ${projectId}`);
        }
      }

      // 2. Create new projects (rare from this page, usually redirects)
      for (const project of changes.newProjects) {
        try {
          await createProjectMutation.mutateAsync({
            name: project.name,
            description: project.description,
            version: project.version,
            platform: project.platform,
            status: project.status,
            priority: project.priority,
            dueDate: project.dueDate,
          });
        } catch (err) {
          errors.push(`Error creating project ${project.name}`);
        }
      }

      // 3. Update existing projects
      for (const project of changes.updatedProjects) {
        try {
          await updateProjectMutation.mutateAsync({
            id: project.id,
            data: {
              name: project.name,
              description: project.description,
              version: project.version,
              platform: project.platform,
              priority: project.priority,
              dueDate: project.dueDate,
            },
          });
        } catch (err) {
          errors.push(`Error updating project ${project.name}`);
        }
      }

      // Check for errors
      if (errors.length > 0) {
        error(`Some changes failed to save: ${errors.join(', ')}`);
      } else {
        success('All changes saved successfully');
      }

      // Reset unsaved changes state - React Query will refetch automatically
      setHasUnsavedChanges(false);
      setDeletedProjectIds(new Set());

      // Force refetch to sync state
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    } catch {
      console.error('Error saving changes:');
      error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Discard all draft changes and reset to server state
   */
  const handleDiscardChanges = () => {
    if (!confirm('Are you sure you want to discard all unsaved changes?')) {
      return;
    }

    // Reset to the current React Query data
    setDraftProjects(projects);
    setHasUnsavedChanges(false);
    setDeletedProjectIds(new Set());
    success('Changes discarded');
  };

  /**
   * Count total number of changes
   */
  const getChangeCount = () => {
    const changes = calculateChanges();
    return (
      changes.newProjects.length +
      changes.updatedProjects.length +
      changes.deletedProjectIds.length
    );
  };

  /**
   * Check if a project has been modified from server state
   */
  const isModified = (project: Project): boolean => {
    if (project.id.startsWith('temp-')) return true;

    const serverProject = projects.find((p) => p.id === project.id);
    if (!serverProject) return false;

    return (
      project.name !== serverProject.name ||
      project.description !== serverProject.description ||
      project.version !== serverProject.version ||
      project.platform !== serverProject.platform ||
      // Status is auto-calculated, don't check it for modifications
      project.priority !== serverProject.priority ||
      project.dueDate !== serverProject.dueDate
    );
  };

  /**
   * Get unique platforms from projects
   */
  const getUniquePlatforms = (): string[] => {
    const platforms = new Set<string>();
    draftProjects.forEach((p) => {
      if (p.platform) platforms.add(p.platform);
    });
    return Array.from(platforms).sort();
  };

  /**
   * Filter and sort projects
   */
  const getFilteredAndSortedProjects = (): Project[] => {
    let filtered = [...draftProjects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.version?.toLowerCase().includes(query) ||
          project.platform?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((project) => project.status === statusFilter);
    }

    // Apply platform filter
    if (platformFilter !== 'All') {
      filtered = filtered.filter((project) => project.platform === platformFilter);
    }

    // Sort projects
    filtered.sort((a, b) => {
      let compareA: string | number;
      let compareB: string | number;

      switch (sortField) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'dueDate':
          compareA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          compareB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          break;
        case 'createdAt':
          compareA = new Date(a.createdAt).getTime();
          compareB = new Date(b.createdAt).getTime();
          break;
        case 'status':
          compareA = a.status;
          compareB = b.status;
          break;
        default:
          return 0;
      }

      if (compareA < compareB) return sortOrder === 'asc' ? -1 : 1;
      if (compareA > compareB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  };

  const filteredProjects = getFilteredAndSortedProjects();

  /**
   * Toggle sort order or change sort field
   */
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Change field and default to ascending
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <span>📋</span>
              <span>Projects</span>
            </h2>
            <p className="text-gray-400 mt-1">
              Manage your test projects and track progress
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                setEditingProject(undefined);
                setIsProjectFormOpen(true);
              }}
            >
              + New Project
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects by name, description, version, or platform..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              aria-label="Search projects"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Filters and Sorting */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="status-filter" className="text-sm text-gray-400">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'All')}
                className="px-3 py-2 bg-dark-elevated border border-dark-primary rounded-md text-gray-200 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="All">All</option>
                <option value="Draft">Draft</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            {/* Platform Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="platform-filter" className="text-sm text-gray-400">
                Platform:
              </label>
              <select
                id="platform-filter"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="px-3 py-2 bg-dark-elevated border border-dark-primary rounded-md text-gray-200 text-sm focus:outline-none focus:border-primary-500"
              >
                <option value="All">All</option>
                {getUniquePlatforms().map((platform) => (
                  <option key={platform} value={platform}>
                    {platform}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm text-gray-400">Sort by:</label>
              <button
                onClick={() => handleSort('name')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'name'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-dark-border'
                }`}
              >
                Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('dueDate')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'dueDate'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-dark-border'
                }`}
              >
                Due Date {sortField === 'dueDate' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('createdAt')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'createdAt'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-dark-border'
                }`}
              >
                Created {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => handleSort('status')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  sortField === 'status'
                    ? 'bg-primary-500 text-white'
                    : 'bg-dark-elevated text-gray-300 hover:bg-dark-border'
                }`}
              >
                Status {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(searchQuery || statusFilter !== 'All' || platformFilter !== 'All') && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Active filters:</span>
              {searchQuery && (
                <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                  Search: &quot;{searchQuery}&quot;
                </span>
              )}
              {statusFilter !== 'All' && (
                <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                  Status: {statusFilter}
                </span>
              )}
              {platformFilter !== 'All' && (
                <span className="px-2 py-1 bg-primary-500/20 text-primary-400 rounded">
                  Platform: {platformFilter}
                </span>
              )}
              <button
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                  setPlatformFilter('All');
                }}
                className="ml-2 text-primary-500 hover:text-primary-400"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : draftProjects.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-2xl font-bold text-white mb-2">No projects yet</h3>
            <p className="text-gray-400 mb-6">
              Get started by creating your first test project
            </p>
            <Button
              onClick={() => {
                setEditingProject(undefined);
                setIsProjectFormOpen(true);
              }}
            >
              + Create Project
            </Button>
          </div>
        ) : filteredProjects.length === 0 ? (
          /* No Search Results */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No projects found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          /* Projects Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={(p) => {
                  setEditingProject(p);
                  setIsProjectFormOpen(true);
                }}
                onDelete={handleDeleteProject}
                isModified={isModified(project)}
              />
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-primary-500 mb-2">{draftProjects.length}</div>
            <div className="text-gray-400 text-sm">Total Projects</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-gray-500 mb-2">
              {draftProjects.filter((p) => p.status === 'Draft').length}
            </div>
            <div className="text-gray-400 text-sm">Draft</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {draftProjects.filter((p) => p.status === 'In Progress').length}
            </div>
            <div className="text-gray-400 text-sm">In Progress</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {draftProjects.filter((p) => p.status === 'Completed').length}
            </div>
            <div className="text-gray-400 text-sm">Completed</div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ProjectForm
        isOpen={isProjectFormOpen}
        onClose={() => {
          setIsProjectFormOpen(false);
          setEditingProject(undefined);
        }}
        onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        project={editingProject}
      />

      {/* Floating Save/Discard Buttons */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-dark-elevated border border-primary-500 rounded-lg shadow-xl p-4 z-50 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              {getChangeCount()} unsaved {getChangeCount() === 1 ? 'change' : 'changes'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDiscardChanges}
              variant="secondary"
              className="text-sm px-4 py-2 bg-dark-secondary hover:bg-gray-700 text-gray-300"
              disabled={saving}
            >
              Discard
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="text-sm px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                `Save ${getChangeCount()} ${getChangeCount() === 1 ? 'Change' : 'Changes'}`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
