'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentTester } from '@/contexts/TesterContext';
import { TesterAvatar } from './TesterAvatar';
import { Tester } from '@/types/tester';

export function CurrentTesterBadge() {
  const { currentTester, setCurrentTester } = useCurrentTester();
  const [showDropdown, setShowDropdown] = useState(false);
  const [testers, setTesters] = useState<Tester[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch testers when dropdown opens
  useEffect(() => {
    if (showDropdown) {
      setLoading(true);
      fetch('/api/testers')
        .then(res => res.json())
        .then(result => {
          if (result.success) {
            setTesters(result.data || []);
          }
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [showDropdown]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-2 px-3 py-1.5 bg-dark-elevated border border-dark-border rounded-lg hover:border-primary-500 transition-colors"
      >
        {currentTester ? (
          <>
            <TesterAvatar tester={currentTester} size="sm" />
            <span className="text-sm text-white">{currentTester.name}</span>
          </>
        ) : (
          <>
            <div className="w-6 h-6 rounded-full bg-gray-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-sm text-gray-400">Set Your Name</span>
          </>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Tester Selection Dropdown */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-dark-secondary border border-dark-border rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 border-b border-dark-border">
              <h3 className="text-sm font-semibold text-white">Select Tester</h3>
            </div>

            <div className="max-h-64 overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                </div>
              ) : testers.length === 0 ? (
                <div className="text-center py-4 text-gray-400 text-sm">
                  No testers found. Go to Testers page to create one.
                </div>
              ) : (
                testers.map((tester) => (
                  <button
                    key={tester.id}
                    onClick={() => {
                      setCurrentTester(tester);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      currentTester?.id === tester.id
                        ? 'bg-primary-500/20 border border-primary-500/30'
                        : 'hover:bg-dark-elevated'
                    }`}
                  >
                    <TesterAvatar tester={tester} size="sm" />
                    <span className="text-sm text-white">{tester.name}</span>
                    {currentTester?.id === tester.id && (
                      <svg className="w-4 h-4 text-primary-500 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Clear Selection */}
            {currentTester && (
              <div className="p-2 border-t border-dark-border">
                <button
                  onClick={() => {
                    setCurrentTester(null);
                    setShowDropdown(false);
                  }}
                  className="w-full text-sm text-gray-400 hover:text-white py-2 transition-colors"
                >
                  Clear Selection
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
