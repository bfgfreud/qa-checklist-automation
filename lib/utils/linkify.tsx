import React from 'react';

/**
 * Linkify utility - automatically detects URLs in text and converts them to clickable links
 */

// URL regex pattern that matches http(s) URLs
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Convert plain text with URLs into React elements with clickable links
 * @param text - The text to linkify
 * @returns Array of React elements (text + link elements)
 */
export const linkifyText = (text: string): (string | React.ReactElement)[] => {
  if (!text) return [];

  const parts = text.split(URL_REGEX);

  return parts.map((part, index) => {
    // Check if this part is a URL
    if (part.match(URL_REGEX)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline break-all"
          onClick={(e) => e.stopPropagation()} // Prevent parent click handlers
        >
          {part}
        </a>
      );
    }

    // Return plain text
    return part;
  });
};

/**
 * Simple helper to check if text contains any URLs
 * @param text - The text to check
 * @returns true if text contains at least one URL
 */
export const containsUrl = (text: string): boolean => {
  return URL_REGEX.test(text);
};
