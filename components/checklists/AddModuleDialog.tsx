'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Module, Priority } from '@/types/module';

export interface AddModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module;
  projectId: string;
  existingInstanceLabels: string[];
  onSubmit: (data: {
    moduleId: string;
    instanceLabel?: string;
    priority?: Priority;
    tags?: string[];
  }) => Promise<void>;
}

export const AddModuleDialog: React.FC<AddModuleDialogProps> = ({
  isOpen,
  onClose,
  module,
  projectId,
  existingInstanceLabels,
  onSubmit,
}) => {
  const [instanceLabel, setInstanceLabel] = useState<string>('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [tags, setTags] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setInstanceLabel(module.name);
      setPriority('Medium');
      setTags(module.tags?.join(', ') || '');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, module]);

  const validateInstanceLabel = (label: string): boolean => {
    const trimmedLabel = label.trim();

    if (!trimmedLabel) {
      setError('Instance name is required');
      return false;
    }

    if (trimmedLabel.length > 100) {
      setError('Instance name must be less than 100 characters');
      return false;
    }

    // Check for duplicate instance labels (case-insensitive)
    const isDuplicate = existingInstanceLabels.some(
      (existing) => existing.toLowerCase() === trimmedLabel.toLowerCase()
    );

    if (isDuplicate) {
      setError('This module name already exists in current project. Please change the name.');
      return false;
    }

    setError('');
    return true;
  };

  const handleInstanceLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInstanceLabel(value);

    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLabel = instanceLabel.trim();

    // Validate instance label
    if (!validateInstanceLabel(trimmedLabel)) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Parse tags (comma-separated)
      const parsedTags = tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await onSubmit({
        moduleId: module.id,
        instanceLabel: trimmedLabel,
        priority,
        tags: parsedTags.length > 0 ? parsedTags : undefined,
      });

      // Close modal on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add module');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title="Add Module to Checklist">
      <form onSubmit={handleSubmit}>
        {/* Module Info (Read-only) */}
        <div className="mb-6 p-4 bg-dark-elevated rounded-lg border border-dark-border">
          <h3 className="text-sm font-semibold text-white mb-2">Module Information</h3>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">
              <span className="font-medium">Name:</span> {module.name}
            </p>
            {module.description && (
              <p className="text-gray-300">
                <span className="font-medium">Description:</span> {module.description}
              </p>
            )}
            <p className="text-gray-400">
              <span className="font-medium">Test Cases:</span> {module.testCases?.length || 0}
            </p>
          </div>
        </div>

        {/* Instance Label (Required, Unique) */}
        <div className="mb-4">
          <Input
            label="Instance Name"
            placeholder="e.g., Sign In - Ayaka Test"
            value={instanceLabel}
            onChange={handleInstanceLabelChange}
            error={error}
            required
            disabled={isSubmitting}
            autoFocus
          />
          <p className="mt-1 text-xs text-gray-500">
            Customize the name for this module instance. Must be unique within the project.
          </p>
        </div>

        {/* Priority (Optional, defaults to Medium) */}
        <div className="mb-4">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            options={[
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Adjust priority for this specific instance if needed.
          </p>
        </div>

        {/* Tags (Optional, comma-separated) */}
        <div className="mb-6">
          <Input
            label="Tags"
            placeholder="e.g., critical, authentication, regression"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={isSubmitting}
          />
          <p className="mt-1 text-xs text-gray-500">
            Separate tags with commas. You can add or remove tags for this instance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="bg-dark-elevated border border-dark-border text-gray-300 hover:bg-dark-primary"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add to Checklist'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
