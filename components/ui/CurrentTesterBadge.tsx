'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentTester } from '@/contexts/TesterContext';
import { TesterAvatar } from './TesterAvatar';
import Link from 'next/link';

const AVATAR_COLORS = [
  { value: '#00A8E8', name: 'Blue' },
  { value: '#FF6B35', name: 'Orange' },
  { value: '#7D5BA6', name: 'Purple' },
  { value: '#00C9A7', name: 'Teal' },
  { value: '#FFB81C', name: 'Yellow' },
  { value: '#E63946', name: 'Red' },
  { value: '#06BA63', name: 'Green' },
  { value: '#F72585', name: 'Pink' },
];

export function CurrentTesterBadge() {
  const { currentTester, user, loading, signOut, updateProfile } = useCurrentTester();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset edit form when dropdown opens or tester changes
  useEffect(() => {
    if (currentTester) {
      setEditName(currentTester.name);
      setEditColor(currentTester.color);
    }
  }, [currentTester, showDropdown]);

  const handleStartEdit = () => {
    if (currentTester) {
      setEditName(currentTester.name);
      setEditColor(currentTester.color);
      setError('');
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setError('');
    if (currentTester) {
      setEditName(currentTester.name);
      setEditColor(currentTester.color);
    }
  };

  const handleSave = async () => {
    const trimmedName = editName.trim();

    if (!trimmedName) {
      setError('Name is required');
      return;
    }
    if (trimmedName.length > 15) {
      setError('Name must be 15 characters or less');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const success = await updateProfile(trimmedName, editColor);
      if (success) {
        setIsEditing(false);
      } else {
        setError('Failed to save. Please try again.');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
        onClick={() => {
          setShowDropdown(!showDropdown);
          if (!showDropdown) {
            setIsEditing(false);
          }
        }}
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
            onClick={() => {
              setShowDropdown(false);
              setIsEditing(false);
            }}
          />

          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-dark-secondary border border-dark-border rounded-lg shadow-xl z-50 overflow-hidden">
            {isEditing ? (
              /* Edit Mode */
              <div className="p-4">
                {/* Live Preview */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
                    style={{ backgroundColor: editColor }}
                  >
                    {editName.trim() ? editName.trim().charAt(0).toUpperCase() : '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {editName.trim() || 'Your Name'}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {user.email}
                    </div>
                  </div>
                </div>

                {/* Name Input */}
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Display Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      maxLength={15}
                      placeholder="Enter your name"
                      className="w-full px-3 py-2 bg-dark-elevated border border-dark-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary-500"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                      {editName.length}/15
                    </span>
                  </div>
                </div>

                {/* Color Picker */}
                <div className="mb-4">
                  <label className="block text-xs text-gray-400 mb-2">Avatar Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setEditColor(color.value)}
                        className={`w-10 h-10 rounded-lg transition-all ${
                          editColor === color.value
                            ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-secondary scale-110'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="mb-3 text-xs text-red-400">{error}</div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="flex-1 px-3 py-2 text-sm text-gray-300 bg-dark-elevated rounded-lg hover:bg-dark-border transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editName.trim()}
                    className="flex-1 px-3 py-2 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <>
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
                  {/* Edit Profile Button */}
                  {currentTester && (
                    <button
                      onClick={handleStartEdit}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-dark-elevated rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Profile
                    </button>
                  )}

                  {/* Sign Out Button */}
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
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
