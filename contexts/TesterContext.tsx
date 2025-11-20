'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tester } from '@/types/tester';

interface TesterContextType {
  currentTester: Tester | null;
  setCurrentTesterName: (name: string) => Promise<void>;
  loading: boolean;
}

const TesterContext = createContext<TesterContextType | undefined>(undefined);

export function TesterProvider({ children }: { children: ReactNode }) {
  const [currentTester, setCurrentTester] = useState<Tester | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tester from localStorage on mount
  useEffect(() => {
    const loadTester = async () => {
      const savedName = localStorage.getItem('currentTesterName');

      if (savedName) {
        await findOrCreateTester(savedName);
      }

      setLoading(false);
    };

    loadTester();
  }, []);

  /**
   * Find existing tester by name or create new one
   */
  const findOrCreateTester = async (name: string): Promise<Tester | null> => {
    try {
      // Get all testers
      const response = await fetch('/api/testers');
      const result = await response.json();

      if (result.success && result.data) {
        // Find tester with matching name (case-insensitive)
        // Exclude Legacy Tester from matching
        const existingTester = result.data.find(
          (t: Tester) =>
            t.name.toLowerCase() === name.toLowerCase() &&
            t.email !== 'legacy@system'
        );

        if (existingTester) {
          // Use existing tester
          console.log('[TesterContext] Found existing tester:', existingTester.name, existingTester.id);
          setCurrentTester(existingTester);
          return existingTester;
        } else {
          console.log('[TesterContext] No existing tester found for name:', name);
        }
      }

      // Create new tester
      const createResponse = await fetch('/api/testers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: '', // No email for now
          color: generateRandomColor()
        })
      });

      const createResult = await createResponse.json();

      if (createResult.success && createResult.data) {
        setCurrentTester(createResult.data);
        return createResult.data;
      }

      return null;
    } catch (error) {
      console.error('Error finding/creating tester:', error);
      return null;
    }
  };

  /**
   * Set current tester by name (find or create)
   */
  const setCurrentTesterName = async (name: string) => {
    if (!name.trim()) {
      // Clear current tester
      setCurrentTester(null);
      localStorage.removeItem('currentTesterName');
      return;
    }

    const tester = await findOrCreateTester(name.trim());

    if (tester) {
      localStorage.setItem('currentTesterName', tester.name);
    }
  };

  return (
    <TesterContext.Provider value={{ currentTester, setCurrentTesterName, loading }}>
      {children}
    </TesterContext.Provider>
  );
}

export function useCurrentTester() {
  const context = useContext(TesterContext);
  if (context === undefined) {
    throw new Error('useCurrentTester must be used within a TesterProvider');
  }
  return context;
}

/**
 * Generate random color for new tester
 */
function generateRandomColor(): string {
  const colors = [
    '#00A8E8', // Blue
    '#FF6B35', // Orange
    '#7D5BA6', // Purple
    '#00C9A7', // Teal
    '#FFB81C', // Yellow
    '#E63946', // Red
    '#06BA63', // Green
    '#F72585', // Pink
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}
