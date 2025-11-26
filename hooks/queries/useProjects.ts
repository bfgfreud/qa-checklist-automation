import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Project, CreateProjectDto, UpdateProjectDto } from '@/types/project';

/**
 * Hook to fetch all projects
 */
export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch projects');
      return data.data;
    },
  });
}

/**
 * Hook to fetch a single project
 */
export function useProject(projectId: string) {
  return useQuery<Project>({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to fetch project');
      return data.data;
    },
    enabled: !!projectId,
  });
}

/**
 * Hook to create a new project
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newProject: CreateProjectDto) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProject),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to create project');
      return data.data;
    },
    onSuccess: () => {
      // CRITICAL: Invalidate projects list so new project shows immediately
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

/**
 * Hook to update a project
 */
export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateProjectDto }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error || 'Failed to update project');
      return result.data;
    },
    onSuccess: (_, variables) => {
      // Invalidate both list and specific project
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
}

/**
 * Hook to delete a project
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete project');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
