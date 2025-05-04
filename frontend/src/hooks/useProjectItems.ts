import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
        .order('updated_at', { ascending: false })

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
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newItem: ProjectItemInsert) => {
      const { data, error } = await supabase
        .from('project_items')
        .insert(newItem)
        .select()
        .single()

      if (error) throw error
      return data as ProjectItem
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectItems', data.project_id] })
    },
  })
}

// Update an existing project item
export function useUpdateProjectItem() {
  const queryClient = useQueryClient()
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projectItems', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['projectItems', 'detail', data.id] })
    },
  })
}

// Delete a project item
export function useDeleteProjectItem() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId: number }) => {
      const { error } = await supabase
        .from('project_items')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, projectId }
    },
    onSuccess: ({ projectId }) => {
      queryClient.invalidateQueries({ queryKey: ['projectItems', projectId] })
    },
  })
}