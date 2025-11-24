'use client';

import React, { useState, useEffect } from 'react';
import { useCurrentTester } from '@/contexts/TesterContext';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = [
  { name: 'Blue', value: '#00A8E8' },
  { name: 'Orange', value: '#FF6B35' },
  { name: 'Purple', value: '#7D5BA6' },
  { name: 'Teal', value: '#00C9A7' },
  { name: 'Yellow', value: '#FFB81C' },
  { name: 'Red', value: '#E63946' },
  { name: 'Green', value: '#06BA63' },
  { name: 'Pink', value: '#F72585' },
];

const MAX_NAME_LENGTH = 15;

export function ProfileEditModal({ isOpen, onClose }: ProfileEditModalProps) {
  const { currentTester, updateProfile } = useCurrentTester();
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentTester) {
      setName(currentTester.name);
      setSelectedColor(currentTester.color);
    }
  }, [currentTester]);

  if (!isOpen || !currentTester) return null;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_NAME_LENGTH) {
      setName(value);
      setError('');
    }
  };

  const handleSave = async () => {
    // Validation
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name cannot be empty');
      return;
    }

    if (trimmedName.length < 1 || trimmedName.length > MAX_NAME_LENGTH) {
      setError(`Name must be 1-${MAX_NAME_LENGTH} characters`);
      return;
    }

    setIsSaving(true);
    setError('');

    const success = await updateProfile(trimmedName, selectedColor);

    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to update profile. Please try again.');
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (currentTester) {
      setName(currentTester.name);
      setSelectedColor(currentTester.color);
    }
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-secondary rounded-lg shadow-xl border border-dark-border p-6 w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={handleCancel}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={isSaving}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Name Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name
          </label>
          <div className="relative">
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              maxLength={MAX_NAME_LENGTH}
              placeholder="Enter your name"
              className="w-full px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={isSaving}
            />
            <div className="absolute right-3 top-2 text-xs text-gray-500">
              {name.length}/{MAX_NAME_LENGTH}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Your display name will appear in all checklists and projects
          </p>
        </div>

        {/* Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Avatar Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setSelectedColor(color.value)}
                disabled={isSaving}
                className={`
                  relative h-12 rounded-lg transition-all
                  ${selectedColor === color.value
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-secondary scale-110'
                    : 'hover:scale-105'
                  }
                `}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {selectedColor === color.value && (
                  <svg
                    className="w-6 h-6 text-white absolute inset-0 m-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Preview */}
        <div className="mb-6 p-4 bg-dark-bg rounded-lg border border-dark-border">
          <p className="text-xs text-gray-500 mb-2">Preview:</p>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: selectedColor }}
            >
              {name.charAt(0).toUpperCase() || '?'}
            </div>
            <span className="text-white font-medium">{name || 'Your Name'}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-dark-bg border border-dark-border rounded-lg text-gray-300 hover:bg-dark-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 px-4 py-2 bg-primary-500 rounded-lg text-white font-medium hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
