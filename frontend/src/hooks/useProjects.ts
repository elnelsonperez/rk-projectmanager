import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Project } from '../store/projectStore'
import { Database } from '../types/database.types'

export type ProjectInput = Database['public']['Tables']['projects']['Insert']

// Fetch all projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
  })
}

// Fetch a single project by ID
export function useProject(id: string | number | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) return null
      
      // Convert string ID to number if needed
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', numericId)
        .single()

      if (error) throw error
      return data as Project
    },
    enabled: !!id,
  })
}

// Create a new project
export function useCreateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newProject: ProjectInput) => {
      const { data, error } = await supabase
        .from('projects')
        .insert(newProject)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

// Update an existing project
export function useUpdateProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Project> & { id: number }) => {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', String(data.id)] })
    },
  })
}

// Update just the report notes of a project
export function useUpdateProjectReportNotes() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, report_notes }: { id: number, report_notes: string }) => {
      const { data, error } = await supabase
        .from('projects')
        .update({ report_notes })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Project
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects', String(data.id)] })
    },
  })
}

// Delete a project
export function useDeleteProject() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (projectId: number) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)
      
      if (error) throw error
      return projectId
    },
    onSuccess: (deletedProjectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', String(deletedProjectId)] })
    },
  })
}