'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Project } from '@/types/project';
import { Module, Priority, TestCase } from '@/types/module';
import { ChecklistModuleWithResults } from '@/types/checklist';
import { Button } from '@/components/ui/Button';
import { TruncatedText } from '@/components/ui/TruncatedText';
import { ImageIndicator } from '@/components/ui/ImageIndicator';
import { AddModuleDialog } from '@/components/checklists/AddModuleDialog';
import { AddTestCaseDialog } from '@/components/checklists/AddTestCaseDialog';
import { ImportChecklistDialog } from '@/components/checklists/ImportChecklistDialog';
import { useCurrentTester } from '@/contexts/TesterContext';

type DraftModule = ChecklistModuleWithResults & {
  _isDraft?: boolean; // Marks module as not yet saved
  _isDeleted?: boolean; // Marks module for deletion
  _isCustom?: boolean; // Marks module as custom (not from library)
  _removedTestcaseIds?: Set<string>; // Track removed testcases
};

// Sortable Module Component
function SortableModule({
  module,
  isExpanded,
  isDraft,
  onToggleExpansion,
  onCopyModule,
  onRemoveModule,
  onOpenAddTestCaseDialog,
  onRemoveTestcase,
  children,
}: {
  module: DraftModule;
  isExpanded: boolean;
  isDraft: boolean;
  onToggleExpansion: (id: string) => void;
  onCopyModule: (module: DraftModule) => void;
  onRemoveModule: (id: string) => void;
  onOpenAddTestCaseDialog: (module: DraftModule) => void;
  onRemoveTestcase: (moduleId: string, testcaseId: string) => void;
  children?: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-dark-secondary border rounded-lg overflow-hidden ${
        isDraft ? 'border-yellow-500/50' : 'border-dark-border'
      }`}
    >
      {/* Module Header */}
      <div className="flex items-center justify-between p-4 bg-dark-elevated">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-2 text-gray-400 hover:text-gray-300 hover:bg-dark-border rounded transition-colors"
          title="Drag to reorder"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>

        <button
          onClick={() => onToggleExpansion(module.id)}
          className="flex-1 flex items-center gap-3 text-left"
        >
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <span>
                {module.moduleName}
                {module.instanceLabel && module.instanceLabel !== module.moduleName && (
                  <span className="ml-2 text-sm text-primary-500">
                    ({module.instanceLabel})
                  </span>
                )}
              </span>
              {isDraft && (
                <span className="px-2 py-0.5 text-xs bg-yellow-500/20 text-yellow-400 rounded">
                  Unsaved
                </span>
              )}
            </h3>
            {module.moduleDescription && (
              <p className="text-sm text-gray-400 mt-0.5">
                {module.moduleDescription}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {module.testResults?.length || 0} tests
          </span>
          <button
            onClick={() => onCopyModule(module)}
            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
            title="Copy module"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onRemoveModule(module.id)}
            className="p-2 text-red-400 hover:bg-red-500/10 rounded transition-colors"
            title="Remove module"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Test Cases List */}
      {isExpanded && (
        <div className="p-4 space-y-2">
          {/* Add Test Case Button */}
          <button
            onClick={() => onOpenAddTestCaseDialog(module)}
            className="w-full p-3 border-2 border-dashed border-primary-500/30 rounded-lg bg-primary-500/5 hover:bg-primary-500/10 hover:border-primary-500/50 transition-colors flex items-center justify-center gap-2 text-primary-400 text-sm font-semibold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Test Case
          </button>

          {/* Test Case List - Make sortable */}
          {module.testResults && module.testResults.length > 0 && (
            <SortableContext
              items={module.testResults.map(tr => tr.id)}
              strategy={verticalListSortingStrategy}
            >
              {module.testResults.map((testResult) => (
                <SortableTestCase
                  key={testResult.id}
                  testResult={testResult}
                  moduleId={module.id}
                  onRemoveTestcase={onRemoveTestcase}
                />
              ))}
            </SortableContext>
          )}
        </div>
      )}
    </div>
  );
}

// Sortable Test Case Component
function SortableTestCase({
  testResult,
  moduleId,
  onRemoveTestcase,
}: {
  testResult: any;
  moduleId: string;
  onRemoveTestcase: (moduleId: string, testcaseId: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: testResult.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-dark-elevated rounded hover:bg-dark-border transition-colors group"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-gray-400 transition-colors"
        title="Drag to reorder"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      <div className="flex-1 min-w-0">
        <TruncatedText
          text={testResult.testcaseTitle}
          className="text-sm text-white"
          as="div"
        />
        {testResult.testcaseDescription && (
          <TruncatedText
            text={testResult.testcaseDescription}
            className="text-xs text-gray-500 mt-0.5"
            as="div"
          />
        )}
      </div>
      {testResult.testcaseImageUrl && (
        <ImageIndicator
          imageUrl={testResult.testcaseImageUrl}
          alt={`${testResult.testcaseTitle} reference image`}
          size="xs"
        />
      )}
      <span
        className={`text-xs px-2 py-0.5 rounded ${
          testResult.testcasePriority === 'High'
            ? 'bg-red-500/20 text-red-400'
            : testResult.testcasePriority === 'Medium'
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-gray-500/20 text-gray-400'
        }`}
      >
        {testResult.testcasePriority}
      </span>
      <button
        onClick={() => onRemoveTestcase(moduleId, testResult.testcaseId)}
        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
        title="Remove test case"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { currentTester } = useCurrentTester();

  const [project, setProject] = useState<Project | null>(null);
  const [availableModules, setAvailableModules] = useState<Module[]>([]);

  // Original state from server (immutable reference)
  const [originalModules, setOriginalModules] = useState<ChecklistModuleWithResults[]>([]);

  // Draft state - all local edits happen here
  const [draftModules, setDraftModules] = useState<DraftModule[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedModuleToCopy, setSelectedModuleToCopy] = useState<DraftModule | null>(null);

  // Add testcase dialog state
  const [selectedModuleForTestCases, setSelectedModuleForTestCases] = useState<DraftModule | null>(null);
  const [isAddTestCaseDialogOpen, setIsAddTestCaseDialogOpen] = useState(false);

  // Import checklist dialog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(draftModules) !== JSON.stringify(originalModules);

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag-and-drop for modules and testcases
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    // Check if we're dragging modules or test results
    const activeModule = draftModules.find((m) => m.id === active.id);

    if (activeModule) {
      // Dragging modules
      const oldIndex = draftModules.findIndex((m) => m.id === active.id);
      const newIndex = draftModules.findIndex((m) => m.id === over.id);

      const reorderedModules = arrayMove(draftModules, oldIndex, newIndex).map((m, idx) => ({
        ...m,
        orderIndex: idx,
      }));

      setDraftModules(reorderedModules);
    } else {
      // Dragging testcases - find which module contains them
      setDraftModules((prevModules) =>
        prevModules.map((module) => {
          const testResult = module.testResults.find((tr) => tr.id === active.id);
          if (testResult) {
            const oldIndex = module.testResults.findIndex((tr) => tr.id === active.id);
            const newIndex = module.testResults.findIndex((tr) => tr.id === over.id);

            const reorderedTestResults = arrayMove(module.testResults, oldIndex, newIndex);

            return { ...module, testResults: reorderedTestResults };
          }
          return module;
        })
      );
    }
  };

  // Load data (parallel fetching for better performance)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel (with cache-busting for checklist)
        const [projectRes, modulesRes, checklistRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch('/api/modules'),
          fetch(`/api/checklists/${projectId}?_t=${Date.now()}`),
        ]);

        // Parse all responses
        const [projectResult, modulesResult, checklistResult] = await Promise.all([
          projectRes.ok ? projectRes.json() : null,
          modulesRes.ok ? modulesRes.json() : null,
          checklistRes.ok ? checklistRes.json() : null,
        ]);

        // Update project
        if (projectResult?.success) {
          setProject(projectResult.data);
        }

        // Auto-assign current tester if not already assigned
        if (currentTester && projectResult?.success) {
          const testersRes = await fetch(`/api/projects/${projectId}/testers`);
          const testersResult = await testersRes.json();

          if (testersResult?.success) {
            const isAssigned = testersResult.data?.some((t: { id: string }) => t.id === currentTester.id);

            if (!isAssigned) {
              console.log('[EditMode] Auto-assigning current tester:', currentTester.name);
              await fetch(`/api/projects/${projectId}/testers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ testerId: currentTester.id })
              });
            }
          }
        }

        // Update available modules
        if (modulesResult?.success) {
          const normalized = modulesResult.data.map((module: Record<string, unknown>) => ({
            ...module,
            testCases: module.testcases || module.testCases || [],
          }));
          setAvailableModules(normalized);
        }

        // Update checklist - DE-DUPLICATE testcases for Edit mode
        // Each testcase may have multiple entries (one per tester), but Edit mode
        // should show unique testcases only
        if (checklistResult?.success) {
          const modules = checklistResult.data.modules || [];

          // De-duplicate testcases within each module
          const deduplicatedModules = modules.map((module: ChecklistModuleWithResults) => {
            const seenTestcases = new Map<string, typeof module.testResults[0]>();

            // Keep only the first occurrence of each unique testcase
            // Use testcaseId if available, otherwise use testcaseTitle as key
            for (const tr of module.testResults || []) {
              const key = tr.testcaseId || tr.testcaseTitle;
              if (key && !seenTestcases.has(key)) {
                seenTestcases.set(key, tr);
              }
            }

            const uniqueTestResults = Array.from(seenTestcases.values());

            return {
              ...module,
              testResults: uniqueTestResults,
              totalTests: uniqueTestResults.length,
              pendingTests: uniqueTestResults.filter(tr => tr.status === 'Pending').length,
              passedTests: uniqueTestResults.filter(tr => tr.status === 'Pass').length,
              failedTests: uniqueTestResults.filter(tr => tr.status === 'Fail').length,
              skippedTests: uniqueTestResults.filter(tr => tr.status === 'Skipped').length,
            };
          });

          setOriginalModules(deduplicatedModules); // Store original
          setDraftModules(JSON.parse(JSON.stringify(deduplicatedModules))); // Clone for drafts
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, currentTester?.id]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Open dialog to add module
  const handleOpenAddDialog = (module: Module) => {
    setSelectedModule(module);
    setIsDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedModule(null);
  };

  // Add module to local draft (instant, no API call)
  const handleAddModule = async (data: {
    moduleId: string;
    instanceLabel?: string;
    priority?: Priority;
    tags?: string[];
  }) => {
    console.log('[ADD MODULE] handleAddModule called with data:', {
      moduleId: data.moduleId,
      instanceLabel: data.instanceLabel,
      selectedModuleToCopyExists: !!selectedModuleToCopy,
      selectedModuleToCopyName: selectedModuleToCopy?.moduleName,
      selectedModuleToCopyTestCount: selectedModuleToCopy?.testResults?.length || 0
    });

    // Check if this is a custom module creation (id === 'custom', NOT copy-custom-*)
    if (data.moduleId === 'custom' && !selectedModuleToCopy) {
      console.log('[ADD MODULE] Creating new custom module (moduleId is exactly "custom" and no copy source)');
      handleCreateCustomModule(data);
      setSelectedModuleToCopy(null);
      return;
    }

    // Check if we're copying a module (has custom testcases)
    if (selectedModuleToCopy) {
      // Determine if source module is custom (no library reference)
      const isSourceCustom = !selectedModuleToCopy.moduleId ||
                            selectedModuleToCopy.moduleId.startsWith('custom-') ||
                            selectedModuleToCopy._isCustom;

      console.log('[COPY MODULE] Source module:', {
        id: selectedModuleToCopy.id,
        name: selectedModuleToCopy.moduleName,
        isCustom: isSourceCustom,
        moduleId: selectedModuleToCopy.moduleId,
        testResultsCount: selectedModuleToCopy.testResults?.length || 0,
        testResults: selectedModuleToCopy.testResults?.map(tr => ({ id: tr.id, title: tr.testcaseTitle }))
      });

      const copiedModule: DraftModule = {
        ...JSON.parse(JSON.stringify(selectedModuleToCopy)), // Deep clone
        id: `draft-copy-${Date.now()}`,
        instanceLabel: data.instanceLabel,
        instanceNumber: draftModules.filter(m => !m._isDeleted).length + 1,
        orderIndex: draftModules.filter(m => !m._isDeleted).length,
        _isDraft: true,
        _isCustom: isSourceCustom, // Preserve custom flag for save logic
        testResults: selectedModuleToCopy.testResults?.map((tr, index) => ({
          ...tr,
          id: `draft-copy-${Date.now()}-${index}`,
          projectChecklistModuleId: `draft-copy-${Date.now()}`,
        })) || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      console.log('[COPY MODULE] Copied module:', {
        id: copiedModule.id,
        name: copiedModule.moduleName,
        isCustom: copiedModule._isCustom,
        testResultsCount: copiedModule.testResults?.length || 0,
        testResults: copiedModule.testResults?.map(tr => ({ id: tr.id, title: tr.testcaseTitle }))
      });

      setDraftModules((prev) => [...prev, copiedModule]);
      setSelectedModuleToCopy(null);
      return;
    }

    // Find the module from available modules (normal add)
    const moduleToAdd = availableModules.find((m) => m.id === data.moduleId);
    if (!moduleToAdd) {
      throw new Error('Module not found');
    }

    // Add to local draft state instantly
    const testCaseCount = moduleToAdd.testCases?.length || 0;
    const draftModule: DraftModule = {
      id: `draft-${Date.now()}`, // Temporary draft ID
      projectId,
      moduleId: data.moduleId,
      moduleName: moduleToAdd.name,
      moduleDescription: moduleToAdd.description,
      instanceLabel: data.instanceLabel,
      instanceNumber: draftModules.filter(m => !m._isDeleted).length + 1,
      orderIndex: draftModules.filter(m => !m._isDeleted).length,
      _isDraft: true, // Mark as unsaved
      testResults: moduleToAdd.testCases?.map((tc, index) => ({
        id: `draft-${Date.now()}-${index}`,
        projectChecklistModuleId: `draft-${Date.now()}`,
        testcaseId: tc.id,
        testcaseTitle: tc.title,
        testcaseDescription: tc.description,
        testcasePriority: tc.priority,
        status: 'Pending' as const,
        notes: undefined,
        testedBy: undefined,
        testedAt: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })) || [],
      totalTests: testCaseCount,
      pendingTests: testCaseCount,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDraftModules((prev) => [...prev, draftModule]);
  };

  // Remove module from local draft (instant, no API call)
  const handleRemoveModule = (draftModuleId: string) => {
    if (!confirm('Remove this module? (Changes will be applied when you click Save)')) {
      return;
    }

    setDraftModules((prev) => {
      const targetModule = prev.find((m) => m.id === draftModuleId);

      // If it's a draft (not yet saved), just remove it
      if (targetModule?._isDraft) {
        return prev.filter((m) => m.id !== draftModuleId);
      }

      // If it exists on server, mark for deletion
      return prev.map((m) =>
        m.id === draftModuleId ? { ...m, _isDeleted: true } : m
      );
    });
  };

  // Remove testcase from module (local only)
  const handleRemoveTestcase = (moduleId: string, testcaseId: string) => {
    setDraftModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;

        // Initialize removed testcases set if needed
        const removedIds = m._removedTestcaseIds || new Set<string>();
        removedIds.add(testcaseId);

        return {
          ...m,
          _removedTestcaseIds: removedIds,
          testResults: m.testResults?.filter((tr) => tr.testcaseId !== testcaseId) || [],
        };
      })
    );
  };

  // Copy module from checklist (with current customizations)
  const handleCopyModule = (sourceModule: DraftModule) => {
    console.log('[COPY CLICK] Copy button clicked on module:', {
      id: sourceModule.id,
      name: sourceModule.moduleName,
      isCustom: sourceModule._isCustom,
      moduleId: sourceModule.moduleId,
      testResultsCount: sourceModule.testResults?.length || 0
    });

    // Store the source module to copy
    setSelectedModuleToCopy(sourceModule);

    // Check if this is a custom module
    if (sourceModule._isCustom || !sourceModule.moduleId || sourceModule.moduleId.startsWith('custom-')) {
      console.log('[COPY CLICK] This is a custom module, creating synthetic module object');
      // For custom modules, create a synthetic module object to open the dialog
      // Use a special prefix to avoid conflicting with 'custom' (which means "create new")
      const syntheticModule = {
        id: `copy-custom-${sourceModule.id}`, // Use unique ID that won't conflict with "custom"
        name: sourceModule.moduleName,
        description: sourceModule.moduleDescription || '',
        testCases: sourceModule.testResults?.map((tr) => ({
          id: tr.testcaseId || tr.id,
          moduleId: sourceModule.moduleId || `copy-custom-${sourceModule.id}`,
          title: tr.testcaseTitle,
          description: tr.testcaseDescription,
          priority: tr.testcasePriority,
          order: 0,
          createdAt: tr.createdAt,
          updatedAt: tr.updatedAt,
        })) || [],
        tags: [],
        order: sourceModule.orderIndex || 0,
        createdAt: sourceModule.createdAt,
        updatedAt: sourceModule.updatedAt,
      };
      console.log('[COPY CLICK] Synthetic module:', { id: syntheticModule.id, testCasesCount: syntheticModule.testCases.length });
      setSelectedModule(syntheticModule);
      setIsDialogOpen(true);
    } else {
      console.log('[COPY CLICK] This is a library module, finding original');
      // For library modules, find the original module from library to open dialog
      const originalModule = availableModules.find((m) => m.id === sourceModule.moduleId);
      if (originalModule) {
        setSelectedModule(originalModule);
        setIsDialogOpen(true);
      }
    }
  };

  // Create custom empty module
  const handleCreateCustomModule = (data: {
    moduleId: string;
    instanceLabel?: string;
    priority?: Priority;
    tags?: string[];
  }) => {
    const customModule: DraftModule = {
      id: `draft-custom-${Date.now()}`,
      projectId,
      moduleId: `custom-${Date.now()}`, // Custom module ID
      moduleName: data.instanceLabel || 'Custom Module',
      moduleDescription: 'Custom module created for this project',
      instanceLabel: data.instanceLabel,
      instanceNumber: draftModules.filter(m => !m._isDeleted).length + 1,
      orderIndex: draftModules.filter(m => !m._isDeleted).length,
      _isDraft: true,
      _isCustom: true, // Mark as custom
      testResults: [], // Empty - user will add testcases manually
      totalTests: 0,
      pendingTests: 0,
      passedTests: 0,
      failedTests: 0,
      skippedTests: 0,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setDraftModules((prev) => [...prev, customModule]);
  };

  // Open add testcase dialog
  const handleOpenAddTestCaseDialog = (module: DraftModule) => {
    setSelectedModuleForTestCases(module);
    setIsAddTestCaseDialogOpen(true);
  };

  // Close add testcase dialog
  const handleCloseAddTestCaseDialog = () => {
    setSelectedModuleForTestCases(null);
    setIsAddTestCaseDialogOpen(false);
  };

  // Add testcases to module (local only)
  const handleAddTestCases = (moduleId: string, testCaseIds: string[]) => {
    setDraftModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;

        // Get testcase details from available modules
        const newTestResults = testCaseIds.map((testCaseId, index) => {
          // Find the testcase from available modules
          let testCase: TestCase | undefined;
          for (const availModule of availableModules) {
            testCase = availModule.testCases?.find((tc) => tc.id === testCaseId);
            if (testCase) break;
          }

          if (!testCase) {
            console.warn(`TestCase ${testCaseId} not found in available modules`);
            return null;
          }

          return {
            id: `draft-tc-${Date.now()}-${index}`,
            projectChecklistModuleId: moduleId,
            testcaseId: testCase.id,
            testcaseTitle: testCase.title,
            testcaseDescription: testCase.description,
            testcasePriority: testCase.priority,
            status: 'Pending' as const,
            notes: undefined,
            testedBy: undefined,
            testedAt: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }).filter(Boolean) as any[];

        // Remove from removed testcases set
        const removedIds = m._removedTestcaseIds || new Set<string>();
        testCaseIds.forEach((id) => removedIds.delete(id));

        return {
          ...m,
          _removedTestcaseIds: removedIds,
          testResults: [...(m.testResults || []), ...newTestResults],
        };
      })
    );
  };

  // Create custom testcase and add to module
  const handleCreateCustomTestCase = async (
    moduleId: string,
    data: { title: string; description?: string; priority: Priority; imageFile?: File }
  ) => {
    console.log('[ADD TESTCASE] Creating custom testcase:', { moduleId, title: data.title, priority: data.priority, hasImage: !!data.imageFile });

    let imageUrl: string | undefined = undefined;

    // Upload image if provided
    if (data.imageFile) {
      try {
        const formData = new FormData();
        formData.append('file', data.imageFile);

        // Upload to custom testcase images (no testcase ID yet)
        const uploadRes = await fetch('/api/custom-testcase-images', {
          method: 'POST',
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadResult = await uploadRes.json();
          imageUrl = uploadResult.imageUrl;
          console.log('[ADD TESTCASE] Image uploaded:', imageUrl);
        } else {
          console.error('[ADD TESTCASE] Image upload failed');
        }
      } catch (err) {
        console.error('[ADD TESTCASE] Image upload error:', err);
      }
    }

    setDraftModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;

        const customTestResult = {
          id: `draft-custom-tc-${Date.now()}`,
          projectChecklistModuleId: moduleId,
          testcaseId: `custom-tc-${Date.now()}`, // Temporary ID for custom testcase
          testcaseTitle: data.title,
          testcaseDescription: data.description,
          testcasePriority: data.priority,
          testcaseImageUrl: imageUrl,
          status: 'Pending' as const,
          notes: undefined,
          testedBy: undefined,
          testedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('[ADD TESTCASE] Added custom testcase to module:', { moduleId, testcaseId: customTestResult.id, title: customTestResult.testcaseTitle, imageUrl });
        return {
          ...m,
          testResults: [...(m.testResults || []), customTestResult],
        };
      })
    );
  };

  // Import checklist from another project
  interface ImportedModule {
    moduleId: string | null;
    moduleName: string;
    moduleDescription?: string;
    moduleThumbnailUrl?: string;
    instanceLabel: string;
    testCases: {
      testcaseId: string | null;
      title: string;
      description?: string;
      priority: 'High' | 'Medium' | 'Low';
    }[];
  }

  const handleImportChecklist = (sourceModules: ImportedModule[]) => {
    const newDraftModules: DraftModule[] = [];

    for (const srcModule of sourceModules) {
      // Generate unique instance label
      let instanceLabel = srcModule.instanceLabel || srcModule.moduleName;

      // Check for conflicts with existing draft modules
      const existingLabels = [
        ...draftModules.filter(m => !m._isDeleted).map(m => (m.instanceLabel || m.moduleName).toLowerCase()),
        ...newDraftModules.map(m => (m.instanceLabel || m.moduleName).toLowerCase())
      ];

      if (existingLabels.includes(instanceLabel.toLowerCase())) {
        instanceLabel = `${instanceLabel} (imported)`;
        // If still conflicts, add number: "(imported 2)", etc.
        let counter = 2;
        while (existingLabels.includes(instanceLabel.toLowerCase())) {
          instanceLabel = `${srcModule.instanceLabel || srcModule.moduleName} (imported ${counter})`;
          counter++;
        }
      }

      // Determine if source module is custom (no library reference)
      const isSourceCustom = !srcModule.moduleId || srcModule.moduleId.startsWith('custom-');

      // Create draft module
      const draftModule: DraftModule = {
        id: `draft-import-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        projectId,
        moduleId: srcModule.moduleId || `custom-${Date.now()}`,
        moduleName: srcModule.moduleName,
        moduleDescription: srcModule.moduleDescription,
        instanceLabel: instanceLabel,
        instanceNumber: draftModules.filter(m => !m._isDeleted).length + newDraftModules.length + 1,
        orderIndex: draftModules.filter(m => !m._isDeleted).length + newDraftModules.length,
        _isDraft: true,
        _isCustom: isSourceCustom,
        testResults: srcModule.testCases.map((tc, idx) => {
          // Check if testcaseId indicates a custom testcase (null, or starts with 'custom:')
          const isCustomTestcase = !tc.testcaseId || tc.testcaseId.startsWith('custom:');
          return {
            id: `draft-import-tc-${Date.now()}-${idx}`,
            projectChecklistModuleId: `draft-import-${Date.now()}`,
            testcaseId: isCustomTestcase ? `custom-tc-${Date.now()}-${idx}` : tc.testcaseId!,
            testcaseTitle: tc.title,
            testcaseDescription: tc.description,
            testcasePriority: tc.priority,
            status: 'Pending' as const,  // Fresh start
            notes: undefined,            // No notes copied
            testedBy: undefined,
            testedAt: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }),
        // Stats will be calculated
        totalTests: srcModule.testCases.length,
        pendingTests: srcModule.testCases.length,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      newDraftModules.push(draftModule);
    }

    setDraftModules([...draftModules, ...newDraftModules]);

    console.log(`[IMPORT] Imported ${newDraftModules.length} modules from another project`);
  };

  // Get available testcases for a module
  const getAvailableTestCasesForModule = (module: DraftModule): TestCase[] => {
    if (module._isCustom) {
      // For custom modules, show all testcases from library
      return availableModules.flatMap((m) => m.testCases || []);
    } else {
      // For regular modules, show only removed testcases
      const originalModule = availableModules.find((m) => m.id === module.moduleId);
      if (!originalModule) return [];

      const removedIds = module._removedTestcaseIds || new Set<string>();
      return originalModule.testCases?.filter((tc) => removedIds.has(tc.id)) || [];
    }
  };

  // Cancel all changes and revert to original
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      if (!confirm('Discard all unsaved changes?')) {
        return;
      }
    }

    // Revert to original server state
    setDraftModules(JSON.parse(JSON.stringify(originalModules)));
    router.push(`/projects/${projectId}`);
  };

  // Save all changes to server (HYBRID model - supports custom modules/testcases)
  const handleSave = async () => {
    setSaving(true);
    try {
      // Get all assigned testers for the project (needed for custom testcase creation)
      const testersRes = await fetch(`/api/projects/${projectId}/testers`);
      const testersResult = await testersRes.json();
      const testerIds = testersResult.success ? (testersResult.data || []).map((t: any) => t.id) : [];

      // Helper function to reorder testcases for a module
      const reorderModuleTestcases = async (draftModule: DraftModule, originalModule?: DraftModule) => {
        // Get unique testcase identifiers from draft (first occurrence)
        type TestcaseIdentifier = { testcaseId: string | null; testcaseTitle: string };
        const draftTestcaseOrder: TestcaseIdentifier[] = [];
        const seen = new Set<string>();

        draftModule.testResults.forEach((tr) => {
          // Create unique key: testcaseId (if exists) or testcaseTitle (for custom)
          const uniqueKey = tr.testcaseId || tr.testcaseTitle;
          if (uniqueKey && !seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            // Check if testcaseId is a real UUID (not a draft/temp ID)
            const isRealTestcaseId = tr.testcaseId &&
              !tr.testcaseId.startsWith('draft-') &&
              !tr.testcaseId.startsWith('custom-tc-');

            draftTestcaseOrder.push({
              testcaseId: isRealTestcaseId ? (tr.testcaseId ?? null) : null,
              testcaseTitle: tr.testcaseTitle
            });
          }
        });

        // If no original module (draft module just created), always reorder to set initial order
        if (!originalModule) {
          const reorderPayload = {
            testcases: draftTestcaseOrder.map((tc, displayOrder) => ({
              testcaseId: tc.testcaseId,
              testcaseTitle: tc.testcaseId ? undefined : tc.testcaseTitle, // Only send title for custom
              displayOrder
            }))
          };

          const reorderRes = await fetch(
            `/api/projects/${projectId}/checklist/modules/${draftModule.id}/testcases/reorder`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(reorderPayload),
            }
          );

          if (reorderRes.ok) {
            console.log(`[SAVE DEBUG] Set initial testcase order for new module "${draftModule.moduleName}"`);
            return true;
          } else {
            console.error(`Failed to set initial testcase order for "${draftModule.moduleName}"`);
            return false;
          }
        }

        // Compare with original module to detect changes
        const originalTestcaseOrder: TestcaseIdentifier[] = [];
        const originalSeen = new Set<string>();

        originalModule.testResults.forEach((tr) => {
          const uniqueKey = tr.testcaseId || tr.testcaseTitle;
          if (uniqueKey && !originalSeen.has(uniqueKey)) {
            originalSeen.add(uniqueKey);
            // Check if testcaseId is a real UUID (not a draft/temp ID)
            const isRealTestcaseId = tr.testcaseId &&
              !tr.testcaseId.startsWith('draft-') &&
              !tr.testcaseId.startsWith('custom-tc-');

            originalTestcaseOrder.push({
              testcaseId: isRealTestcaseId ? (tr.testcaseId ?? null) : null,
              testcaseTitle: tr.testcaseTitle
            });
          }
        });

        // Check if order changed
        const orderChanged = draftTestcaseOrder.length !== originalTestcaseOrder.length ||
          draftTestcaseOrder.some((tc, idx) => {
            const orig = originalTestcaseOrder[idx];
            if (!orig) return true;
            return (tc.testcaseId || tc.testcaseTitle) !== (orig.testcaseId || orig.testcaseTitle);
          });

        if (!orderChanged) return false;

        console.log(`[SAVE DEBUG] Testcase order changed in module "${draftModule.moduleName}"`);

        // Build reorder payload
        const reorderPayload = {
          testcases: draftTestcaseOrder.map((tc, displayOrder) => ({
            testcaseId: tc.testcaseId,
            testcaseTitle: tc.testcaseId ? undefined : tc.testcaseTitle, // Only send title for custom
            displayOrder
          }))
        };

        const reorderRes = await fetch(
          `/api/projects/${projectId}/checklist/modules/${draftModule.id}/testcases/reorder`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reorderPayload),
          }
        );

        if (reorderRes.ok) {
          console.log('[SAVE DEBUG] Successfully reordered testcases');
          return true;
        } else {
          console.error(`Failed to reorder testcases in module "${draftModule.moduleName}"`);
          return false;
        }
      };

      // Find modules to add (all draft modules, both library and custom)
      const modulesToAdd = draftModules.filter((m) => m._isDraft);

      // Find modules to delete (marked as _isDeleted)
      const modulesToDelete = draftModules.filter((m) => m._isDeleted && !m._isDraft);

      // Find custom testcases added to EXISTING modules
      const modulesWithNewCustomTestcases: Array<{ module: DraftModule; newTestcases: any[] }> = [];
      draftModules.forEach((draftModule) => {
        if (draftModule._isDraft || draftModule._isDeleted) return; // Skip new/deleted modules (handled separately)

        // Find the original version of this module
        const originalModule = originalModules.find((m) => m.id === draftModule.id);
        if (!originalModule) return;

        // Find custom testcases (those with IDs starting with 'custom-tc-' or 'draft-custom-tc-')
        const draftCustomTestcases = draftModule.testResults?.filter(
          (tr) => tr.testcaseId?.startsWith('custom-tc-') || tr.testcaseId?.startsWith('draft-custom-tc-')
        ) || [];

        const originalCustomTestcases = originalModule.testResults?.filter(
          (tr) => tr.testcaseId?.startsWith('custom-tc-') || tr.testcaseId?.startsWith('draft-custom-tc-')
        ) || [];

        // Find new custom testcases (those not in original)
        const newCustomTestcases = draftCustomTestcases.filter(
          (draftTC) => !originalCustomTestcases.some((origTC) => origTC.id === draftTC.id)
        );

        if (newCustomTestcases.length > 0) {
          modulesWithNewCustomTestcases.push({
            module: draftModule,
            newTestcases: newCustomTestcases
          });
        }
      });

      console.log(`[SAVE DEBUG] Saving changes: ${modulesToAdd.length} to add (${modulesToAdd.filter(m => m._isCustom).length} custom), ${modulesToDelete.length} to delete, ${modulesWithNewCustomTestcases.length} module(s) with new custom testcases`);
      console.log('[SAVE DEBUG] Modules with new custom testcases:', modulesWithNewCustomTestcases.map(m => ({
        moduleId: m.module.id,
        moduleName: m.module.moduleName,
        newTestcasesCount: m.newTestcases.length,
        testcases: m.newTestcases.map(tc => tc.testcaseTitle)
      })));

      // Delete modules
      for (const mod of modulesToDelete) {
        const response = await fetch(`/api/checklists/modules/${mod.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete module: ${mod.moduleName}`);
        }
      }

      // Add new modules (both library and custom)
      let customTestcasesSaved = 0;
      const createdModules: Array<{ id: string; draftIndex: number }> = [];

      for (const mod of modulesToAdd) {
        // Find this module's position in the draft list
        const draftIndex = draftModules.findIndex(dm => dm === mod);
        if (mod._isCustom) {
          // CUSTOM MODULE: Create with no library reference
          const response = await fetch('/api/checklists/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              isCustom: true,
              moduleName: mod.moduleName,
              moduleDescription: mod.moduleDescription,
              instanceLabel: mod.instanceLabel,
            }),
          });

          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed to add custom module: ${mod.moduleName}`);
          }

          // Get the created module's real ID from response
          const result = await response.json();
          const newModuleId = result.data?.id;

          if (!newModuleId) {
            throw new Error(`Failed to get module ID for: ${mod.moduleName}`);
          }

          // Track created module for reordering later
          createdModules.push({ id: newModuleId, draftIndex });

          // Add ALL testcases to the custom module
          // Custom modules don't have library testcases, so all testResults are custom
          const customTestcases = mod.testResults || [];
          console.log(`[SAVE DEBUG] Saving ${customTestcases.length} testcases for custom module "${mod.moduleName}"`);

          for (const testcase of customTestcases) {
            const tcResponse = await fetch(`/api/checklists/modules/${newModuleId}/testcases`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                testerIds,
                testcaseTitle: testcase.testcaseTitle,
                testcaseDescription: testcase.testcaseDescription,
                testcasePriority: testcase.testcasePriority,
                testcaseImageUrl: testcase.testcaseImageUrl,
              }),
            });

            if (!tcResponse.ok) {
              const errorResult = await tcResponse.json();
              console.error(`Failed to add custom testcase "${testcase.testcaseTitle}":`, errorResult);
              // Continue with other testcases even if one fails
            } else {
              customTestcasesSaved++;
              console.log(`[SAVE DEBUG] Saved testcase: "${testcase.testcaseTitle}"`);
            }
          }

          // Set initial testcase order for the newly added custom module
          const tempModule = { ...mod, id: newModuleId };
          await reorderModuleTestcases(tempModule as DraftModule, undefined);
        } else {
          // LIBRARY MODULE: Create with library reference (HYBRID model copies data automatically)
          const response = await fetch('/api/checklists/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              moduleId: mod.moduleId,
              instanceLabel: mod.instanceLabel,
            }),
          });

          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed to add module: ${mod.moduleName}`);
          }

          // Get the created module's real ID from response
          const result = await response.json();
          const newModuleId = result.data?.id;

          if (newModuleId) {
            // Track created module for reordering later
            createdModules.push({ id: newModuleId, draftIndex });
            // Save custom testcases added to this library module during draft mode
            const customTestcases = (mod.testResults || []).filter(
              (tr) => tr.testcaseId?.startsWith('custom-tc-') || tr.testcaseId?.startsWith('draft-custom-tc-')
            );

            if (customTestcases.length > 0) {
              console.log(`[SAVE DEBUG] Saving ${customTestcases.length} custom testcases for library module "${mod.moduleName}"`);

              for (const testcase of customTestcases) {
                const tcResponse = await fetch(`/api/checklists/modules/${newModuleId}/testcases`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    testerIds,
                    testcaseTitle: testcase.testcaseTitle,
                    testcaseDescription: testcase.testcaseDescription,
                    testcasePriority: testcase.testcasePriority,
                    testcaseImageUrl: testcase.testcaseImageUrl,
                  }),
                });

                if (!tcResponse.ok) {
                  const errorResult = await tcResponse.json();
                  console.error(`Failed to add custom testcase "${testcase.testcaseTitle}":`, errorResult);
                  // Continue with other testcases even if one fails
                } else {
                  customTestcasesSaved++;
                  console.log(`[SAVE DEBUG] Saved custom testcase: "${testcase.testcaseTitle}"`);
                }
              }
            }

            // Set initial testcase order for the newly added library module
            const tempModule = { ...mod, id: newModuleId };
            await reorderModuleTestcases(tempModule as DraftModule, undefined);
          }
        }
      }

      // Reorder newly created modules if needed
      if (createdModules.length > 0) {
        // Build the complete module order including both existing and new modules
        const allModuleIds: Array<{ id: string; orderIndex: number }> = [];

        draftModules.forEach((dm, idx) => {
          if (dm._isDeleted) return; // Skip deleted

          if (dm._isDraft) {
            // Find the created module for this draft
            const created = createdModules.find(cm => cm.draftIndex === idx);
            if (created) {
              allModuleIds.push({ id: created.id, orderIndex: idx });
            }
          } else {
            // Existing module
            allModuleIds.push({ id: dm.id, orderIndex: idx });
          }
        });

        if (allModuleIds.length > 0) {
          console.log('[SAVE DEBUG] Setting initial module order for', createdModules.length, 'new modules');
          const reorderRes = await fetch(`/api/projects/${projectId}/checklist/reorder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modules: allModuleIds }),
          });

          if (!reorderRes.ok) {
            console.error('Failed to set initial module order');
          } else {
            console.log('[SAVE DEBUG] Successfully set initial module order');
          }
        }
      }

      // Save custom testcases added to existing modules
      const modulesNeedingReorder: DraftModule[] = [];
      for (const { module, newTestcases } of modulesWithNewCustomTestcases) {
        let savedCount = 0;
        for (const testcase of newTestcases) {
          try {
            const payload = {
              testerIds,
              testcaseTitle: testcase.testcaseTitle,
              testcaseDescription: testcase.testcaseDescription,
              testcasePriority: testcase.testcasePriority,
              testcaseImageUrl: testcase.testcaseImageUrl,
            };
            console.log('[SAVE DEBUG] Sending custom testcase to API:', payload);

            const tcResponse = await fetch(`/api/checklists/modules/${module.id}/testcases`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            });

            if (!tcResponse.ok) {
              const errorResult = await tcResponse.json();
              console.error(`Failed to add custom testcase "${testcase.testcaseTitle}":`, errorResult);
              // Continue with other testcases even if one fails
            } else {
              customTestcasesSaved++;
              savedCount++;
            }
          } catch (err) {
            console.error(`Error adding custom testcase "${testcase.testcaseTitle}":`, err);
            // Continue with other testcases even if one fails
          }
        }

        // If we saved any custom testcases, reorder this module to place them correctly
        if (savedCount > 0) {
          modulesNeedingReorder.push(module);
        }
      }

      // Reorder modules that had custom testcases added
      for (const mod of modulesNeedingReorder) {
        const originalModule = originalModules.find(om => om.id === mod.id);
        await reorderModuleTestcases(mod, originalModule);
      }

      // Reorder modules if needed (compare orderIndex changes)
      let modulesReordered = 0;
      const modulesNeedReordering = draftModules.some((dm, idx) => {
        const original = originalModules.find(om => om.id === dm.id);
        return original && original.orderIndex !== idx;
      });

      if (modulesNeedReordering) {
        console.log('[SAVE DEBUG] Module order changed, saving reorder...');
        const reorderPayload = {
          modules: draftModules
            .filter(m => !m._isDraft && !m._isDeleted) // Only existing modules
            .map((m, idx) => ({ id: m.id, orderIndex: idx }))
        };

        const reorderRes = await fetch(`/api/projects/${projectId}/checklist/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reorderPayload),
        });

        if (!reorderRes.ok) {
          console.error('Failed to reorder modules');
        } else {
          modulesReordered = 1;
          console.log('[SAVE DEBUG] Successfully reordered modules');
        }
      }

      // Reorder testcases if needed (within each module)
      let testcasesReordered = 0;
      for (const draftModule of draftModules) {
        if (draftModule._isDeleted) continue; // Skip deleted modules

        // For draft modules (newly added), reorder will happen after creation
        if (draftModule._isDraft) continue;

        const originalModule = originalModules.find(om => om.id === draftModule.id);
        const reordered = await reorderModuleTestcases(draftModule, originalModule);
        if (reordered) testcasesReordered++;
      }

      // Refresh checklist from server to get real IDs and data
      const checklistRes = await fetch(`/api/checklists/${projectId}?_t=${Date.now()}`, {
        cache: 'no-store',
      });

      if (checklistRes.ok) {
        const checklistResult = await checklistRes.json();
        if (checklistResult.success) {
          const modules = checklistResult.data.modules || [];
          setOriginalModules(modules);
          setDraftModules(JSON.parse(JSON.stringify(modules)));
        }
      }

      // Show success message
      const totalSaved = modulesToAdd.length + modulesToDelete.length + customTestcasesSaved + modulesReordered + testcasesReordered;
      const customModuleCount = modulesToAdd.filter(m => m._isCustom).length;

      if (totalSaved === 0) {
        alert('ℹ️ No changes to save.');
        setSaving(false);
        return;
      }

      let message = `✅ Saved ${totalSaved} change(s) successfully!`;
      if (customModuleCount > 0) {
        message += `\n✓ ${customModuleCount} custom module(s) saved`;
      }
      if (customTestcasesSaved > 0) {
        message += `\n✓ ${customTestcasesSaved} custom testcase(s) saved`;
      }
      if (modulesReordered > 0) {
        message += `\n✓ Modules reordered`;
      }
      if (testcasesReordered > 0) {
        message += `\n✓ ${testcasesReordered} module(s) with reordered testcases`;
      }
      alert(message);

      // Small delay before navigation to ensure state is updated
      setTimeout(() => {
        router.push(`/projects/${projectId}`);
      }, 100);
    } catch (err) {
      console.error('Error saving changes:', err);
      alert(`❌ Failed to save changes:\n${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

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

  // Filter available modules
  const filteredModules = availableModules.filter((module) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      module.name.toLowerCase().includes(query) ||
      module.description?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading editor...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Project not found</p>
          <Button onClick={() => router.push('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-200">
      {/* Header */}
      <header className="bg-dark-secondary border-b border-dark-primary">
        <div className="max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push(`/projects/${projectId}`)}
                className="text-primary-500 hover:text-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded p-2"
                aria-label="Back to overview"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">{project.name}</h1>
                <p className="text-sm text-gray-400">Checklist Editor</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {hasUnsavedChanges && (
                <span className="text-sm text-yellow-400 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Unsaved changes
                </span>
              )}
              <Button
                onClick={() => setIsImportDialogOpen(true)}
                disabled={saving}
                variant="secondary"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import from Project
              </Button>
              <Button
                onClick={handleCancel}
                disabled={saving}
                variant="secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !hasUnsavedChanges}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Split View */}
      <div className="flex" style={{ height: 'calc(100vh - 89px)' }}>
        {/* Left Sidebar - Module Library */}
        <div className="w-[420px] flex-shrink-0 overflow-hidden border-r border-dark-border bg-dark-secondary">
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-dark-border">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-white">Module Library</h2>
                <button
                  onClick={() => {
                    setSelectedModule({
                      id: 'custom',
                      name: '',
                      description: '',
                      testCases: [],
                      tags: [],
                      order: 0,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
                    });
                    setIsDialogOpen(true);
                  }}
                  className="px-3 py-1.5 text-sm bg-green-500/20 text-green-400 hover:bg-green-500/30 rounded transition-colors"
                  title="Create custom module"
                >
                  + New
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-dark-elevated border border-dark-border rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 transition-colors"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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

            {/* Module List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredModules.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500">No modules found</p>
                  </div>
                ) : (
                  filteredModules.map((module) => {
                    return (
                      <div
                        key={module.id}
                        className="p-3 rounded-lg border transition-colors bg-dark-bg border-dark-border hover:border-primary-500"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <TruncatedText
                              text={module.name}
                              className="font-semibold text-white text-sm"
                              as="div"
                            />
                            {module.description && (
                              <TruncatedText
                                text={module.description}
                                maxLines={2}
                                className="text-xs text-gray-400 mt-1"
                                as="p"
                              />
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                              <span>{module.testCases?.length || 0} tests</span>
                              {module.tags && module.tags.length > 0 && (
                                <span className="px-2 py-0.5 bg-primary-500/20 text-primary-400 rounded">
                                  {module.tags[0]}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleOpenAddDialog(module)}
                            className="flex-shrink-0 p-2 rounded transition-colors text-primary-500 hover:bg-primary-500/10 focus:outline-none focus:ring-2 focus:ring-primary-500"
                            title="Add to checklist"
                            aria-label="Add module to checklist"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Checklist Editor */}
        <div className="flex-1 overflow-y-auto bg-dark-bg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Checklist Modules ({draftModules.filter(m => !m._isDeleted).length})
              </h2>
            </div>

            {draftModules.filter(m => !m._isDeleted).length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  No modules added yet
                </h3>
                <p className="text-gray-400 mb-6">
                  Start building your checklist by adding modules from the library
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={draftModules.filter(m => !m._isDeleted).map(m => m.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {draftModules
                      .filter((m) => !m._isDeleted)
                      .map((module) => {
                        const isExpanded = expandedModules.has(module.id);
                        const isDraft = module._isDraft;

                        return (
                          <SortableModule
                            key={module.id}
                            module={module}
                            isExpanded={isExpanded}
                            isDraft={!!isDraft}
                            onToggleExpansion={toggleModuleExpansion}
                            onCopyModule={handleCopyModule}
                            onRemoveModule={handleRemoveModule}
                            onOpenAddTestCaseDialog={handleOpenAddTestCaseDialog}
                            onRemoveTestcase={handleRemoveTestcase}
                          />
                        );
                      })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>
      </div>

      {/* Add Module Dialog */}
      {selectedModule && (
        <AddModuleDialog
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          module={selectedModule}
          projectId={projectId}
          existingInstanceLabels={draftModules
            .filter((m) => !m._isDeleted)
            .map((cm) => cm.instanceLabel || cm.moduleName)
            .filter(Boolean)}
          onSubmit={handleAddModule}
        />
      )}

      {/* Add Test Case Dialog */}
      {selectedModuleForTestCases && (
        <AddTestCaseDialog
          isOpen={isAddTestCaseDialogOpen}
          onClose={handleCloseAddTestCaseDialog}
          moduleId={selectedModuleForTestCases.id}
          moduleName={selectedModuleForTestCases.instanceLabel || selectedModuleForTestCases.moduleName}
          isCustomModule={!!selectedModuleForTestCases._isCustom}
          availableTestCases={getAvailableTestCasesForModule(selectedModuleForTestCases)}
          onAddTestCases={(testCaseIds) => {
            handleAddTestCases(selectedModuleForTestCases.id, testCaseIds);
            handleCloseAddTestCaseDialog();
          }}
          onCreateCustomTestCase={(data) => {
            handleCreateCustomTestCase(selectedModuleForTestCases.id, data);
            handleCloseAddTestCaseDialog();
          }}
        />
      )}

      {/* Import Checklist Dialog */}
      <ImportChecklistDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImport={handleImportChecklist}
        currentProjectId={projectId}
        existingModuleLabels={draftModules
          .filter((m) => !m._isDeleted)
          .map((m) => m.instanceLabel || m.moduleName)}
      />
    </div>
  );
}
