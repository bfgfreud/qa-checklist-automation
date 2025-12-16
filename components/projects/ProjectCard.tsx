'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import { Tester } from '@/types/tester';
import { ChecklistModuleWithMultiTesterResults, TestCaseWithResults } from '@/types/checklist';
import { format, isPast, isToday } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { TesterList } from '@/components/ui/TesterList';
import { ProgressBar } from '@/components/ui/ProgressBar';

export interface ProjectProgress {
  total: number;
  pending: number;
  passed: number;
  failed: number;
  skipped: number;
  progress: number;
}

export interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRestore?: (project: Project) => void;
  onPermanentDelete?: (project: Project) => void;
  isModified?: boolean;
  isArchived?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onDelete,
  onRestore,
  onPermanentDelete,
  isModified = false,
  isArchived = false,
}) => {
  const router = useRouter();
  const [testers, setTesters] = useState<Tester[]>([]);
  const [progress, setProgress] = useState<ProjectProgress | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch testers and progress on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch assigned testers
        const testersRes = await fetch(`/api/projects/${project.id}/testers`);
        if (testersRes.ok) {
          const testersResult = await testersRes.json();
          if (testersResult.success) {
            setTesters(testersResult.data || []);
          }
        }

        // Fetch project progress with multi-tester view
        const progressRes = await fetch(`/api/checklists/${project.id}?view=multi-tester&_t=${Date.now()}`);
        if (progressRes.ok) {
          const progressResult = await progressRes.json();
          if (progressResult.success) {
            // Calculate progress from checklist data - count unique testcases with aggregated status
            const modules: ChecklistModuleWithMultiTesterResults[] = progressResult.data.modules || [];
            const allTestCases = modules.flatMap((m) => m.testCases || []);
            const total = allTestCases.length;
            const pending = allTestCases.filter((tc: TestCaseWithResults) => tc.overallStatus === 'Pending').length;
            const passed = allTestCases.filter((tc: TestCaseWithResults) => tc.overallStatus === 'Pass').length;
            const failed = allTestCases.filter((tc: TestCaseWithResults) => tc.overallStatus === 'Fail').length;
            const skipped = allTestCases.filter((tc: TestCaseWithResults) => tc.overallStatus === 'Skipped').length;
            const completed = passed + failed + skipped;
            const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;

            setProgress({
              total,
              pending,
              passed,
              failed,
              skipped,
              progress: progressPercent,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [project.id]);

  const handleViewChecklist = () => {
    router.push(`/projects/${project.id}`);
  };
  // Status badge colors
  const statusColors = {
    Draft: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
    'In Progress': 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    Completed: 'bg-green-500/20 text-green-300 border border-green-500/30',
  };

  // Priority badge colors
  const priorityColors = {
    High: 'bg-red-500/20 text-red-400 border border-red-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    Low: 'bg-gray-500/20 text-gray-400 border border-gray-500/30',
  };

  // Platform badge colors
  const platformColors: Record<string, string> = {
    iOS: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    Android: 'bg-green-500/20 text-green-300 border border-green-500/30',
    Web: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    All: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
    Other: 'bg-gray-500/20 text-gray-300 border border-gray-500/30',
  };

  // Format due date
  const formatDueDate = (dateStr: string | undefined) => {
    if (!dateStr) return null;

    try {
      const date = new Date(dateStr);
      const isPastDue = isPast(date) && !isToday(date);
      const formattedDate = format(date, 'MMM dd, yyyy');

      return (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm">Due:</span>
          <span
            className={`text-sm font-medium ${
              isPastDue ? 'text-red-400' : 'text-gray-300'
            }`}
          >
            {formattedDate}
            {isPastDue && ' (Overdue)'}
            {isToday(date) && ' (Today)'}
          </span>
        </div>
      );
    } catch (err) {
      return null;
    }
  };

  return (
    <div
      className={`bg-dark-secondary border rounded-lg p-6 transition-all duration-200 ${
        isArchived
          ? 'border-gray-600 opacity-75'
          : isModified
          ? 'border-orange-500 hover:border-primary-500'
          : 'border-dark-primary hover:border-primary-500'
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            {project.name}
            {isArchived && (
              <span className="text-xs px-2 py-0.5 bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded-full">
                Archived
              </span>
            )}
            {isModified && !isArchived && (
              <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">
                Modified
              </span>
            )}
          </h3>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Version Badge */}
            {project.version && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                v{project.version}
              </span>
            )}

            {/* Platform Badge */}
            {project.platform && (
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  platformColors[project.platform] || platformColors.Other
                }`}
              >
                {project.platform}
              </span>
            )}

            {/* Priority Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                priorityColors[project.priority]
              }`}
            >
              {project.priority}
            </span>

            {/* Status Badge */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                statusColors[project.status]
              }`}
            >
              {project.status}
            </span>
          </div>

          {/* Description */}
          {project.description && (
            <p className="text-gray-400 text-sm mb-3 line-clamp-2">
              {project.description}
            </p>
          )}

          {/* Due Date */}
          {formatDueDate(project.dueDate)}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 ml-4">
          {isArchived ? (
            <>
              {/* Restore Button */}
              {onRestore && (
                <button
                  onClick={() => onRestore(project)}
                  className="p-2 text-gray-400 hover:text-green-500 hover:bg-dark-elevated rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Restore project"
                  title="Restore project"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
              {/* Permanent Delete Button */}
              {onPermanentDelete && (
                <button
                  onClick={() => onPermanentDelete(project)}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-dark-elevated rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                  aria-label="Permanently delete project"
                  title="Permanently delete project"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              )}
            </>
          ) : (
            <>
              {/* Edit Button */}
              <button
                onClick={() => onEdit(project)}
                className="p-2 text-gray-400 hover:text-primary-500 hover:bg-dark-elevated rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Edit project"
                title="Edit project"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </button>
              {/* Archive Button */}
              <button
                onClick={() => onDelete(project)}
                className="p-2 text-gray-400 hover:text-orange-500 hover:bg-dark-elevated rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
                aria-label="Archive project"
                title="Archive project"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                  />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Progress Section */}
      <div className="mt-4 pt-4 border-t border-dark-primary">
        {loading ? (
          // Skeleton for progress section
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="h-4 w-16 bg-dark-elevated rounded"></div>
              <div className="h-4 w-10 bg-dark-elevated rounded"></div>
            </div>
            <div className="h-2 bg-dark-elevated rounded-full mb-3"></div>
            <div className="grid grid-cols-4 gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-dark-elevated rounded px-2 py-1.5">
                  <div className="h-3 w-12 bg-dark-primary rounded mb-1"></div>
                  <div className="h-4 w-8 bg-dark-primary rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : progress && progress.total > 0 ? (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Progress</span>
              <span className="text-sm font-semibold text-primary-500">
                {progress.progress}%
              </span>
            </div>
            <ProgressBar
              value={progress.progress}
              max={100}
              size="md"
              showLabel={false}
              segments={{
                passed: progress.passed,
                failed: progress.failed,
                skipped: progress.skipped,
                total: progress.total
              }}
            />

            {/* Test Stats */}
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              <div className="bg-dark-elevated rounded px-2 py-1.5">
                <div className="text-xs text-gray-500">Pending</div>
                <div className="text-sm font-semibold text-gray-400">{progress.pending}</div>
              </div>
              <div className="bg-dark-elevated rounded px-2 py-1.5">
                <div className="text-xs text-gray-500">Pass</div>
                <div className="text-sm font-semibold text-green-400">{progress.passed}</div>
              </div>
              <div className="bg-dark-elevated rounded px-2 py-1.5">
                <div className="text-xs text-gray-500">Fail</div>
                <div className="text-sm font-semibold text-red-400">{progress.failed}</div>
              </div>
              <div className="bg-dark-elevated rounded px-2 py-1.5">
                <div className="text-xs text-gray-500">Skip</div>
                <div className="text-sm font-semibold text-yellow-400">{progress.skipped}</div>
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* Testers Section */}
      <div className="mt-4 pt-4 border-t border-dark-primary">
        {loading ? (
          // Skeleton for testers section
          <div className="animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-dark-elevated rounded"></div>
              <div className="flex items-center gap-1">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="w-8 h-8 bg-dark-elevated rounded-full"></div>
                ))}
              </div>
            </div>
          </div>
        ) : testers.length > 0 ? (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Assigned Testers</span>
            <TesterList testers={testers} maxVisible={3} size="sm" />
          </div>
        ) : null}
      </div>

      {/* Footer - Actions and Created Date */}
      <div className="mt-4 pt-4 border-t border-dark-primary flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {isArchived && project.deleted_at ? (
            <>
              Archived {format(new Date(project.deleted_at), 'MMM dd, yyyy')}
              {project.deleted_by && ` by ${project.deleted_by}`}
            </>
          ) : (
            <>Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}</>
          )}
        </div>
        {!isArchived && (
          <Button
            variant="primary"
            size="sm"
            onClick={handleViewChecklist}
            className="flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            View Project
          </Button>
        )}
      </div>
    </div>
  );
};
