'use client';

import React, { useState, useRef } from 'react';
import { TestCase, Priority } from '@/types/module';
import { Button } from '@/components/ui/Button';

interface AddTestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  moduleId: string;
  moduleName: string;
  isCustomModule: boolean;
  availableTestCases: TestCase[]; // For custom modules: all library testcases, For regular: removed testcases
  onAddTestCases: (testCaseIds: string[]) => void;
  onCreateCustomTestCase: (data: { title: string; description?: string; priority: Priority; imageFile?: File }) => void;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB

type ViewMode = 'choice' | 'create' | 'addBack';

export function AddTestCaseDialog({
  isOpen,
  onClose,
  moduleId,
  moduleName,
  isCustomModule,
  availableTestCases,
  onAddTestCases,
  onCreateCustomTestCase,
}: AddTestCaseDialogProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('choice');
  const [selectedTestCaseIds, setSelectedTestCaseIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for creating custom testcase
  const [customTestCase, setCustomTestCase] = useState({
    title: '',
    description: '',
    priority: 'Medium' as Priority,
  });

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleToggleTestCase = (testCaseId: string) => {
    setSelectedTestCaseIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(testCaseId)) {
        newSet.delete(testCaseId);
      } else {
        newSet.add(testCaseId);
      }
      return newSet;
    });
  };

  const handleSubmitAddBack = (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedTestCaseIds.size > 0) {
      onAddTestCases(Array.from(selectedTestCaseIds));
      handleClose();
    }
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customTestCase.title.trim()) {
      alert('Please enter a test case title');
      return;
    }

    onCreateCustomTestCase({
      ...customTestCase,
      imageFile: selectedImage || undefined,
    });
    handleClose();
  };

  const handleClose = () => {
    setViewMode('choice');
    setSelectedTestCaseIds(new Set());
    setSearchQuery('');
    setCustomTestCase({ title: '', description: '', priority: 'Medium' });
    resetImageState();
    onClose();
  };

  const handleBack = () => {
    setViewMode('choice');
    setSelectedTestCaseIds(new Set());
    setSearchQuery('');
    setCustomTestCase({ title: '', description: '', priority: 'Medium' });
    resetImageState();
  };

  // Image handling functions
  const resetImageState = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setImageError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageError('Please upload a JPEG, PNG, GIF, or WebP image');
      return;
    }

    // Validate file size
    if (file.size > MAX_IMAGE_SIZE) {
      setImageError('File size must be less than 5MB');
      return;
    }

    setImageError(null);
    setSelectedImage(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    resetImageState();
  };

  // Filter testcases by search query
  const filteredTestCases = availableTestCases.filter((tc) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      tc.title.toLowerCase().includes(query) ||
      tc.description?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-secondary border border-dark-border rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-dark-border">
          <h2 className="text-xl font-bold text-white">
            {viewMode === 'choice' && 'Add Test Cases'}
            {viewMode === 'create' && 'Create New Test Case'}
            {viewMode === 'addBack' && (isCustomModule ? 'Add Test Cases from Library' : 'Add Back Removed Test Cases')}
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            {viewMode === 'choice' && `Choose how to add test cases to "${moduleName}"`}
            {viewMode === 'create' && `Create a custom test case for "${moduleName}"`}
            {viewMode === 'addBack' && (isCustomModule
              ? `Select test cases from the library to add to "${moduleName}"`
              : `Add back test cases that were removed from "${moduleName}"`)}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* CHOICE VIEW */}
          {viewMode === 'choice' && (
            <div className="space-y-4">
              <button
                onClick={() => setViewMode('create')}
                className="w-full p-6 border-2 border-primary-500/30 rounded-lg bg-primary-500/5 hover:bg-primary-500/10 hover:border-primary-500/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary-500/20 text-primary-400 group-hover:bg-primary-500/30 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">Create New Test Case</h3>
                    <p className="text-sm text-gray-400">
                      Write a custom test case from scratch with your own title, description, and priority
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setViewMode('addBack')}
                className="w-full p-6 border-2 border-blue-500/30 rounded-lg bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-colors text-left group"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400 group-hover:bg-blue-500/30 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {isCustomModule ? 'Add from Library' : 'Add Back Removed'}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {isCustomModule
                        ? 'Choose test cases from the module library to add to this custom module'
                        : 'Restore test cases that were previously removed from this module'}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* CREATE VIEW */}
          {viewMode === 'create' && (
            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Test Case Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={customTestCase.title}
                  onChange={(e) => setCustomTestCase({ ...customTestCase, title: e.target.value })}
                  placeholder="e.g., Verify login with valid credentials"
                  className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Description <span className="text-gray-500">(Optional)</span>
                </label>
                <textarea
                  value={customTestCase.description}
                  onChange={(e) => setCustomTestCase({ ...customTestCase, description: e.target.value })}
                  placeholder="Detailed steps or expected behavior..."
                  rows={3}
                  className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Priority
                </label>
                <div className="flex gap-3">
                  {(['High', 'Medium', 'Low'] as Priority[]).map((priority) => (
                    <label
                      key={priority}
                      className={`flex-1 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                        customTestCase.priority === priority
                          ? 'border-primary-500 bg-primary-500/10 text-white'
                          : 'border-dark-border bg-dark-elevated text-gray-400 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={priority}
                        checked={customTestCase.priority === priority}
                        onChange={(e) =>
                          setCustomTestCase({ ...customTestCase, priority: e.target.value as Priority })
                        }
                        className="sr-only"
                      />
                      <span className="block text-center text-sm font-semibold">{priority}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Reference Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">
                  Reference Image <span className="text-gray-500">(Optional)</span>
                </label>
                <div className="flex items-start gap-3">
                  {/* Image Preview / Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`
                      w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center
                      cursor-pointer transition-all flex-shrink-0 overflow-hidden
                      ${imagePreview ? 'border-primary-500' : 'border-dark-border hover:border-primary-500'}
                    `}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>

                  {/* Info & Actions */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-1">
                      {imagePreview ? 'Click to change' : 'Click to upload'}
                    </p>
                    <p className="text-xs text-gray-500">
                      JPEG, PNG, GIF, WebP (max 5MB)
                    </p>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage();
                        }}
                        className="mt-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {imageError && (
                  <p className="mt-1.5 text-xs text-red-400">{imageError}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ALLOWED_IMAGE_TYPES.join(',')}
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </form>
          )}

          {/* ADD BACK VIEW */}
          {viewMode === 'addBack' && (
            <>
              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search test cases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 bg-dark-elevated border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
              </div>

              {/* Test Case List */}
              {availableTestCases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">
                    {isCustomModule
                      ? 'No test cases available in library'
                      : 'No removed test cases to add back'}
                  </p>
                </div>
              ) : filteredTestCases.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No test cases match your search</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredTestCases.map((testCase) => (
                    <label
                      key={testCase.id}
                      className={`block p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTestCaseIds.has(testCase.id)
                          ? 'border-primary-500 bg-primary-500/10'
                          : 'border-dark-border bg-dark-elevated hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTestCaseIds.has(testCase.id)}
                          onChange={() => handleToggleTestCase(testCase.id)}
                          className="mt-1 w-4 h-4 rounded border-gray-500 bg-dark-bg text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                        />
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-white">
                            {testCase.title}
                          </div>
                          {testCase.description && (
                            <div className="text-xs text-gray-400 mt-1">
                              {testCase.description}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                testCase.priority === 'High'
                                  ? 'bg-red-500/20 text-red-400'
                                  : testCase.priority === 'Medium'
                                  ? 'bg-yellow-500/20 text-yellow-400'
                                  : 'bg-gray-500/20 text-gray-400'
                              }`}
                            >
                              {testCase.priority}
                            </span>
                          </div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-dark-border flex items-center justify-between">
          {viewMode === 'choice' ? (
            <>
              <div className="text-sm text-gray-400">
                Choose an option to continue
              </div>
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
            </>
          ) : viewMode === 'create' ? (
            <>
              <Button variant="secondary" onClick={handleBack}>
                Back
              </Button>
              <Button onClick={handleCreateCustom}>
                Create Test Case
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-400">
                  {selectedTestCaseIds.size > 0 ? (
                    <span>
                      {selectedTestCaseIds.size} test case{selectedTestCaseIds.size > 1 ? 's' : ''} selected
                    </span>
                  ) : (
                    <span>Select test cases to add</span>
                  )}
                </div>
                <Button
                  onClick={handleSubmitAddBack}
                  disabled={selectedTestCaseIds.size === 0}
                >
                  Add Selected ({selectedTestCaseIds.size})
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
