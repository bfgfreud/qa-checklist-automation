'use client';

import React, { ReactNode } from 'react';
import { TesterProvider } from '@/contexts/TesterContext';
import { CurrentTesterBadge } from '@/components/ui/CurrentTesterBadge';
import Link from 'next/link';

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <TesterProvider>
      {/* Header/Nav */}
      <header className="sticky top-0 z-40 bg-dark-secondary border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-2xl font-bold text-white">
                QA Checklist
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-6">
              <Link
                href="/projects"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Projects
              </Link>
              <Link
                href="/modules"
                className="text-sm text-gray-300 hover:text-white transition-colors"
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
  );
}
