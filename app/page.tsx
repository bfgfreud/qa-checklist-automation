'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Mockup data for projects
const mockProjects = [
  {
    id: 1,
    name: 'Patch 1.2.3',
    completedTests: 13,
    totalTests: 20,
    percentage: 65,
    status: 'In Progress',
    statusColor: 'bg-blue-500',
  },
  {
    id: 2,
    name: 'Hotfix 1.1.1',
    completedTests: 19,
    totalTests: 20,
    percentage: 95,
    status: 'In Progress',
    statusColor: 'bg-blue-500',
  },
  {
    id: 3,
    name: 'Release 2.0',
    completedTests: 3,
    totalTests: 20,
    percentage: 15,
    status: 'In Progress',
    statusColor: 'bg-blue-500',
  },
];

// Mockup data for recent activities
const mockActivities = [
  {
    id: 1,
    icon: '✓',
    iconColor: 'text-green-500',
    message: 'Patch 1.2.3: Login module completed',
    time: '2h ago',
  },
  {
    id: 2,
    icon: '⚠️',
    iconColor: 'text-red-500',
    message: 'Hotfix 1.1.1: Payment flow blocked',
    time: '5h ago',
  },
  {
    id: 3,
    icon: '✓',
    iconColor: 'text-green-500',
    message: 'Release 2.0: Database migration completed',
    time: '1d ago',
  },
  {
    id: 4,
    icon: '▶',
    iconColor: 'text-blue-500',
    message: 'Patch 1.2.3: UI testing in progress',
    time: '1d ago',
  },
  {
    id: 5,
    icon: '✓',
    iconColor: 'text-green-500',
    message: 'Hotfix 1.1.1: API integration tests passed',
    time: '2d ago',
  },
];

export default function Home() {
  const [activeNav, setActiveNav] = useState('Dashboard');
  const router = useRouter();

  const handleNavigation = (item: string) => {
    setActiveNav(item);
    if (item === 'Modules') {
      router.push('/modules');
    } else if (item === 'Projects') {
      router.push('/projects');
    }
  };

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions Section */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => router.push('/projects')}
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200">
              <span className="text-lg">+ New Test Project</span>
            </button>
            <button
              onClick={() => router.push('/modules')}
              className="flex-1 border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:scale-105 duration-200">
              <span className="text-lg">📝 Manage Modules</span>
            </button>
          </div>
        </section>

        {/* Active Projects Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Active Projects ({mockProjects.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockProjects.map((project) => (
              <div
                key={project.id}
                className="bg-dark-secondary border border-dark-primary rounded-lg p-6 hover:border-primary-500 transition-all duration-300 hover:shadow-xl hover:shadow-primary-500/10"
              >
                {/* Project Name */}
                <h3 className="text-xl font-bold text-white mb-4">
                  {project.name}
                </h3>

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${project.statusColor} text-white`}
                  >
                    {project.status}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{project.percentage}%</span>
                  </div>
                  <div className="w-full bg-dark-elevated rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary-500 h-full rounded-full transition-all duration-500 ease-out shadow-lg shadow-primary-500/50"
                      style={{ width: `${project.percentage}%` }}
                    ></div>
                  </div>
                </div>

                {/* Completion Text */}
                <p className="text-sm text-gray-400 mb-4">
                  {project.completedTests}/{project.totalTests} tests completed
                </p>

                {/* Continue Button */}
                <button className="w-full bg-dark-elevated hover:bg-primary-500 text-gray-300 hover:text-white font-medium py-2 px-4 rounded-md transition-colors duration-200">
                  Continue
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity Feed */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Recent Activity</h2>
          </div>

          <div className="bg-dark-secondary border border-dark-primary rounded-lg overflow-hidden">
            {mockActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`flex items-start gap-4 p-4 hover:bg-dark-elevated transition-colors ${
                  index !== mockActivities.length - 1
                    ? 'border-b border-dark-primary'
                    : ''
                }`}
              >
                {/* Icon */}
                <div
                  className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-dark-elevated ${activity.iconColor} text-lg`}
                >
                  {activity.icon}
                </div>

                {/* Message and Time */}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-sm sm:text-base">
                    {activity.message}
                  </p>
                  <p className="text-gray-500 text-xs sm:text-sm mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quick Stats Footer */}
        <section className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-primary-500 mb-2">3</div>
            <div className="text-gray-400 text-sm">Active Projects</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-primary-500 mb-2">60</div>
            <div className="text-gray-400 text-sm">Total Test Modules</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-green-500 mb-2">58%</div>
            <div className="text-gray-400 text-sm">Overall Completion</div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-dark-primary py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            🔥 Bonfire Gathering QA Checklist Automation &copy; 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
