'use client';

import React, { useState } from 'react';
import { useCurrentTester } from '@/contexts/TesterContext';
import { TesterAvatar } from './TesterAvatar';
import { ProfileEditModal } from '@/components/profile/ProfileEditModal';

export function CurrentTesterBadge() {
  const { currentTester, signOut, loading } = useCurrentTester();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (!currentTester) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-lg">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-sm text-gray-400">Loading user...</span>
        </div>
        <button
          onClick={signOut}
          className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium"
          title="Sign out"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-lg hover:border-primary-500 transition-colors group"
          title="Click to edit profile"
        >
          <TesterAvatar tester={currentTester} size="sm" />
          <span className="text-sm text-white font-medium">{currentTester.name}</span>
          <svg className="w-3 h-3 text-gray-500 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </button>
        <button
          onClick={signOut}
          className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-colors text-red-400 text-sm font-medium"
          title="Sign out"
        >
          Sign Out
        </button>
      </div>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
      />
    </>
  );
}
