'use client';

import React, { useState } from 'react';
import { Module } from '@/types/module';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export interface AddModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module: Module | null;
  onConfirm: (moduleId: string, instanceLabel?: string) => Promise<void>;
}

export const AddModuleModal: React.FC<AddModuleModalProps> = ({
  isOpen,
  onClose,
  module,
  onConfirm,
}) => {
  const [instanceLabel, setInstanceLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    console.log('[DEBUG Modal] handleConfirm called');
    if (!module) {
      console.log('[DEBUG Modal] No module selected, returning');
      return;
    }

    console.log('[DEBUG Modal] Module:', module.id, 'Label:', instanceLabel);
    setIsSubmitting(true);
    try {
      console.log('[DEBUG Modal] Calling onConfirm...');
      await onConfirm(module.id, instanceLabel.trim() || undefined);
      console.log('[DEBUG Modal] onConfirm completed successfully');
      setInstanceLabel('');
      console.log('[DEBUG Modal] Closing modal...');
      onClose();
      console.log('[DEBUG Modal] Modal closed');
    } catch (error) {
      console.error('[DEBUG Modal] Failed to add module:', error);
      // Don't close modal on error so user can see what went wrong
    } finally {
      setIsSubmitting(false);
      console.log('[DEBUG Modal] isSubmitting set to false');
    }
  };

  const handleClose = () => {
    setInstanceLabel('');
    onClose();
  };

  if (!module) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Module to Checklist"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add to Checklist'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Module Info */}
        <div className="bg-dark-elevated p-4 rounded-lg border border-dark-border">
          <h3 className="text-lg font-semibold text-white mb-2">{module.name}</h3>
          {module.description && (
            <p className="text-sm text-dark-text-secondary mb-3">{module.description}</p>
          )}
          <div className="flex items-center gap-2 mb-2">
            {module.icon && <span className="text-2xl">{module.icon}</span>}
            {module.tags && module.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {module.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Badge variant="default" className="bg-primary-500/20 text-primary-400 border-primary-500/30">
            {(module.testCases?.length || 0)} test case{(module.testCases?.length || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Instance Label Input */}
        <div>
          <Input
            label="Instance Label (Optional)"
            placeholder="e.g., Character Name, Feature Variant"
            value={instanceLabel}
            onChange={(e) => setInstanceLabel(e.target.value)}
            autoFocus
          />
          <p className="mt-2 text-xs text-dark-text-tertiary">
            Leave blank for auto-numbering (e.g., &quot;{module.name} (1)&quot;).
            <br />
            Or provide a custom label (e.g., &quot;{module.name} - Ayaka&quot;).
          </p>
        </div>

        {/* Preview */}
        <div className="bg-dark-bg p-3 rounded-lg border border-dark-border">
          <p className="text-xs text-dark-text-tertiary mb-1">Preview:</p>
          <p className="text-sm font-medium text-white">
            {module.name}
            {instanceLabel.trim() ? ` - ${instanceLabel.trim()}` : ' (Auto-numbered)'}
          </p>
        </div>

        {/* Test Cases Preview */}
        <div>
          <h4 className="text-sm font-medium text-dark-text-secondary mb-2">Test Cases to be Added:</h4>
          <div className="max-h-48 overflow-y-auto space-y-2 bg-dark-bg p-3 rounded-lg border border-dark-border">
            {(module.testCases || []).map((testCase) => (
              <div key={testCase.id} className="flex items-start gap-2">
                <span className="text-primary-500 mt-1">•</span>
                <div className="flex-1">
                  <p className="text-sm text-white">{testCase.title}</p>
                  {testCase.description && (
                    <p className="text-xs text-dark-text-tertiary mt-0.5">{testCase.description}</p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${
                    testCase.priority === 'High'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : testCase.priority === 'Medium'
                      ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                      : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                  }`}
                >
                  {testCase.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
