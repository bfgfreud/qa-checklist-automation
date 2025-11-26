import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Module, CreateModuleDto, UpdateModuleDto } from '@/types/module';

/**
 * Hook to fetch all modules with test cases
 */
export function useModules() {
  return useQuery<Module[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const res = await fetch('/api/modules');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch modules');
      return data.data;
    },
    // Module library rarely changes, so we can cache longer
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch a single module
 */
export function useModule(moduleId: string) {
  return useQuery<Module>({
    queryKey: ['module', moduleId],
    queryFn: async () => {
      const res = await fetch(`/api/modules/${moduleId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch module');
      return data.data;
    },
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to create a new module
 */
export function useCreateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newModule: CreateModuleDto) => {
      const res = await fetch('/api/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newModule),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create module');
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
}

/**
 * Hook to update a module
 */
export function useUpdateModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateModuleDto }) => {
      const res = await fetch(`/api/modules/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update module');
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['module', variables.id] });
    },
  });
}

/**
 * Hook to delete a module
 */
export function useDeleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/modules/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete module');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
}
