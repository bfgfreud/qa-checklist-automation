'use client';

import React, { useState, useRef } from 'react';
import { ImageIndicator } from '@/components/ui/ImageIndicator';

interface TestCaseImageUploadProps {
  value?: string;           // Current image URL
  onChange: (url: string | null) => void;
  testCaseId?: string;      // For organizing storage path
  compact?: boolean;        // Compact mode for inline display
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const TestCaseImageUpload: React.FC<TestCaseImageUploadProps> = ({
  value,
  onChange,
  testCaseId,
  compact = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Please upload a JPEG, PNG, GIF, or WebP image';
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File size must be less than 5MB';
    }
    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Use testcase-specific endpoint
      const endpoint = testCaseId
        ? `/api/testcases/${testCaseId}/image`
        : '/api/testcases/image';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onChange(result.imageUrl);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (testCaseId && value) {
      try {
        await fetch(`/api/testcases/${testCaseId}/image`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    onChange(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Compact mode: just show indicator or small upload button
  if (compact) {
    return (
      <>
        {value ? (
          <div className="relative group inline-flex">
            <ImageIndicator imageUrl={value} size="sm" />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              title="Remove image"
            >
              <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleClick}
            disabled={isUploading}
            className="w-5 h-5 border border-dashed border-gray-500 hover:border-primary-500 rounded flex items-center justify-center text-gray-500 hover:text-primary-500 transition-colors disabled:opacity-50"
            title="Add image"
          >
            {isUploading ? (
              <div className="animate-spin w-3 h-3 border border-primary-500 border-t-transparent rounded-full" />
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_TYPES.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </>
    );
  }

  // Full mode for forms
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Reference Image (Optional)
      </label>

      <div className="flex items-start gap-3">
        {/* Image Preview / Upload Area */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center
            cursor-pointer transition-all flex-shrink-0 overflow-hidden
            ${isDragOver ? 'border-primary-500 bg-primary-500/10' : 'border-dark-border hover:border-primary-500'}
            ${isUploading ? 'opacity-50 cursor-wait' : ''}
          `}
        >
          {isUploading ? (
            <div className="animate-spin w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full" />
          ) : value ? (
            <img
              src={value}
              alt="Reference"
              className="w-full h-full object-cover"
              loading="lazy"
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
            {value ? 'Click to change' : 'Click or drag to upload'}
          </p>
          <p className="text-xs text-gray-500">
            JPEG, PNG, GIF, WebP (max 5MB)
          </p>
          {value && (
            <button
              type="button"
              onClick={handleRemove}
              className="mt-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-400">{error}</p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
