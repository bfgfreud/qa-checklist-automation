'use client';

import React, { useState, useRef } from 'react';

interface ThumbnailUploadProps {
  value?: string;           // Current thumbnail URL
  onChange: (url: string | null, fileName: string | null) => void;
  moduleId?: string;        // For organizing storage path
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const ThumbnailUpload: React.FC<ThumbnailUploadProps> = ({
  value,
  onChange,
  moduleId,
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
      return 'File size must be less than 10MB';
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
      if (moduleId) {
        formData.append('moduleId', moduleId);
      }

      const response = await fetch('/api/modules/thumbnail', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      onChange(result.url, result.fileName);
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

  const handleRemove = async () => {
    // Just clear the value - actual deletion can happen on save
    onChange(null, null);
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

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Thumbnail (Optional)
      </label>

      <div className="flex items-start gap-3">
        {/* Thumbnail Preview / Upload Area */}
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
              alt="Thumbnail"
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
            JPEG, PNG, GIF, WebP (max 10MB)
          </p>
          {value && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
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
