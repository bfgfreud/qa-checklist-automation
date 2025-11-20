'use client';

import React, { useState } from 'react';
import { useCurrentTester } from '@/contexts/TesterContext';
import { TesterAvatar } from './TesterAvatar';

export function CurrentTesterBadge() {
  const { currentTester, setCurrentTesterName, loading } = useCurrentTester();
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const handleStartEdit = () => {
    setInputValue(currentTester?.name || '');
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (inputValue.trim()) {
      await setCurrentTesterName(inputValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setInputValue('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-lg">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          placeholder="Enter your name"
          className="px-3 py-1.5 bg-dark-bg border border-primary-500 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          style={{ width: '150px' }}
        />
      </div>
    );
  }

  if (!currentTester) {
    return (
      <button
        onClick={handleStartEdit}
        className="flex items-center gap-2 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-lg hover:border-primary-500 transition-colors"
      >
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
        <span className="text-sm text-gray-400">Set Your Name</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="flex items-center gap-2 px-3 py-1.5 bg-dark-secondary border border-dark-border rounded-lg hover:border-primary-500 transition-colors group"
      title="Click to change name"
    >
      <TesterAvatar tester={currentTester} size="sm" />
      <span className="text-sm text-white font-medium">{currentTester.name}</span>
      <svg className="w-3 h-3 text-gray-500 group-hover:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  );
}
