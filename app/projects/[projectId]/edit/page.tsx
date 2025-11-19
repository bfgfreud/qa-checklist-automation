'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Project } from '@/types/project';
import { Module, Priority, TestCase } from '@/types/module';
import { ChecklistModuleWithResults } from '@/types/checklist';
import { Button } from '@/components/ui/Button';
import { AddModuleDialog } from '@/components/checklists/AddModuleDialog';
import { AddTestCaseDialog } from '@/components/checklists/AddTestCaseDialog';

type DraftModule = ChecklistModuleWithResults & {
  _isDraft?: boolean; // Marks module as not yet saved
  _isDeleted?: boolean; // Marks module for deletion
  _isCustom?: boolean; // Marks module as custom (not from library)
  _removedTestcaseIds?: Set<string>; // Track removed testcases
};

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

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

  // Track if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(draftModules) !== JSON.stringify(originalModules);

  // Load data (parallel fetching for better performance)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel
        const [projectRes, modulesRes, checklistRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch('/api/modules'),
          fetch(`/api/checklists/${projectId}`),
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

        // Update available modules
        if (modulesResult?.success) {
          const normalized = modulesResult.data.map((module: Record<string, unknown>) => ({
            ...module,
            testCases: module.testcases || module.testCases || [],
          }));
          setAvailableModules(normalized);
        }

        // Update checklist
        if (checklistResult?.success) {
          const modules = checklistResult.data.modules || [];
          setOriginalModules(modules); // Store original
          setDraftModules(JSON.parse(JSON.stringify(modules))); // Clone for drafts
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

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
      const module = prev.find((m) => m.id === draftModuleId);

      // If it's a draft (not yet saved), just remove it
      if (module?._isDraft) {
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
          for (const module of availableModules) {
            testCase = module.testCases?.find((tc) => tc.id === testCaseId);
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
  const handleCreateCustomTestCase = (
    moduleId: string,
    data: { title: string; description?: string; priority: Priority }
  ) => {
    console.log('[ADD TESTCASE] Creating custom testcase:', { moduleId, title: data.title, priority: data.priority });
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
          status: 'Pending' as const,
          notes: undefined,
          testedBy: undefined,
          testedAt: undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        console.log('[ADD TESTCASE] Added custom testcase to module:', { moduleId, testcaseId: customTestResult.id, title: customTestResult.testcaseTitle });
        return {
          ...m,
          testResults: [...(m.testResults || []), customTestResult],
        };
      })
    );
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
      for (const module of modulesToDelete) {
        const response = await fetch(`/api/checklists/modules/${module.id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          throw new Error(`Failed to delete module: ${module.moduleName}`);
        }
      }

      // Add new modules (both library and custom)
      for (const module of modulesToAdd) {
        if (module._isCustom) {
          // CUSTOM MODULE: Create with no library reference
          const response = await fetch('/api/checklists/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              isCustom: true,
              moduleName: module.moduleName,
              moduleDescription: module.moduleDescription,
              instanceLabel: module.instanceLabel,
            }),
          });

          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed to add custom module: ${module.moduleName}`);
          }

          // Get the created module's real ID from response
          const result = await response.json();
          const newModuleId = result.data?.id;

          if (!newModuleId) {
            throw new Error(`Failed to get module ID for: ${module.moduleName}`);
          }

          // Add ALL testcases to the custom module
          // Custom modules don't have library testcases, so all testResults are custom
          const customTestcases = module.testResults || [];
          console.log(`[SAVE DEBUG] Saving ${customTestcases.length} testcases for custom module "${module.moduleName}"`);

          for (const testcase of customTestcases) {
            const tcResponse = await fetch(`/api/checklists/modules/${newModuleId}/testcases`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                testerIds,
                testcaseTitle: testcase.testcaseTitle,
                testcaseDescription: testcase.testcaseDescription,
                testcasePriority: testcase.testcasePriority,
              }),
            });

            if (!tcResponse.ok) {
              const errorResult = await tcResponse.json();
              console.error(`Failed to add custom testcase "${testcase.testcaseTitle}":`, errorResult);
              // Continue with other testcases even if one fails
            } else {
              console.log(`[SAVE DEBUG] Saved testcase: "${testcase.testcaseTitle}"`);
            }
          }
        } else {
          // LIBRARY MODULE: Create with library reference (HYBRID model copies data automatically)
          const response = await fetch('/api/checklists/modules', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              moduleId: module.moduleId,
              instanceLabel: module.instanceLabel,
            }),
          });

          if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.error || `Failed to add module: ${module.moduleName}`);
          }
        }
      }

      // Save custom testcases added to existing modules
      let customTestcasesSaved = 0;
      for (const { module, newTestcases } of modulesWithNewCustomTestcases) {
        for (const testcase of newTestcases) {
          try {
            const payload = {
              testerIds,
              testcaseTitle: testcase.testcaseTitle,
              testcaseDescription: testcase.testcaseDescription,
              testcasePriority: testcase.testcasePriority,
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
            }
          } catch (err) {
            console.error(`Error adding custom testcase "${testcase.testcaseTitle}":`, err);
            // Continue with other testcases even if one fails
          }
        }
      }

      // Refresh checklist from server to get real IDs and data
      const checklistRes = await fetch(`/api/checklists/${projectId}`, {
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
      const totalSaved = modulesToAdd.length + modulesToDelete.length + customTestcasesSaved;
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
                          <div className="flex-1">
                            <h3 className="font-semibold text-white text-sm">
                              {module.name}
                            </h3>
                            {module.description && (
                              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                                {module.description}
                              </p>
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
              <div className="space-y-4">
                {draftModules
                  .filter((m) => !m._isDeleted)
                  .map((module) => {
                    const isExpanded = expandedModules.has(module.id);
                    const isDraft = module._isDraft;

                    return (
                      <div
                        key={module.id}
                        className={`bg-dark-secondary border rounded-lg overflow-hidden ${
                          isDraft ? 'border-yellow-500/50' : 'border-dark-border'
                        }`}
                      >
                        {/* Module Header */}
                        <div className="flex items-center justify-between p-4 bg-dark-elevated">
                        <button
                          onClick={() => toggleModuleExpansion(module.id)}
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
                            onClick={() => handleCopyModule(module)}
                            className="p-2 text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                            title="Copy module"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveModule(module.id)}
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
                            onClick={() => handleOpenAddTestCaseDialog(module)}
                            className="w-full p-3 border-2 border-dashed border-primary-500/30 rounded-lg bg-primary-500/5 hover:bg-primary-500/10 hover:border-primary-500/50 transition-colors flex items-center justify-center gap-2 text-primary-400 text-sm font-semibold"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Test Case
                          </button>

                          {/* Test Case List */}
                          {module.testResults && module.testResults.length > 0 && (
                            <>
                              {module.testResults.map((testResult) => (
                                <div
                                  key={testResult.id}
                                  className="flex items-center gap-3 p-3 bg-dark-elevated rounded hover:bg-dark-border transition-colors group"
                                >
                                  <div className="flex-1">
                                    <div className="text-sm text-white">
                                      {testResult.testcaseTitle}
                                    </div>
                                    {testResult.testcaseDescription && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {testResult.testcaseDescription}
                                      </div>
                                    )}
                                  </div>
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
                                    onClick={() => handleRemoveTestcase(module.id, testResult.testcaseId)}
                                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                    title="Remove test case"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
    </div>
  );
}
