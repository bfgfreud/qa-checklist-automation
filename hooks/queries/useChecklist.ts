import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { ProjectChecklistWithTesters, TestStatus } from '@/types/checklist';

interface UseChecklistOptions {
  polling?: boolean;
  pollingInterval?: number;
}

/**
 * Hook to fetch checklist with testers for a project
 */
export function useChecklist(projectId: string, options: UseChecklistOptions = {}) {
  const { polling = false, pollingInterval = 5000 } = options;

  return useQuery<ProjectChecklistWithTesters>({
    queryKey: ['checklist', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/checklists/${projectId}?view=multi-tester&_t=${Date.now()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch checklist');
      return data.data;
    },
    enabled: !!projectId,
    refetchInterval: polling ? pollingInterval : false,
    // Keep previous data while fetching to prevent flicker during polling
    placeholderData: keepPreviousData,
  });
}

interface UpdateTestResultInput {
  status?: TestStatus;
  notes?: string;
}

/**
 * Hook to update a test result
 */
export function useUpdateTestResult(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ resultId, data }: { resultId: string; data: UpdateTestResultInput }) => {
      const res = await fetch(`/api/checklists/test-results/${resultId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update test result');
      return result.data;
    },
    onSuccess: () => {
      // Invalidate the project's checklist
      queryClient.invalidateQueries({ queryKey: ['checklist', projectId] });
    },
  });
}

interface AddModuleToChecklistInput {
  moduleId: string;
  testcaseIds?: string[];
}

/**
 * Hook to add a module to the checklist
 */
export function useAddModuleToChecklist(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AddModuleToChecklistInput) => {
      const res = await fetch(`/api/projects/${projectId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to add module');
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', projectId] });
    },
  });
}

/**
 * Hook to remove a module from the checklist
 */
export function useRemoveModuleFromChecklist(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (checklistModuleId: string) => {
      const res = await fetch(`/api/projects/${projectId}/checklist/${checklistModuleId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to remove module');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist', projectId] });
    },
  });
}
