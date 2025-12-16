'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ImageIndicatorProps {
  imageUrl: string;
  alt?: string;
  size?: 'xs' | 'sm' | 'md';  // xs=16px, sm=20px, md=32px
  className?: string;
}

/**
 * Compact image indicator component for inline display
 * - Shows mini-thumbnail
 * - Hover: Shows larger preview popup (150x150px)
 * - Click: Opens full lightbox
 */
export function ImageIndicator({
  imageUrl,
  alt = 'Image',
  size = 'xs',
  className = ''
}: ImageIndicatorProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [previewPosition, setPreviewPosition] = useState({ top: 0, left: 0 });
  const thumbnailRef = useRef<HTMLButtonElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
  };

  const handleMouseEnter = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      if (thumbnailRef.current) {
        const rect = thumbnailRef.current.getBoundingClientRect();
        const previewWidth = 150;
        const previewHeight = 150;

        // Position above by default
        let top = rect.top - previewHeight - 8;
        let left = rect.left + (rect.width / 2) - (previewWidth / 2);

        // If too close to top, show below
        if (top < 8) {
          top = rect.bottom + 8;
        }

        // Keep within horizontal bounds
        if (left < 8) {
          left = 8;
        }
        if (left + previewWidth > window.innerWidth - 8) {
          left = window.innerWidth - previewWidth - 8;
        }

        setPreviewPosition({ top, left });
        setShowPreview(true);
      }
    }, 200);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setShowPreview(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowPreview(false);
    setShowLightbox(true);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Mini Thumbnail */}
      <button
        ref={thumbnailRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`${sizeClasses[size]} rounded-sm overflow-hidden border border-white/10 hover:border-primary-500 cursor-pointer flex-shrink-0 transition-all hover:ring-1 hover:ring-primary-500/50 ${className}`}
        title="Click to view full image"
      >
        <img
          src={imageUrl}
          alt={alt}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </button>

      {/* Hover Preview Popup */}
      {showPreview && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ top: previewPosition.top, left: previewPosition.left }}
        >
          <div className="w-[150px] h-[150px] bg-dark-elevated border border-dark-primary rounded-lg shadow-xl overflow-hidden">
            <img
              src={imageUrl}
              alt={alt}
              className="w-full h-full object-contain bg-black/50"
            />
          </div>
        </div>
      )}

      {/* Full Lightbox */}
      {showLightbox && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center"
          onClick={() => setShowLightbox(false)}
        >
          {/* Close Button */}
          <button
            onClick={() => setShowLightbox(false)}
            className="fixed top-4 right-4 p-2 bg-dark-secondary text-white rounded-lg hover:bg-dark-primary transition-colors z-20"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Full Image */}
          <img
            src={imageUrl}
            alt={alt}
            className="max-w-[calc(100vw-8rem)] max-h-[calc(100vh-8rem)] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
