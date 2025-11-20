'use client';

import React, { useState, useRef } from 'react';
import { Button } from './Button';

interface ImageUploaderProps {
  testResultId: string;
  onUploadComplete: (url: string) => void;
  multiple?: boolean;
}

export function ImageUploader({ testResultId, onUploadComplete, multiple = true }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        if (!file.type.startsWith('image/')) {
          alert(`${file.name} is not an image file`);
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          alert(`${file.name} is too large (max 5MB)`);
          continue;
        }

        // Create FormData
        const formData = new FormData();
        formData.append('file', file);

        // Upload to API
        const response = await fetch(`/api/test-results/${testResultId}/attachments`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }

        const result = await response.json();
        if (result.success) {
          onUploadComplete(result.data.file_url);
        }
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Failed to upload one or more images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  return (
    <div>
      {/* Drag & Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          dragActive
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-dark-border hover:border-dark-primary bg-dark-bg'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        {uploading ? (
          <div className="py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-400">Uploading...</p>
          </div>
        ) : (
          <div className="py-4">
            <svg
              className="w-12 h-12 text-gray-500 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-sm text-gray-400 mb-2">
              Drag and drop images here, or click to select
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select Files
            </Button>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG, GIF up to 5MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
