'use client';

import React, { useState } from 'react';
import { TestCaseAttachment } from '@/types/attachment';

interface ImageGalleryProps {
  attachments: TestCaseAttachment[];
  onDelete?: (attachmentId: string) => void;
  readonly?: boolean;
  compact?: boolean;
}

export function ImageGallery({ attachments, onDelete, readonly = false, compact = false }: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<TestCaseAttachment | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleDelete = async (attachmentId: string) => {
    if (!onDelete) return;

    if (!confirm('Are you sure you want to delete this image?')) {
      return;
    }

    setDeleting(attachmentId);

    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      onDelete(attachmentId);
    } catch (error) {
      console.error('Error deleting attachment:', error);
      alert('Failed to delete image. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  if (attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No images attached
      </div>
    );
  }

  return (
    <>
      {/* Thumbnail Grid */}
      <div className={compact
        ? "flex flex-wrap gap-1.5"
        : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3"
      }>
        {attachments.map((attachment) => (
          <div
            key={attachment.id}
            className={`relative group bg-dark-bg rounded overflow-hidden border border-dark-border hover:border-primary-500 transition-colors ${
              compact
                ? "w-16 h-16"
                : "aspect-square"
            }`}
          >
            {/* Image */}
            <img
              src={attachment.file_url}
              alt={attachment.file_name}
              className="w-full h-full object-cover cursor-pointer"
              onClick={() => setSelectedImage(attachment)}
            />

            {/* Overlay */}
            <div className={`absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center ${
              compact ? "gap-0.5" : "gap-2"
            }`}>
              {/* View Button */}
              <button
                onClick={() => setSelectedImage(attachment)}
                className={`bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors ${
                  compact ? "p-1" : "p-2"
                }`}
                title="View full size"
              >
                <svg className={compact ? "w-3 h-3" : "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>

              {/* Delete Button */}
              {!readonly && onDelete && (
                <button
                  onClick={() => handleDelete(attachment.id)}
                  disabled={deleting === attachment.id}
                  className={`bg-red-500 text-white rounded hover:bg-red-600 transition-colors disabled:opacity-50 ${
                    compact ? "p-1" : "p-2"
                  }`}
                  title="Delete image"
                >
                  {deleting === attachment.id ? (
                    <div className={`border-2 border-white border-t-transparent rounded-full animate-spin ${
                      compact ? "w-3 h-3" : "w-5 h-5"
                    }`} />
                  ) : (
                    <svg className={compact ? "w-3 h-3" : "w-5 h-5"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  )}
                </button>
              )}
            </div>

            {/* File Name - only show in non-compact mode */}
            {!compact && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/80 text-white text-xs p-2 truncate">
                {attachment.file_name}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-dark-secondary text-white rounded-lg hover:bg-dark-primary transition-colors z-10"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image Info - Top Left */}
            <div className="absolute top-4 left-4 bg-dark-secondary/90 text-white p-3 rounded-lg max-w-sm">
              <div className="font-semibold text-sm">{selectedImage.file_name}</div>
              <div className="text-xs text-gray-400 mt-1">
                {selectedImage.file_size ? `${(selectedImage.file_size / 1024).toFixed(1)} KB • ` : ''}
                {new Date(selectedImage.uploaded_at).toLocaleString()}
              </div>
            </div>

            {/* Image */}
            <img
              src={selectedImage.file_url}
              alt={selectedImage.file_name}
              className="max-w-full max-h-[90vh] object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* Navigation */}
            {attachments.length > 1 && (
              <>
                {/* Previous */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = attachments.findIndex((a) => a.id === selectedImage.id);
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : attachments.length - 1;
                    setSelectedImage(attachments[prevIndex]);
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-dark-secondary text-white rounded-lg hover:bg-dark-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Next */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentIndex = attachments.findIndex((a) => a.id === selectedImage.id);
                    const nextIndex = currentIndex < attachments.length - 1 ? currentIndex + 1 : 0;
                    setSelectedImage(attachments[nextIndex]);
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-dark-secondary text-white rounded-lg hover:bg-dark-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
