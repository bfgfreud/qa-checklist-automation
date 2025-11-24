'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tester } from '@/types/tester';
import { createClient } from '@/lib/supabase-browser';
import { User } from '@supabase/supabase-js';

interface TesterContextType {
  currentTester: Tester | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  updateProfile: (name: string, color: string) => Promise<boolean>;
  refreshTester: () => Promise<void>;
}

const TesterContext = createContext<TesterContextType | undefined>(undefined);

export function TesterProvider({ children }: { children: ReactNode }) {
  const [currentTester, setCurrentTester] = useState<Tester | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Get initial session
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        await findOrCreateTesterFromAuth(session.user);
      }

      setLoading(false);
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          await findOrCreateTesterFromAuth(session.user);
        } else {
          setUser(null);
          setCurrentTester(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  /**
   * Find or create tester from authenticated user
   */
  const findOrCreateTesterFromAuth = async (user: User): Promise<void> => {
    try {
      // Try to find tester by email
      const response = await fetch('/api/testers');
      const result = await response.json();

      if (result.success && result.data) {
        const existingTester = result.data.find(
          (t: Tester) => t.email === user.email
        );

        if (existingTester) {
          setCurrentTester(existingTester);
          return;
        }
      }

      // Create new tester from auth user
      const rawName = user.user_metadata.full_name || user.email?.split('@')[0] || 'User';
      const trimmedName = rawName.length > 15 ? rawName.substring(0, 15) : rawName;

      const createResponse = await fetch('/api/testers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: user.email || '',
          color: generateRandomColor(),
          auth_user_id: user.id, // Link to Supabase auth user
        })
      });

      const createResult = await createResponse.json();

      if (createResult.success && createResult.data) {
        setCurrentTester(createResult.data);
      }
    } catch (error) {
      console.error('Error finding/creating tester:', error);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCurrentTester(null);
  };

  const updateProfile = async (name: string, color: string): Promise<boolean> => {
    if (!currentTester) return false;

    try {
      const response = await fetch(`/api/testers/${currentTester.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, color }),
      });

      if (response.ok) {
        await refreshTester();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating profile:', error);
      return false;
    }
  };

  const refreshTester = async () => {
    if (!currentTester) return;

    try {
      const response = await fetch(`/api/testers/${currentTester.id}`);
      const result = await response.json();

      if (result.success && result.data) {
        setCurrentTester(result.data);
      }
    } catch (error) {
      console.error('Error refreshing tester:', error);
    }
  };

  return (
    <TesterContext.Provider value={{ currentTester, user, loading, signOut, updateProfile, refreshTester }}>
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
