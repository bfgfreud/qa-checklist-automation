'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Module, CreateModuleDto, UpdateModuleDto } from '@/types/module';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

        {/* Tags Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tags (Optional)
          </label>
          <div className="space-y-2">
            {/* Display existing tags as chips */}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
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

            {/* Input for new tag */}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tags (press Enter or comma)"
              className="w-full px-3 py-2 bg-dark-elevated border border-dark-primary rounded-md text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500"
              aria-label="Add new tag"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Press Enter or comma to add tags. Click × to remove.
          </p>
        </div>

        {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
      </form>
    </Modal>
  );
};
