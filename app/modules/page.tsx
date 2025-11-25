'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Module, TestCase, Priority, CreateModuleDto, CreateTestCaseDto, UpdateModuleDto, UpdateTestCaseDto } from '@/types/module';
import { Button } from '@/components/ui/Button';
import { ModuleCard } from '@/components/modules/ModuleCard';
import { ModuleForm } from '@/components/modules/ModuleForm';
import { TestCaseForm } from '@/components/modules/TestCaseForm';

// Types for tracking changes in draft mode
// type ChangeType = 'created' | 'updated' | 'deleted' | 'reordered';

export default function ModulesPage() {
  // Server state (source of truth from API)
  const [modules, setModules] = useState<Module[]>([]);

  // Draft state (local working copy)
  const [draftModules, setDraftModules] = useState<Module[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track created/deleted items with temporary IDs
  const [deletedModuleIds, setDeletedModuleIds] = useState<Set<string>>(new Set());
  const [deletedTestCaseIds, setDeletedTestCaseIds] = useState<Set<string>>(new Set());

  // UI state for expand/collapse and search
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // CSV Import state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{
    newModules: Module[];
    updatedModules: { old: Module; new: Module }[];
    stats: { modulesAdded: number; modulesUpdated: number; testCasesAdded: number; testCasesReplaced: number };
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModuleFormOpen, setIsModuleFormOpen] = useState(false);
  const [isTestCaseFormOpen, setIsTestCaseFormOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | undefined>();
  const [editingTestCase, setEditingTestCase] = useState<TestCase | undefined>();
  const [activeModuleId, setActiveModuleId] = useState<string>('');
  const success = (_msg: string) => console.log('Success:', _msg);
  const error = (_msg: string) => console.error('Error:', _msg);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load modules from API on mount
  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Set up beforeunload warning when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Do you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  /**
   * Fetch all modules with their test cases from the API
   */
  const fetchModules = async (bustCache = false) => {
    setLoading(true);
    try {
      const url = bustCache ? `/api/modules?_t=${Date.now()}` : '/api/modules';
      const response = await fetch(url, {
        cache: bustCache ? 'no-cache' : 'default',
      });
      const result = await response.json();

      if (result.success) {
        // Transform the Supabase data to match our frontend types
        const transformedModules: Module[] = result.data.map((mod: Record<string, unknown>) => ({
          id: mod.id,
          name: mod.name,
          description: mod.description,
          icon: mod.icon || '📦', // default icon if not provided
          tags: Array.isArray(mod.tags) ? mod.tags : [], // Transform tags
          order: mod.order_index,
          createdAt: mod.created_at,
          updatedAt: mod.updated_at,
          testCases: ((mod.testcases as Record<string, string>[]) || []).map((tc) => ({
            id: tc.id,
            moduleId: tc.module_id,
            title: tc.title,
            description: tc.description,
            priority: tc.priority,
            order: tc.order_index,
            createdAt: tc.created_at,
            updatedAt: tc.updated_at,
          }))
        }));
        // Set both server state and draft state
        setModules(transformedModules);
        setDraftModules(transformedModules);
        // Reset change tracking
        setHasUnsavedChanges(false);
        setDeletedModuleIds(new Set());
        setDeletedTestCaseIds(new Set());
      } else {
        error(result.error || 'Failed to load modules');
      }
    } catch {
      console.error('Error fetching modules');
      error('Failed to load modules');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Check if we're dragging modules or test cases
    const activeModule = draftModules.find((m) => m.id === active.id);

    if (activeModule) {
      // Dragging modules - update draft only
      const oldIndex = draftModules.findIndex((m) => m.id === active.id);
      const newIndex = draftModules.findIndex((m) => m.id === over.id);

      const reorderedModules = arrayMove(draftModules, oldIndex, newIndex).map((m, idx) => ({
        ...m,
        order: idx,
      }));

      setDraftModules(reorderedModules);
      setHasUnsavedChanges(true);
    } else {
      // Dragging test cases - update draft only
      setDraftModules((prevModules) =>
        prevModules.map((module) => {
          const testCase = module.testCases.find((tc) => tc.id === active.id);
          if (testCase) {
            const oldIndex = module.testCases.findIndex((tc) => tc.id === active.id);
            const newIndex = module.testCases.findIndex((tc) => tc.id === over.id);

            const reorderedTestCases = arrayMove(module.testCases, oldIndex, newIndex).map(
              (tc, idx) => ({
                ...tc,
                order: idx,
              })
            );

            return { ...module, testCases: reorderedTestCases };
          }
          return module;
        })
      );
      setHasUnsavedChanges(true);
    }
  };

  /**
   * DRAFT MODE HANDLERS - Update local state only, no API calls
   */

  const handleCreateModule = async (data: CreateModuleDto | UpdateModuleDto) => {
    const moduleName = (data as CreateModuleDto).name;

    // Check for duplicate module name (case-insensitive)
    const duplicateExists = draftModules.some(
      (m) => m.name.toLowerCase() === moduleName.toLowerCase()
    );

    if (duplicateExists) {
      error(
        `Module "${moduleName}" already exists. Please choose a different name or add test cases to the existing module.`
      );
      return;
    }

    // Create temporary ID for new module
    const tempId = `temp-module-${Date.now()}`;
    const newModule: Module = {
      id: tempId,
      name: moduleName,
      description: data.description,
      icon: (data as CreateModuleDto).icon || '📦',
      tags: (data as CreateModuleDto).tags || [], // Add tags
      order: draftModules.length,
      testCases: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDraftModules([...draftModules, newModule]);
    setHasUnsavedChanges(true);
    setIsModuleFormOpen(false);
  };

  const handleUpdateModule = async (data: CreateModuleDto | UpdateModuleDto) => {
    if (!editingModule) return;

    const newName = (data as UpdateModuleDto).name || editingModule.name;

    // Check for duplicate module name when renaming (case-insensitive, excluding current module)
    const duplicateExists = draftModules.some(
      (m) =>
        m.id !== editingModule.id &&
        m.name.toLowerCase() === newName.toLowerCase()
    );

    if (duplicateExists) {
      error(
        `Module "${newName}" already exists. Please choose a different name.`
      );
      return;
    }

    setDraftModules((prevModules) =>
      prevModules.map((m) =>
        m.id === editingModule.id
          ? {
              ...m,
              name: newName,
              description: data.description !== undefined ? data.description : m.description,
              icon: (data as UpdateModuleDto).icon || m.icon,
              tags: (data as UpdateModuleDto).tags !== undefined ? (data as UpdateModuleDto).tags : m.tags, // Update tags
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
    setHasUnsavedChanges(true);
    setEditingModule(undefined);
    setIsModuleFormOpen(false);
  };

  const handleDeleteModule = (module: Module) => {
    if (!confirm(`Are you sure you want to delete "${module.name}"? This will also delete all test cases in this module.`)) {
      return;
    }

    // Remove from draft
    setDraftModules((prevModules) => prevModules.filter((m) => m.id !== module.id));

    // Track deletion if it's an existing module (not a temp one)
    if (!module.id.startsWith('temp-')) {
      setDeletedModuleIds((prev) => new Set([...prev, module.id]));
      // Also track all its test cases as deleted
      module.testCases.forEach((tc) => {
        if (!tc.id.startsWith('temp-')) {
          setDeletedTestCaseIds((prev) => new Set([...prev, tc.id]));
        }
      });
    }

    setHasUnsavedChanges(true);
  };

  const handleCreateTestCase = async (data: CreateTestCaseDto | UpdateTestCaseDto) => {
    // Create temporary ID for new test case
    const tempId = `temp-testcase-${Date.now()}`;
    const newTestCase: TestCase = {
      id: tempId,
      moduleId: activeModuleId,
      title: (data as CreateTestCaseDto).title,
      description: data.description,
      priority: (data as CreateTestCaseDto).priority,
      order: 0, // Will be set correctly below
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDraftModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === activeModuleId) {
          newTestCase.order = module.testCases.length;
          return {
            ...module,
            testCases: [...module.testCases, newTestCase],
          };
        }
        return module;
      })
    );

    setHasUnsavedChanges(true);
    setIsTestCaseFormOpen(false);
  };

  const handleUpdateTestCase = async (data: CreateTestCaseDto | UpdateTestCaseDto) => {
    if (!editingTestCase) return;

    setDraftModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        testCases: module.testCases.map((tc) =>
          tc.id === editingTestCase.id
            ? {
                ...tc,
                title: (data as UpdateTestCaseDto).title || tc.title,
                description: data.description !== undefined ? data.description : tc.description,
                priority: (data as UpdateTestCaseDto).priority || tc.priority,
                updatedAt: new Date().toISOString(),
              }
            : tc
        ),
      }))
    );

    setHasUnsavedChanges(true);
    setEditingTestCase(undefined);
    setIsTestCaseFormOpen(false);
  };

  const handleDeleteTestCase = (testCase: TestCase) => {
    if (!confirm(`Are you sure you want to delete "${testCase.title}"?`)) {
      return;
    }

    // Remove from draft
    setDraftModules((prevModules) =>
      prevModules.map((module) => ({
        ...module,
        testCases: module.testCases.filter((tc) => tc.id !== testCase.id),
      }))
    );

    // Track deletion if it's an existing test case (not a temp one)
    if (!testCase.id.startsWith('temp-')) {
      setDeletedTestCaseIds((prev) => new Set([...prev, testCase.id]));
    }

    setHasUnsavedChanges(true);
  };

  /**
   * Calculate differences between server state and draft state
   */
  const calculateChanges = () => {
    const changes = {
      newModules: [] as Module[],
      updatedModules: [] as Module[],
      deletedModuleIds: Array.from(deletedModuleIds),
      newTestCases: [] as { moduleId: string; testCase: TestCase }[],
      updatedTestCases: [] as TestCase[],
      deletedTestCaseIds: Array.from(deletedTestCaseIds),
      reorderedModules: [] as Module[],
      reorderedTestCases: [] as { moduleId: string; testCases: TestCase[] }[],
    };

    // Find new modules (temp IDs)
    changes.newModules = draftModules.filter((dm) => dm.id.startsWith('temp-'));

    // Find updated or reordered modules
    draftModules.forEach((dm) => {
      if (!dm.id.startsWith('temp-')) {
        const serverModule = modules.find((m) => m.id === dm.id);
        if (serverModule) {
          // Check if content was updated
          const tagsChanged = JSON.stringify(dm.tags || []) !== JSON.stringify(serverModule.tags || []);
          const contentChanged =
            dm.name !== serverModule.name ||
            dm.description !== serverModule.description ||
            dm.icon !== serverModule.icon ||
            tagsChanged;

          if (contentChanged) {
            changes.updatedModules.push(dm);
          }

          // Check if order changed
          if (dm.order !== serverModule.order) {
            changes.reorderedModules.push(dm);
          }

          // Check test cases
          dm.testCases.forEach((tc) => {
            if (tc.id.startsWith('temp-')) {
              // New test case
              changes.newTestCases.push({ moduleId: dm.id, testCase: tc });
            } else {
              const serverTestCase = serverModule.testCases.find((stc) => stc.id === tc.id);
              if (serverTestCase) {
                // Check if content was updated
                const tcContentChanged =
                  tc.title !== serverTestCase.title ||
                  tc.description !== serverTestCase.description ||
                  tc.priority !== serverTestCase.priority;

                if (tcContentChanged) {
                  changes.updatedTestCases.push(tc);
                }

                // Check if order changed
                if (tc.order !== serverTestCase.order) {
                  const existingReorder = changes.reorderedTestCases.find(
                    (r) => r.moduleId === dm.id
                  );
                  if (!existingReorder) {
                    changes.reorderedTestCases.push({
                      moduleId: dm.id,
                      testCases: dm.testCases,
                    });
                  }
                }
              }
            }
          });
        }
      }
    });

    return changes;
  };

  /**
   * Save all changes to the API in batch
   */
  const handleSaveChanges = async () => {
    setSaving(true);
    const changes = calculateChanges();
    const errors: string[] = [];

    try {
      // 1. Delete test cases first
      for (const tcId of changes.deletedTestCaseIds) {
        try {
          const response = await fetch(`/api/testcases/${tcId}`, { method: 'DELETE' });
          const result = await response.json();
          if (!result.success) {
            errors.push(`Failed to delete test case ${tcId}`);
          }
        } catch {
          errors.push(`Error deleting test case ${tcId}`);
        }
      }

      // 2. Delete modules
      for (const moduleId of changes.deletedModuleIds) {
        try {
          const response = await fetch(`/api/modules/${moduleId}`, { method: 'DELETE' });
          const result = await response.json();
          if (!result.success) {
            errors.push(`Failed to delete module ${moduleId}`);
          }
        } catch {
          errors.push(`Error deleting module ${moduleId}`);
        }
      }

      // 3. Create new modules
      const moduleIdMap = new Map<string, string>(); // Map temp IDs to real IDs
      for (const newModule of changes.newModules) {
        try {
          const response = await fetch('/api/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: newModule.name,
              description: newModule.description,
              icon: newModule.icon,
              order_index: newModule.order,
              tags: newModule.tags || [], // Include tags
            }),
          });
          const result = await response.json();
          if (result.success) {
            moduleIdMap.set(newModule.id, result.data.id);

            // Create test cases for this new module
            for (const tc of newModule.testCases) {
              try {
                await fetch(`/api/modules/${result.data.id}/testcases`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    title: tc.title,
                    description: tc.description,
                    priority: tc.priority,
                    order_index: tc.order,
                  }),
                });
              } catch {
                errors.push(`Error creating test case for new module`);
              }
            }
          } else {
            errors.push(`Failed to create module ${newModule.name}`);
          }
        } catch {
          errors.push(`Error creating module ${newModule.name}`);
        }
      }

      // 4. Update existing modules
      for (const updatedModule of changes.updatedModules) {
        try {
          const response = await fetch(`/api/modules/${updatedModule.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: updatedModule.name,
              description: updatedModule.description,
              icon: updatedModule.icon,
              tags: updatedModule.tags || [], // Include tags
            }),
          });
          const result = await response.json();
          if (!result.success) {
            errors.push(`Failed to update module ${updatedModule.name}`);
          }
        } catch {
          errors.push(`Error updating module ${updatedModule.name}`);
        }
      }

      // 5. Create new test cases for existing modules
      for (const { moduleId, testCase } of changes.newTestCases) {
        try {
          const response = await fetch(`/api/modules/${moduleId}/testcases`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: testCase.title,
              description: testCase.description,
              priority: testCase.priority,
              order_index: testCase.order,
            }),
          });
          const result = await response.json();
          if (!result.success) {
            errors.push(`Failed to create test case ${testCase.title}`);
          }
        } catch {
          errors.push(`Error creating test case ${testCase.title}`);
        }
      }

      // 6. Update test cases
      for (const testCase of changes.updatedTestCases) {
        try {
          const response = await fetch(`/api/testcases/${testCase.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: testCase.title,
              description: testCase.description,
              priority: testCase.priority,
            }),
          });
          const result = await response.json();
          if (!result.success) {
            errors.push(`Failed to update test case ${testCase.title}`);
          }
        } catch {
          errors.push(`Error updating test case ${testCase.title}`);
        }
      }

      // 7. Reorder modules if needed
      if (changes.reorderedModules.length > 0) {
        try {
          const response = await fetch('/api/modules/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              modules: draftModules
                .filter((m) => !m.id.startsWith('temp-'))
                .map((m) => ({ id: m.id, order_index: m.order })),
            }),
          });
          const result = await response.json();
          if (!result.success) {
            errors.push('Failed to reorder modules');
          }
        } catch {
          errors.push('Error reordering modules');
        }
      }

      // 8. Reorder test cases if needed
      for (const { moduleId, testCases } of changes.reorderedTestCases) {
        try {
          const response = await fetch('/api/testcases/reorder', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              testcases: testCases
                .filter((tc) => !tc.id.startsWith('temp-'))
                .map((tc) => ({ id: tc.id, order_index: tc.order })),
            }),
          });
          const result = await response.json();
          if (!result.success) {
            errors.push(`Failed to reorder test cases in module ${moduleId}`);
          }
        } catch {
          errors.push(`Error reordering test cases in module ${moduleId}`);
        }
      }

      // Check for errors
      if (errors.length > 0) {
        error(`Some changes failed to save: ${errors.join(', ')}`);
      } else {
        success('All changes saved successfully');
      }

      // Reload from server to sync state (bust cache to get fresh data)
      await fetchModules(true);
    } catch {
      console.error('Error saving changes:');
      error('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Discard all draft changes and reset to server state
   */
  const handleDiscardChanges = () => {
    if (!confirm('Are you sure you want to discard all unsaved changes?')) {
      return;
    }

    setDraftModules(modules);
    setHasUnsavedChanges(false);
    setDeletedModuleIds(new Set());
    setDeletedTestCaseIds(new Set());
    success('Changes discarded');
  };

  /**
   * Count total number of changes
   */
  const getChangeCount = () => {
    const changes = calculateChanges();

    // Count test cases in new modules
    const testCasesInNewModules = changes.newModules.reduce(
      (sum, module) => sum + module.testCases.length,
      0
    );

    return (
      changes.newModules.length +
      changes.updatedModules.length +
      changes.deletedModuleIds.length +
      changes.newTestCases.length +
      testCasesInNewModules + // Add test cases in new modules
      changes.updatedTestCases.length +
      changes.deletedTestCaseIds.length +
      (changes.reorderedModules.length > 0 ? 1 : 0) +
      changes.reorderedTestCases.length
    );
  };

  /**
   * Check if an item has been modified from server state
   */
  const isModified = (item: Module | TestCase): boolean => {
    if (item.id.startsWith('temp-')) return true;

    if ('testCases' in item) {
      // It's a module
      const serverModule = modules.find((m) => m.id === item.id);
      if (!serverModule) return false;
      const tagsChanged = JSON.stringify(item.tags || []) !== JSON.stringify(serverModule.tags || []);
      return (
        item.name !== serverModule.name ||
        item.description !== serverModule.description ||
        item.icon !== serverModule.icon ||
        item.order !== serverModule.order ||
        tagsChanged
      );
    } else {
      // It's a test case
      const serverTestCase = modules
        .flatMap((m) => m.testCases)
        .find((tc) => tc.id === item.id);
      if (!serverTestCase) return false;
      return (
        item.title !== serverTestCase.title ||
        item.description !== serverTestCase.description ||
        item.priority !== serverTestCase.priority ||
        item.order !== serverTestCase.order
      );
    }
  };

  /**
   * Filter modules based on search query
   */
  const filteredModules = draftModules.filter((module) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    // Search in module name and description
    const moduleMatch =
      module.name.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query);

    // Search in tags
    const tagMatch = module.tags?.some(tag => tag.toLowerCase().includes(query));

    // Search in test case titles and descriptions
    const testCaseMatch = module.testCases.some((tc) =>
      tc.title.toLowerCase().includes(query) ||
      tc.description?.toLowerCase().includes(query)
    );

    return moduleMatch || tagMatch || testCaseMatch;
  });

  /**
   * Toggle module expansion
   */
  const toggleModuleExpansion = (moduleId: string) => {
    setExpandedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  /**
   * Collapse all modules
   */
  const collapseAll = () => {
    setExpandedModules(new Set());
  };

  /**
   * Expand all modules
   */
  const expandAll = () => {
    setExpandedModules(new Set(draftModules.map((m) => m.id)));
  };

  /**
   * Export all modules to CSV
   */
  const handleExportCSV = () => {
    // CSV Headers
    const headers = [
      'Module Name',
      'Module Description',
      'Module Icon',
      'Module Tags',
      'Test Case Title',
      'Test Case Description',
      'Test Case Priority'
    ];

    // Build CSV rows
    const rows: string[][] = [];

    draftModules.forEach(module => {
      if (module.testCases.length === 0) {
        // Module with no test cases - single row
        rows.push([
          module.name,
          module.description || '',
          module.icon || '📦',
          module.tags?.join(',') || '',
          '',
          '',
          ''
        ]);
      } else {
        // Module with test cases - one row per test case
        module.testCases.forEach(tc => {
          rows.push([
            module.name,
            module.description || '',
            module.icon || '📦',
            module.tags?.join(',') || '',
            tc.title,
            tc.description || '',
            tc.priority
          ]);
        });
      }
    });

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const timestamp = new Date().toISOString().split('T')[0];
    link.setAttribute('href', url);
    link.setAttribute('download', `modules_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    success(`Exported ${draftModules.length} modules to CSV`);
  };

  /**
   * Parse CSV file
   */
  const parseCSV = (csvText: string): string[][] => {
    const rows: string[][] = [];
    let currentRow: string[] = [];
    let currentCell = '';
    let insideQuotes = false;

    for (let i = 0; i < csvText.length; i++) {
      const char = csvText[i];
      const nextChar = csvText[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          currentCell += '"';
          i++; // Skip next quote
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else if ((char === '\n' || char === '\r') && !insideQuotes) {
        if (currentCell || currentRow.length > 0) {
          currentRow.push(currentCell.trim());
          if (currentRow.some(cell => cell !== '')) {
            rows.push(currentRow);
          }
          currentRow = [];
          currentCell = '';
        }
        if (char === '\r' && nextChar === '\n') {
          i++; // Skip \n in \r\n
        }
      } else {
        currentCell += char;
      }
    }

    // Add last row if exists
    if (currentCell || currentRow.length > 0) {
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
    }

    return rows;
  };

  /**
   * Process CSV import and generate preview
   */
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target?.result as string;
        const rows = parseCSV(csvText);

        if (rows.length < 2) {
          error('CSV file is empty or invalid');
          return;
        }

        // Skip header row
        const dataRows = rows.slice(1);

        // Group rows by module name
        const moduleMap = new Map<string, { module: Partial<Module>; testCases: Partial<TestCase>[] }>();

        dataRows.forEach(row => {
          const [moduleName, moduleDesc, moduleIcon, moduleTags, tcTitle, tcDesc, tcPriority] = row;

          if (!moduleName) return; // Skip empty rows

          if (!moduleMap.has(moduleName.toLowerCase())) {
            moduleMap.set(moduleName.toLowerCase(), {
              module: {
                name: moduleName,
                description: moduleDesc || undefined,
                icon: moduleIcon || '📦',
                tags: moduleTags ? moduleTags.split(',').map(t => t.trim()).filter(Boolean) : [],
              },
              testCases: []
            });
          }

          // Add test case if title exists
          if (tcTitle) {
            const priority = (tcPriority as Priority) || 'Medium';
            if (!['High', 'Medium', 'Low'].includes(priority)) {
              error(`Invalid priority "${tcPriority}" for test case "${tcTitle}". Using Medium.`);
            }

            moduleMap.get(moduleName.toLowerCase())!.testCases.push({
              title: tcTitle,
              description: tcDesc || undefined,
              priority: ['High', 'Medium', 'Low'].includes(priority) ? priority : 'Medium',
            });
          }
        });

        // Generate preview
        const newModules: Module[] = [];
        const updatedModules: { old: Module; new: Module }[] = [];
        let testCasesAdded = 0;
        let testCasesReplaced = 0;

        moduleMap.forEach((data, moduleNameLower) => {
          const existingModule = draftModules.find(m => m.name.toLowerCase() === moduleNameLower);

          const testCases: TestCase[] = data.testCases.map((tc, index) => ({
            id: `temp-tc-${Date.now()}-${index}`,
            moduleId: existingModule?.id || `temp-module-${Date.now()}`,
            title: tc.title!,
            description: tc.description,
            priority: tc.priority!,
            order: index,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }));

          if (existingModule) {
            // Module exists - will replace test cases
            const updatedModule: Module = {
              ...existingModule,
              description: data.module.description !== undefined ? data.module.description : existingModule.description,
              icon: data.module.icon || existingModule.icon,
              tags: data.module.tags || existingModule.tags,
              testCases: testCases,
            };
            updatedModules.push({ old: existingModule, new: updatedModule });
            testCasesReplaced += existingModule.testCases.length;
            testCasesAdded += testCases.length;
          } else {
            // New module
            const newModule: Module = {
              id: `temp-module-${Date.now()}-${newModules.length}`,
              name: data.module.name!,
              description: data.module.description,
              icon: data.module.icon || '📦',
              tags: data.module.tags || [],
              order: draftModules.length + newModules.length,
              testCases: testCases,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            newModules.push(newModule);
            testCasesAdded += testCases.length;
          }
        });

        setImportPreview({
          newModules,
          updatedModules,
          stats: {
            modulesAdded: newModules.length,
            modulesUpdated: updatedModules.length,
            testCasesAdded,
            testCasesReplaced,
          }
        });
        setIsImportModalOpen(true);

      } catch {
        console.error('Error parsing CSV:');
        error('Failed to parse CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    event.target.value = '';
  };

  /**
   * Apply CSV import after user confirms
   */
  const handleConfirmImport = () => {
    if (!importPreview) return;

    // Update existing modules (replace test cases)
    const updatedDrafts = draftModules.map(module => {
      const update = importPreview.updatedModules.find(u => u.old.id === module.id);
      return update ? update.new : module;
    });

    // Add new modules
    const finalModules = [...updatedDrafts, ...importPreview.newModules];

    setDraftModules(finalModules);
    setHasUnsavedChanges(true);
    setIsImportModalOpen(false);
    setImportPreview(null);

    success(`Imported ${importPreview.stats.modulesAdded + importPreview.stats.modulesUpdated} modules with ${importPreview.stats.testCasesAdded} test cases`);
  };

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold text-white flex items-center gap-2">
              <span>📚</span>
              <span>Module Library</span>
            </h2>
            <p className="text-gray-400 mt-1">
              Manage your test modules and test cases
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Hidden file input */}
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="csv-file-input"
              aria-label="Upload CSV file"
            />

            <Button
              onClick={() => document.getElementById('csv-file-input')?.click()}
              variant="secondary"
              className="bg-dark-elevated border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
              aria-label="Import modules from CSV"
            >
              📤 Import CSV
            </Button>

            <Button
              onClick={handleExportCSV}
              variant="secondary"
              className="bg-dark-elevated border border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white"
              aria-label="Export modules to CSV"
            >
              📥 Export CSV
            </Button>

            <Button
              onClick={() => {
                setEditingModule(undefined);
                setIsModuleFormOpen(true);
              }}
            >
              + New Module
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search modules and test cases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-dark-elevated border border-dark-primary rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
              aria-label="Search modules and test cases"
            />
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Collapse/Expand Controls */}
        {draftModules.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={collapseAll}
                className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-dark-secondary border border-dark-primary rounded-md hover:bg-dark-elevated hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="Collapse all modules"
              >
                Collapse All
              </button>
              <button
                onClick={expandAll}
                className="px-3 py-1.5 text-sm font-medium text-gray-300 bg-dark-secondary border border-dark-primary rounded-md hover:bg-dark-elevated hover:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
                aria-label="Expand all modules"
              >
                Expand All
              </button>
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-400">
                {filteredModules.length} {filteredModules.length === 1 ? 'module' : 'modules'} found
              </p>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
          </div>
        ) : draftModules.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-white mb-2">No modules yet</h3>
            <p className="text-gray-400 mb-6">
              Get started by creating your first test module
            </p>
            <Button
              onClick={() => {
                setEditingModule(undefined);
                setIsModuleFormOpen(true);
              }}
            >
              + Create Module
            </Button>
          </div>
        ) : filteredModules.length === 0 ? (
          /* No Search Results */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No modules found</h3>
            <p className="text-gray-400 mb-6">
              Try adjusting your search query
            </p>
          </div>
        ) : (
          /* Modules List */
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredModules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {filteredModules.map((module) => (
                  <ModuleCard
                    key={module.id}
                    module={module}
                    onEdit={(m) => {
                      setEditingModule(m);
                      setIsModuleFormOpen(true);
                    }}
                    onDelete={handleDeleteModule}
                    onAddTestCase={(moduleId) => {
                      setActiveModuleId(moduleId);
                      setEditingTestCase(undefined);
                      setIsTestCaseFormOpen(true);
                    }}
                    onEditTestCase={(tc) => {
                      setEditingTestCase(tc);
                      setIsTestCaseFormOpen(true);
                    }}
                    onDeleteTestCase={handleDeleteTestCase}
                    isModified={isModified}
                    isExpanded={expandedModules.has(module.id)}
                    onToggleExpand={() => toggleModuleExpansion(module.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Stats */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-primary-500 mb-2">{draftModules.length}</div>
            <div className="text-gray-400 text-sm">Total Modules</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-primary-500 mb-2">
              {draftModules.reduce((sum, m) => sum + m.testCases.length, 0)}
            </div>
            <div className="text-gray-400 text-sm">Total Test Cases</div>
          </div>
          <div className="bg-dark-secondary border border-dark-primary rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {draftModules.filter((m) => m.testCases.some((tc) => tc.priority === 'High')).length}
            </div>
            <div className="text-gray-400 text-sm">High Priority Modules</div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ModuleForm
        isOpen={isModuleFormOpen}
        onClose={() => {
          setIsModuleFormOpen(false);
          setEditingModule(undefined);
        }}
        onSubmit={editingModule ? handleUpdateModule : handleCreateModule}
        module={editingModule}
      />

      <TestCaseForm
        isOpen={isTestCaseFormOpen}
        onClose={() => {
          setIsTestCaseFormOpen(false);
          setEditingTestCase(undefined);
        }}
        onSubmit={editingTestCase ? handleUpdateTestCase : handleCreateTestCase}
        testCase={editingTestCase}
      />

      {/* Floating Save/Discard Buttons */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 bg-dark-elevated border border-primary-500 rounded-lg shadow-xl p-4 z-50 animate-slide-up">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-300">
              {getChangeCount()} unsaved {getChangeCount() === 1 ? 'change' : 'changes'}
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleDiscardChanges}
              variant="secondary"
              className="text-sm px-4 py-2 bg-dark-secondary hover:bg-gray-700 text-gray-300"
              disabled={saving}
            >
              Discard
            </Button>
            <Button
              onClick={handleSaveChanges}
              className="text-sm px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              disabled={saving}
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2 inline-block"></div>
                  Saving...
                </>
              ) : (
                `Save ${getChangeCount()} ${getChangeCount() === 1 ? 'Change' : 'Changes'}`
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Import Preview Modal */}
      {isImportModalOpen && importPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-secondary border border-dark-primary rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-dark-primary">
              <h2 className="text-2xl font-bold text-white">Import Preview</h2>
              <p className="text-gray-400 mt-1">Review changes before importing</p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Stats Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-dark-elevated p-4 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-500">{importPreview.stats.modulesAdded}</div>
                  <div className="text-sm text-gray-400">New Modules</div>
                </div>
                <div className="bg-dark-elevated p-4 rounded-lg border border-blue-500/30">
                  <div className="text-2xl font-bold text-blue-500">{importPreview.stats.modulesUpdated}</div>
                  <div className="text-sm text-gray-400">Updated Modules</div>
                </div>
                <div className="bg-dark-elevated p-4 rounded-lg border border-green-500/30">
                  <div className="text-2xl font-bold text-green-500">{importPreview.stats.testCasesAdded}</div>
                  <div className="text-sm text-gray-400">Test Cases Added</div>
                </div>
                <div className="bg-dark-elevated p-4 rounded-lg border border-orange-500/30">
                  <div className="text-2xl font-bold text-orange-500">{importPreview.stats.testCasesReplaced}</div>
                  <div className="text-sm text-gray-400">Test Cases Replaced</div>
                </div>
              </div>

              {/* New Modules */}
              {importPreview.newModules.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-white mb-3">New Modules ({importPreview.newModules.length})</h3>
                  <div className="space-y-2">
                    {importPreview.newModules.map(module => (
                      <div key={module.id} className="bg-dark-elevated p-3 rounded border border-green-500/30">
                        <div className="font-medium text-white">{module.icon} {module.name}</div>
                        <div className="text-sm text-gray-400 mt-1">{module.testCases.length} test cases</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Updated Modules */}
              {importPreview.updatedModules.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Updated Modules ({importPreview.updatedModules.length})</h3>
                  <div className="space-y-2">
                    {importPreview.updatedModules.map(({ old, new: updated }) => (
                      <div key={old.id} className="bg-dark-elevated p-3 rounded border border-blue-500/30">
                        <div className="font-medium text-white">{updated.icon} {updated.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          {old.testCases.length} → {updated.testCases.length} test cases
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warning */}
              {importPreview.stats.testCasesReplaced > 0 && (
                <div className="mt-6 p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  <div className="text-orange-500 font-semibold mb-1">⚠️ Warning</div>
                  <div className="text-sm text-gray-300">
                    {importPreview.stats.testCasesReplaced} existing test cases will be replaced with data from the CSV file.
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-dark-primary flex justify-end gap-3">
              <Button
                onClick={() => {
                  setIsImportModalOpen(false);
                  setImportPreview(null);
                }}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button onClick={handleConfirmImport}>
                Confirm Import
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
