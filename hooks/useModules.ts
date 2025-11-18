'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Module,
  CreateModuleDto,
  UpdateModuleDto,
  CreateTestCaseDto,
  UpdateTestCaseDto,
  ReorderModulesDto,
  ReorderTestCasesDto,
} from '@/types/module';

const API_BASE_URL = '/api';

export const useModules = () => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all modules
  const fetchModules = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/modules`);
      if (!response.ok) throw new Error('Failed to fetch modules');
      const data = await response.json();
      setModules(data.data || data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching modules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Create module
  const createModule = useCallback(async (data: CreateModuleDto): Promise<Module> => {
    const response = await fetch(`${API_BASE_URL}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to create module');
    const result = await response.json();
    const newModule = result.data || result;
    setModules((prev) => [...prev, newModule]);
    return newModule;
  }, []);

  // Update module
  const updateModule = useCallback(async (id: string, data: UpdateModuleDto): Promise<Module> => {
    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to update module');
    const result = await response.json();
    const updatedModule = result.data || result;
    setModules((prev) => prev.map((m) => (m.id === id ? updatedModule : m)));
    return updatedModule;
  }, []);

  // Delete module
  const deleteModule = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/modules/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete module');
    setModules((prev) => prev.filter((m) => m.id !== id));
  }, []);

  // Create test case
  const createTestCase = useCallback(
    async (moduleId: string, data: CreateTestCaseDto): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/modules/${moduleId}/testcases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to create test case');
      const result = await response.json();
      const newTestCase = result.data || result;

      setModules((prev) =>
        prev.map((m) => (m.id === moduleId ? { ...m, testCases: [...m.testCases, newTestCase] } : m))
      );
    },
    []
  );

  // Update test case
  const updateTestCase = useCallback(
    async (testCaseId: string, data: UpdateTestCaseDto): Promise<void> => {
      const response = await fetch(`${API_BASE_URL}/testcases/${testCaseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update test case');
      const result = await response.json();
      const updatedTestCase = result.data || result;

      setModules((prev) =>
        prev.map((m) => ({
          ...m,
          testCases: m.testCases.map((tc) => (tc.id === testCaseId ? updatedTestCase : tc)),
        }))
      );
    },
    []
  );

  // Delete test case
  const deleteTestCase = useCallback(async (testCaseId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/testcases/${testCaseId}`, {
      method: 'DELETE',
    });

    if (!response.ok) throw new Error('Failed to delete test case');

    setModules((prev) =>
      prev.map((m) => ({
        ...m,
        testCases: m.testCases.filter((tc) => tc.id !== testCaseId),
      }))
    );
  }, []);

  // Reorder modules
  const reorderModules = useCallback(async (data: ReorderModulesDto): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/modules/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to reorder modules');
  }, []);

  // Reorder test cases
  const reorderTestCases = useCallback(async (data: ReorderTestCasesDto): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/testcases/reorder`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) throw new Error('Failed to reorder test cases');
  }, []);

  // Load modules on mount
  useEffect(() => {
    fetchModules();
  }, [fetchModules]);

  return {
    modules,
    loading,
    error,
    fetchModules,
    createModule,
    updateModule,
    deleteModule,
    createTestCase,
    updateTestCase,
    deleteTestCase,
    reorderModules,
    reorderTestCases,
  };
};
