import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'

export type ProjectItem = Database['public']['Tables']['project_items']['Row']
type ProjectItemInsert = Database['public']['Tables']['project_items']['Insert']
type ProjectItemUpdate = Database['public']['Tables']['project_items']['Update'] & { id: number }

// Hook to get unique areas for a project
export function useProjectAreas(projectId: number | undefined | null) {
  return useQuery({
    queryKey: ['projectAreas', projectId],
    queryFn: async () => {
      if (!projectId) return []

      const { data, error } = await supabase
        .from('project_items')
        .select('area')
        .eq('project_id', projectId)
        .not('area', 'is', null)

      if (error) throw error

      // Extract unique areas
      const areas = data
        .map(item => item.area)
        .filter((area): area is string => !!area) // Filter out null/undefined

      // Get unique values
      return [...new Set(areas)].sort()
    },
    enabled: !!projectId,
  })
}

// Fetch unique categories for a project
export function useProjectCategories(projectId: number | undefined | null) {
  return useQuery({
    queryKey: ['projectCategories', projectId],
    queryFn: async () => {
      if (!projectId) {
        // Return default categories when no project is specified
        return ['Accesorios', 'Decoración', 'Mano de Obra', 'Materiales', 'Muebles', 'Otro']
      }

      const { data, error } = await supabase
        .from('project_items')
        .select('category')
        .eq('project_id', projectId)
        .not('category', 'is', null)

      if (error) throw error

      // Extract unique categories from database
      const dbCategories = data
        .map(item => item.category)
        .filter((category): category is string => !!category) // Filter out null/undefined

      // Default categories to always include
      const defaultCategories = ['Muebles', 'Decoración', 'Accesorios', 'Materiales', 'Mano de Obra', 'Otro']

      // Merge database categories with defaults and get unique sorted values
      return [...new Set([...defaultCategories, ...dbCategories])].sort()
    },
    enabled: !!projectId,
  })
}

// Fetch project items for a specific project
export function useProjectItems(projectId: number | undefined | null) {
  return useQuery({
    queryKey: ['projectItems', projectId],
    queryFn: async () => {
      if (!projectId) return []
      
      const { data, error } = await supabase
        .from('project_items')
        .select('*, suppliers(name)')
        .eq('project_id', projectId)
        .order('id', { ascending: true })

      if (error) throw error
      return data as (ProjectItem & { suppliers: { name: string } | null })[]
    },
    enabled: !!projectId,
  })
}

// Fetch a single project item
export function useProjectItem(id: number | undefined) {
  return useQuery({
    queryKey: ['projectItems', 'detail', id],
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('project_items')
        .select('*, suppliers(name)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as (ProjectItem & { suppliers: { name: string } | null })
    },
    enabled: !!id,
  })
}

// Create a new project item
export function useCreateProjectItem() {
  return useMutation({
    mutationFn: async (newItem: ProjectItemInsert) => {
      const { data, error } = await supabase
        .from('project_items')
        .insert(newItem)
        .select()
        .single()

      if (error) throw error
      return data as ProjectItem
    }
  })
}

// Update an existing project item
export function useUpdateProjectItem() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: ProjectItemUpdate) => {
      const { data, error } = await supabase
        .from('project_items')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as ProjectItem
    },
  })
}

// Delete a project item
export function useDeleteProjectItem() {
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
      const { error } = await supabase
        .from('project_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, projectId }
    },
  })
}

// Bulk delete project items
export function useBulkDeleteProjectItems() {
  return useMutation({
    mutationFn: async ({ ids, projectId }: { ids: number[]; projectId: number }) => {
      const { error } = await supabase
        .from('project_items')
        .delete()
        .in('id', ids)

      if (error) throw error
      return { ids, projectId }
    },
  })
}

// Bulk update multiple project items
interface BulkUpdateItem {
  id: number;
  item_name?: string;
  description?: string | null;
  category?: string;
}

export function useBulkUpdateProjectItems() {
  return useMutation({
    mutationFn: async ({
      items,
      projectId,
    }: {
      items: BulkUpdateItem[];
      projectId: number;
    }) => {
      const updates = await Promise.all(
        items.map(async (item) => {
          const { id, ...updateData } = item;
          const { data, error } = await supabase
            .from('project_items')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;
          return data as ProjectItem;
        })
      );

      return { updates, projectId };
    },
  });
}

// Hook for AI improvement
export function useImproveProjectItems() {
  return useMutation({
    mutationFn: async (projectId: number) => {
      // Fetch all items for the project
      const { data: items, error } = await supabase
        .from('project_items')
        .select('id, item_name, description, category')
        .eq('project_id', projectId);

      if (error) throw error;
      if (!items || items.length === 0) {
        throw new Error('No hay artículos para mejorar');
      }

      // Call AI improvement API
      const response = await fetch('/api/ai-improve-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, items }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al mejorar artículos');
      }

      const result = await response.json();
      return result;
    },
  });
}