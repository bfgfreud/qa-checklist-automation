'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './Button';

interface ImageUploaderProps {
  testResultId: string;
  onUploadComplete: (url: string) => void;
  multiple?: boolean;
  compact?: boolean;
}

export function ImageUploader({ testResultId, onUploadComplete, multiple = true, compact = false }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [showPastePrompt, setShowPastePrompt] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pasteAreaRef = useRef<HTMLDivElement>(null);

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

  // Handle click on paste button - auto-trigger paste
  const handlePasteButtonClick = async () => {
    // Try modern Clipboard API first (works in most modern browsers with user gesture)
    try {
      if (navigator.clipboard && navigator.clipboard.read) {
        const clipboardItems = await navigator.clipboard.read();
        const imageFiles: File[] = [];

        for (const clipboardItem of clipboardItems) {
          for (const type of clipboardItem.types) {
            if (type.startsWith('image/')) {
              const blob = await clipboardItem.getType(type);
              const file = new File([blob], `pasted-image-${Date.now()}.png`, { type });
              imageFiles.push(file);
            }
          }
        }

        if (imageFiles.length > 0) {
          const dt = new DataTransfer();
          for (const file of imageFiles) {
            dt.items.add(file);
          }
          await handleFileSelect(dt.files);
          return; // Success!
        }
      }
    } catch (err) {
      console.log('Clipboard API failed, trying fallback:', err);
    }

    // Fallback: Focus paste area and try execCommand
    setShowPastePrompt(true);
    if (pasteAreaRef.current) {
      pasteAreaRef.current.focus();

      // Try execCommand paste (might work in some browsers)
      setTimeout(() => {
        const success = document.execCommand('paste');
        if (!success) {
          // If execCommand fails, keep the prompt visible for manual paste
          console.log('Auto-paste failed, waiting for manual Ctrl+V');
        } else {
          setShowPastePrompt(false);
        }
      }, 50);
    }
  };

  // Handle paste event on the paste area
  const handlePasteEvent = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    setShowPastePrompt(false); // Hide prompt after paste

    const items = e.clipboardData?.items;
    if (!items) {
      alert('No clipboard data available. Please try copying the image again.');
      return;
    }

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      for (const file of imageFiles) {
        dt.items.add(file);
      }
      await handleFileSelect(dt.files);
    } else {
      alert('No images found in clipboard. Please copy an image (not a file path) using Ctrl+C or right-click > Copy Image.');
    }
  };

  return (
    <div ref={containerRef}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      {/* Paste area - shows when paste button is clicked */}
      {showPastePrompt && (
        <div className="mb-2 p-2 bg-primary-500/10 border border-primary-500 rounded text-xs text-primary-400 animate-pulse">
          ✨ Paste area ready! Press <kbd className="px-1 py-0.5 bg-dark-elevated rounded font-mono">Ctrl+V</kbd> to paste your image
        </div>
      )}
      <div
        ref={pasteAreaRef}
        contentEditable
        onPaste={handlePasteEvent}
        onBlur={() => setShowPastePrompt(false)}
        className="sr-only"
        style={{ position: 'absolute', left: '-9999px' }}
        tabIndex={-1}
      />

      {compact ? (
        /* Compact Mode: Two tiny buttons side by side */
        <div className="flex gap-1">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 px-2 py-0.5 bg-dark-border hover:bg-dark-primary text-gray-400 hover:text-gray-200 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {uploading ? (
              <>
                <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />
                <span className="text-[10px]">Uploading...</span>
              </>
            ) : (
              <>
                <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="text-[10px]">Upload</span>
              </>
            )}
          </button>
          <button
            onClick={handlePasteButtonClick}
            disabled={uploading}
            title="Click then press Ctrl+V to paste image"
            className="flex-1 px-2 py-0.5 bg-dark-border hover:bg-dark-primary text-gray-400 hover:text-gray-200 rounded text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[10px]">Paste</span>
          </button>
        </div>
      ) : (
        /* Full Mode: Drag & Drop Zone */
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
      )}
    </div>
  );
}
