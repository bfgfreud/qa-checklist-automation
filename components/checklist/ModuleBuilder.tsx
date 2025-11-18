'use client';

import React, { useState, useMemo } from 'react';
import { Module } from '@/types/module';
import { ChecklistModuleWithResults } from '@/types/checklist';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { AddModuleModal } from './AddModuleModal';

export interface ModuleBuilderProps {
  projectName: string;
  availableModules: Module[];
  addedModules: ChecklistModuleWithResults[];
  onAddModule: (moduleId: string, instanceLabel?: string) => Promise<void>;
  onRemoveModule: (checklistModuleId: string) => Promise<void>;
  isLoading?: boolean;
}

export const ModuleBuilder: React.FC<ModuleBuilderProps> = ({
  projectName,
  availableModules,
  addedModules,
  onAddModule,
  onRemoveModule,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Ensure arrays are always arrays
  const safeAvailableModules = Array.isArray(availableModules) ? availableModules : [];
  const safeAddedModules = Array.isArray(addedModules) ? addedModules : [];

  // Filter available modules
  const filteredModules = useMemo(() => {
    if (!searchTerm.trim()) return safeAvailableModules;

    const term = searchTerm.toLowerCase();
    return safeAvailableModules.filter(
      (module) =>
        module.name.toLowerCase().includes(term) ||
        module.description?.toLowerCase().includes(term) ||
        module.tags?.some((tag) => tag.toLowerCase().includes(term))
    );
  }, [safeAvailableModules, searchTerm]);

  const handleAddClick = (module: Module) => {
    setSelectedModule(module);
    setIsModalOpen(true);
  };

  const handleConfirmAdd = async (moduleId: string, instanceLabel?: string) => {
    console.log('[DEBUG ModuleBuilder] handleConfirmAdd called with:', { moduleId, instanceLabel });
    console.log('[DEBUG ModuleBuilder] Calling parent onAddModule...');
    await onAddModule(moduleId, instanceLabel);
    console.log('[DEBUG ModuleBuilder] Parent onAddModule completed');
  };

  const handleRemove = async (checklistModuleId: string) => {
    if (!confirm('Are you sure you want to remove this module from the checklist?')) {
      return;
    }

    setRemovingId(checklistModuleId);
    try {
      await onRemoveModule(checklistModuleId);
    } finally {
      setRemovingId(null);
    }
  };

  const getDisplayName = (module: ChecklistModuleWithResults) => {
    if (module.instanceLabel) {
      return `${module.moduleName} - ${module.instanceLabel}`;
    }
    return `${module.moduleName} (${module.instanceNumber})`;
  };

  return (
    <div className="h-full flex flex-col bg-dark-surface">
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <h2 className="text-xl font-bold text-white mb-1">Build Checklist</h2>
        <p className="text-sm text-dark-text-secondary">{projectName}</p>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-dark-border">
        <Input
          placeholder="Search modules..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      {/* Available Modules */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-dark-text-secondary uppercase tracking-wide mb-3">
            Available Modules
          </h3>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-dark-elevated rounded-lg p-3 animate-pulse">
                  <div className="h-4 bg-dark-border rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-dark-border rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : filteredModules.length === 0 ? (
            <p className="text-sm text-dark-text-tertiary text-center py-8">
              {searchTerm ? 'No modules found' : 'No modules available'}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredModules.map((module) => (
                <div
                  key={module.id}
                  className="bg-dark-elevated border border-dark-border rounded-lg p-3 hover:border-primary-500/30 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {module.icon && <span className="text-xl">{module.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">{module.name}</h4>
                      {module.description && (
                        <p className="text-xs text-dark-text-tertiary line-clamp-2 mt-1">
                          {module.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default" className="text-xs bg-primary-500/20 text-primary-400 border-primary-500/30">
                        {(module.testCases?.length || 0)} tests
                      </Badge>
                      {module.tags?.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" variant="primary" onClick={() => handleAddClick(module)}>
                      Add
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Added Modules */}
      <div className="border-t border-dark-border">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-dark-text-secondary uppercase tracking-wide mb-3">
            Added to Checklist ({safeAddedModules.length})
          </h3>
          {safeAddedModules.length === 0 ? (
            <p className="text-sm text-dark-text-tertiary text-center py-4">
              No modules added yet
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {safeAddedModules.map((module) => (
                <div
                  key={module.id}
                  className="bg-dark-bg border border-dark-border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {getDisplayName(module)}
                      </h4>
                      <p className="text-xs text-dark-text-tertiary mt-1">
                        {module.totalTests} test{module.totalTests !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(module.id)}
                      disabled={removingId === module.id}
                      className="text-red-400 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1 disabled:opacity-50"
                      aria-label="Remove module"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </button>
                  </div>
                  <ProgressBar value={module.progress} size="sm" showLabel={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Module Modal */}
      <AddModuleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        module={selectedModule}
        onConfirm={handleConfirmAdd}
      />
    </div>
  );
};
