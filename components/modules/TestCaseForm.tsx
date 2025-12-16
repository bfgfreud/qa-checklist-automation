'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { TestCaseImageUpload } from '@/components/modules/TestCaseImageUpload';
import {
  TestCase,
  Priority,
  CreateTestCaseDto,
  UpdateTestCaseDto,
} from '@/types/module';

export interface TestCaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTestCaseDto | UpdateTestCaseDto) => Promise<void>;
  testCase?: TestCase;
}

const priorityOptions = [
  { value: 'High', label: 'High' },
  { value: 'Medium', label: 'Medium' },
  { value: 'Low', label: 'Low' },
];

export const TestCaseForm: React.FC<TestCaseFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  testCase,
}) => {
  const [formData, setFormData] = useState<CreateTestCaseDto>({
    title: '',
    description: '',
    priority: 'Medium',
    imageUrl: undefined,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (testCase) {
      setFormData({
        title: testCase.title,
        description: testCase.description || '',
        priority: testCase.priority,
        imageUrl: testCase.imageUrl,
      });
    } else {
      setFormData({ title: '', description: '', priority: 'Medium', imageUrl: undefined });
    }
    setErrors({});
  }, [testCase, isOpen]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Test case title is required';
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
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit test case:', error);
      setErrors({ submit: 'Failed to save test case. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={testCase ? 'Edit Test Case' : 'New Test Case'}
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
          label="Test Case Title"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          error={errors.title}
          placeholder="e.g., Google Sign In"
          autoFocus
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed test case description..."
          rows={3}
        />

        <TestCaseImageUpload
          value={formData.imageUrl}
          onChange={(url) => setFormData({ ...formData, imageUrl: url || undefined })}
          testCaseId={testCase?.id}
        />

        <Select
          label="Priority"
          required
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
          options={priorityOptions}
        />

        {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
      </form>
    </Modal>
  );
};
