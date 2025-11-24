'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTester } from '@/contexts/TesterContext';
import { Project } from '@/types/project';
import { ProjectCard } from '@/components/projects/ProjectCard';

export default function DashboardPage() {
  const router = useRouter();
  const { currentTester } = useTester();
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

          // Filter projects where current user is assigned
          const assignedProjects: Project[] = [];

          for (const proj of allProjects) {
            const testersRes = await fetch(`/api/projects/${proj.id}/testers`);
            const testersResult = await testersRes.json();

            if (testersResult.success) {
              const isAssigned = testersResult.data.some(
                (t: { id: string }) => t.id === currentTester.id
              );

              if (isAssigned) {
                assignedProjects.push({
                  id: proj.id,
                  name: proj.name,
                  description: proj.description,
                  version: proj.version,
                  platform: proj.platform,
                  status: proj.status,
                  priority: proj.priority || 'Medium',
                  dueDate: proj.due_date,
                  createdBy: proj.created_by,
                  createdAt: proj.created_at,
                  updatedAt: proj.updated_at,
                });
              }
            }
          }

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
            Here are the projects you're currently assigned to
          </p>
        </div>

        {/* Quick Actions */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/projects')}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
            >
              <span className="text-lg">📋 View All Projects</span>
            </button>
            <button
              onClick={() => router.push('/modules')}
              className="flex-1 border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200"
            >
              <span className="text-lg">📝 Manage Modules</span>
            </button>
          </div>
        </section>

        {/* My Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              My Active Projects ({myProjects.length})
            </h2>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-dark-secondary border border-dark-primary rounded-lg p-6 animate-pulse"
                >
                  <div className="h-6 w-32 bg-dark-elevated rounded mb-4"></div>
                  <div className="h-4 w-20 bg-dark-elevated rounded mb-4"></div>
                  <div className="h-2 bg-dark-elevated rounded mb-3"></div>
                  <div className="h-4 w-24 bg-dark-elevated rounded mb-4"></div>
                  <div className="h-10 bg-dark-elevated rounded"></div>
                </div>
              ))}
            </div>
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
                You haven't been assigned to any projects yet.
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
