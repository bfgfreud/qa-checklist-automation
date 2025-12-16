'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentTester } from '@/contexts/TesterContext';
import { Project } from '@/types/project';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { ProjectListSkeleton } from '@/components/skeletons';

export default function DashboardPage() {
  const router = useRouter();
  const { currentTester } = useCurrentTester();
  const [myProjects, setMyProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentTester) return;

    const fetchMyProjects = async () => {
      setLoading(true);
      try {
        // Get all projects
        const projectsRes = await fetch('/api/projects');
        const projectsResult = await projectsRes.json();

        if (projectsResult.success) {
          const allProjects = projectsResult.data;

          // Fetch all testers in parallel for better performance
          const testerPromises = allProjects.map((proj: { id: string }) =>
            fetch(`/api/projects/${proj.id}/testers`)
              .then(res => res.json())
              .then(result => ({ projectId: proj.id, testers: result.success ? result.data : [] }))
              .catch(() => ({ projectId: proj.id, testers: [] }))
          );

          const testerResults = await Promise.all(testerPromises);

          // Create a map for quick lookup
          const testerMap = new Map(
            testerResults.map(r => [r.projectId, r.testers])
          );

          // Filter projects where current user is assigned
          const assignedProjects: Project[] = allProjects
            .filter((proj: { id: string }) => {
              const testers = testerMap.get(proj.id) || [];
              return testers.some((t: { id: string }) => t.id === currentTester.id);
            })
            .map((proj: Record<string, unknown>) => ({
              id: proj.id as string,
              name: proj.name as string,
              description: proj.description as string | undefined,
              version: proj.version as string | undefined,
              platform: proj.platform as string | undefined,
              status: proj.status as Project['status'],
              priority: (proj.priority || 'Medium') as Project['priority'],
              dueDate: proj.due_date as string | undefined,
              createdBy: proj.created_by as string | undefined,
              createdAt: proj.created_at as string,
              updatedAt: proj.updated_at as string,
            }));

          setMyProjects(assignedProjects);
        }
      } catch (error) {
        console.error('Error fetching my projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyProjects();
  }, [currentTester]);

  const handleEditProject = (project: Project) => {
    // Navigate to project detail page instead of editing
    router.push(`/projects/${project.id}`);
  };

  const handleDeleteProject = () => {
    // Disabled on dashboard - users can't delete from here
  };

  return (
    <div className="min-h-screen bg-dark-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {currentTester?.name || 'Tester'}! 👋
          </h1>
          <p className="text-dark-text-secondary">
            Here are the projects you&apos;re currently assigned to
          </p>
        </div>

        {/* My Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              My Active Projects ({myProjects.length})
            </h2>
          </div>

          {loading ? (
            <ProjectListSkeleton count={3} />
          ) : myProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          ) : (
            // Empty state
            <div className="bg-dark-secondary border border-dark-primary rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No Active Projects
              </h3>
              <p className="text-dark-text-secondary mb-6">
                You haven&apos;t been assigned to any projects yet.
              </p>
              <button
                onClick={() => router.push('/projects')}
                className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white font-medium px-6 py-3 rounded-lg transition-colors"
              >
                Go to Projects Tab to Get Started
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
