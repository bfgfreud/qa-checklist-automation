'use client';

import React, { useState } from 'react';
import { useCurrentTester } from '@/contexts/TesterContext';
import { TesterAvatar } from './TesterAvatar';
import Link from 'next/link';

export function CurrentTesterBadge() {
  const { currentTester, user, loading, signOut } = useCurrentTester();
  const [showDropdown, setShowDropdown] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-elevated border border-dark-border rounded-lg">
        <div className="w-6 h-6 rounded-full bg-gray-600 animate-pulse"></div>
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  // Not signed in - show sign in link
  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-3 py-1.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        <span className="text-sm font-medium">Sign In</span>
      </Link>
    );
  }

  // Signed in - show user info with dropdown
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
            <span className="text-sm text-gray-400">{user.email}</span>
          </>
        )}
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {showDropdown && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-56 bg-dark-secondary border border-dark-border rounded-lg shadow-xl z-50 overflow-hidden">
            {/* User Info */}
            <div className="p-3 border-b border-dark-border">
              <div className="flex items-center gap-3">
                {currentTester && <TesterAvatar tester={currentTester} size="md" />}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">
                    {currentTester?.name || user.email}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-2">
              <button
                onClick={() => {
                  signOut();
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-elevated rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
