'use client';

import React, { useState, useEffect } from 'react';
import { Project, CreateProjectDto, UpdateProjectDto, ProjectStatus, Priority } from '@/types/project';
import { Button } from '@/components/ui/Button';

export interface ProjectFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProjectDto | UpdateProjectDto) => void;
  project?: Project;
}

const platformOptions = ['iOS', 'Android', 'Web', 'All', 'Other'];
const statusOptions: ProjectStatus[] = ['Draft', 'In Progress', 'Completed'];
const priorityOptions: Priority[] = ['High', 'Medium', 'Low'];

export const ProjectForm: React.FC<ProjectFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  project,
}) => {
  const [formData, setFormData] = useState<CreateProjectDto>({
    name: '',
    description: '',
    version: '',
    platform: '',
    status: 'Draft',
    priority: 'Medium',
    dueDate: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const isEditing = !!project;

  // Initialize form data when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        description: project.description || '',
        version: project.version || '',
        platform: project.platform || '',
        status: project.status,
        priority: project.priority || 'Medium',
        dueDate: project.dueDate || '',
      });
    } else {
      setFormData({
        name: '',
        description: '',
        version: '',
        platform: '',
        status: 'Draft',
        priority: 'Medium',
        dueDate: '',
      });
    }
    setErrors({});
  }, [project, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name is required
    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Project name must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Clean up empty optional fields
    const submitData: CreateProjectDto | UpdateProjectDto = {
      name: formData.name.trim(),
      description: formData.description?.trim() || undefined,
      version: formData.version?.trim() || undefined,
      platform: formData.platform?.trim() || undefined,
      status: formData.status,
      priority: formData.priority || 'Medium',
      dueDate: formData.dueDate || undefined,
    };

    onSubmit(submitData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
      version: '',
      platform: '',
      status: 'Draft',
      priority: 'Medium',
      dueDate: '',
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleCancel}
    >
      <div
        className="bg-dark-secondary border border-dark-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-dark-primary">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
          <p className="text-gray-400 mt-1">
            {isEditing
              ? 'Update project information'
              : 'Fill in the details to create a new project'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {/* Project Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Project Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-dark-elevated border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors ${
                  errors.name ? 'border-red-500' : 'border-dark-primary'
                }`}
                placeholder="Enter project name"
                aria-required="true"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-sm text-red-500" role="alert">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors resize-none"
                placeholder="Enter project description (optional)"
              />
            </div>

            {/* Version and Platform - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Version */}
              <div>
                <label
                  htmlFor="version"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Version
                </label>
                <input
                  type="text"
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                  placeholder="e.g., 1.0.0"
                />
              </div>

              {/* Platform */}
              <div>
                <label
                  htmlFor="platform"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Platform
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
                >
                  <option value="">Select platform</option>
                  {platformOptions.map((platform) => (
                    <option key={platform} value={platform}>
                      {platform}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Priority - Full Width (Status is auto-calculated) */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Priority
              </label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Status is automatically calculated: Draft (0% progress) → In Progress (1-99%) → Completed (100% passed)
              </p>
            </div>

            {/* Due Date - Full Width */}
            <div>
              <label
                htmlFor="dueDate"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 focus:outline-none focus:border-primary-500 transition-colors"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-dark-primary flex justify-end gap-3">
          <Button type="button" onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            {isEditing ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </div>
    </div>
  );
};
