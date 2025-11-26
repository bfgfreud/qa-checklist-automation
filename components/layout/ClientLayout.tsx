'use client';

import React, { ReactNode } from 'react';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { TesterProvider } from '@/contexts/TesterContext';
import { CurrentTesterBadge } from '@/components/ui/CurrentTesterBadge';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname?.startsWith(path);
  };

  return (
    <QueryProvider>
    <TesterProvider>
      {/* Header/Nav */}
      <header className="sticky top-0 z-40 bg-dark-secondary border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title with Fire Icon */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <span className="text-2xl">🔥</span>
              <div className="text-xl font-bold text-white">
                Bonfire Gathering - QA Checklist
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                href="/"
                className={`text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'text-primary-500'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className={`text-sm font-medium transition-colors ${
                  isActive('/projects')
                    ? 'text-primary-500'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Projects
              </Link>
              <Link
                href="/modules"
                className={`text-sm font-medium transition-colors ${
                  isActive('/modules')
                    ? 'text-primary-500'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Modules
              </Link>
            </nav>

            {/* Current Tester Badge */}
            <div className="flex items-center gap-4">
              <CurrentTesterBadge />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-screen">
        {children}
      </main>
    </TesterProvider>
    </QueryProvider>
  );
}
