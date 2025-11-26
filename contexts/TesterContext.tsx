'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tester } from '@/types/tester';

interface TesterContextType {
  currentTester: Tester | null;
  setCurrentTester: (tester: Tester | null) => void;
  loading: boolean;
}

const TesterContext = createContext<TesterContextType | undefined>(undefined);

const STORAGE_KEY = 'qa-checklist-current-tester';

export function TesterProvider({ children }: { children: ReactNode }) {
  const [currentTester, setCurrentTesterState] = useState<Tester | null>(null);
  const [loading, setLoading] = useState(true);

  // Load tester from localStorage on mount
  useEffect(() => {
    const loadTester = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const testerId = JSON.parse(stored);

          // Verify tester still exists
          const response = await fetch(`/api/testers/${testerId}`);
          const result = await response.json();

          if (result.success && result.data) {
            setCurrentTesterState(result.data);
          } else {
            // Tester no longer exists, clear storage
            localStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error('Error loading tester:', error);
        localStorage.removeItem(STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    };

    loadTester();
  }, []);

  // Save tester to localStorage when changed
  const setCurrentTester = (tester: Tester | null) => {
    setCurrentTesterState(tester);
    if (tester) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tester.id));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <TesterContext.Provider value={{ currentTester, setCurrentTester, loading }}>
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
