'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Module, CreateModuleDto, UpdateModuleDto } from '@/types/module';

// Preset tags for Mobile Game QA Testing
const PRESET_TAGS = [
  'UI/UX',
  'Gameplay',
  'Performance',
  'Localization',
  'IAP',
  'Social Features',
  'Tutorial',
  'Settings',
  'Audio',
  'Notifications',
  'Analytics',
  'Ads Integration',
  'Cross-Platform',
  'Multiplayer',
  'Progression System',
  'Monetization',
  'Onboarding',
  'Accessibility',
  'Device Compatibility',
  'Network/Connectivity',
];

export interface ModuleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateModuleDto | UpdateModuleDto) => Promise<void>;
  module?: Module;
}

export const ModuleForm: React.FC<ModuleFormProps> = ({ isOpen, onClose, onSubmit, module }) => {
  const [formData, setFormData] = useState<CreateModuleDto>({
    name: '',
    description: '',
    icon: '',
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const tagButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (module) {
      setFormData({
        name: module.name,
        description: module.description || '',
        icon: module.icon || '',
      });
      setTags(module.tags || []);
    } else {
      setFormData({ name: '', description: '', icon: '' });
      setTags([]);
    }
    setTagInput('');
    setErrors({});
  }, [module, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setShowTagDropdown(false);
      }
    };

    if (showTagDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showTagDropdown]);

  // Generate consistent color from tag name (deterministic)
  const getTagColor = (tag: string): string => {
    const colors = [
      '#FF6B35', // orange (primary)
      '#4ECDC4', // teal
      '#45B7D1', // blue
      '#96CEB4', // green
      '#FFEAA7', // yellow
      '#DDA15E', // brown
      '#BC6C25', // dark orange
      '#9B59B6', // purple
      '#E74C3C', // red
      '#3498DB', // sky blue
      '#F39C12', // amber
      '#1ABC9C', // turquoise
      '#2ECC71', // emerald
      '#E67E22', // carrot
      '#8E44AD', // wisteria
      '#C0392B', // pomegranate
      '#16A085', // green sea
      '#27AE60', // nephritis
      '#D35400', // pumpkin
      '#2980B9', // belize hole
      '#F1C40F', // sunflower
      '#E91E63', // pink
    ];

    // Simple hash function for consistent color
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
      hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }

    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const addTag = (newTag: string) => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;

    // Check for duplicates (case-insensitive)
    const isDuplicate = tags.some(t => t.toLowerCase() === trimmedTag.toLowerCase());
    if (isDuplicate) return;

    setTags([...tags, trimmedTag]);
    setTagInput('');
  };

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter(t => t !== tag));
    } else {
      setTags([...tags, tag]);
    }
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      // Remove last tag on backspace if input is empty
      removeTag(tags.length - 1);
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Module name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        icon: formData.icon,
        tags: tags,
      });
      onClose();
    } catch (error) {
      console.error('Failed to submit module:', error);
      setErrors({ submit: 'Failed to save module. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={module ? 'Edit Module' : 'New Module'}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Module Name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g., Sign In"
          autoFocus
        />

        <Input
          label="Icon (Emoji)"
          value={formData.icon}
          onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
          placeholder="e.g., 🔐"
          maxLength={2}
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Brief description of this module..."
          rows={3}
        />

        {/* Tags Multi-Select */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (Select multiple)
          </label>

          {/* Selected tags display */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium"
                  style={{ backgroundColor: getTagColor(tag), color: '#fff' }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="hover:bg-black/20 rounded-full p-0.5 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Multi-select dropdown */}
          <div className="relative" ref={tagDropdownRef}>
            <button
              ref={tagButtonRef}
              type="button"
              onClick={() => {
                if (!showTagDropdown && tagButtonRef.current) {
                  const rect = tagButtonRef.current.getBoundingClientRect();
                  setDropdownPosition({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                  });
                }
                setShowTagDropdown(!showTagDropdown);
              }}
              className="w-full px-3 py-2 bg-dark-elevated border border-dark-primary rounded-md text-left text-gray-200 flex items-center justify-between hover:border-primary-500 transition-colors"
            >
              <span className={tags.length > 0 ? 'text-gray-200' : 'text-gray-500'}>
                {tags.length > 0 ? `${tags.length} tags selected` : 'Select tags...'}
              </span>
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>

            {/* Dropdown menu - fixed positioning to avoid modal scrollbar */}
            {showTagDropdown && dropdownPosition && (
              <div
                className="fixed z-50 bg-dark-elevated border border-dark-border rounded-md shadow-lg max-h-60 overflow-auto"
                style={{
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width
                }}
              >
                {PRESET_TAGS.map((presetTag) => {
                  const isSelected = tags.includes(presetTag);
                  return (
                    <button
                      key={presetTag}
                      type="button"
                      onClick={() => toggleTag(presetTag)}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-dark-border transition-colors flex items-center gap-2 ${
                        isSelected ? 'bg-primary-500/20 text-primary-400' : 'text-gray-300'
                      }`}
                    >
                      <div className={`w-4 h-4 border rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-primary-500 border-primary-500' : 'border-gray-600'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      {presetTag}
                    </button>
                  );
                })}

                {/* Custom tag option */}
                <div className="border-t border-dark-border p-2">
                  <input
                    type="text"
                    placeholder="Add custom tag..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && customTagInput.trim()) {
                        e.preventDefault();
                        addTag(customTagInput.trim());
                        setCustomTagInput('');
                      }
                    }}
                    className="w-full px-2 py-1 bg-dark-bg border border-dark-border rounded text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Press Enter to add custom tag</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
      </form>
    </Modal>
  );
};
