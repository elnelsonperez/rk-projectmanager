import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Project } from '../store/projectStore'
import { Database } from '../types/database.types'

export type ProjectInput = Database['public']['Tables']['projects']['Insert']
export type ProjectWithClient = Project & { clients: { name: string } | null }

// Fetch all projects
export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .is('deleted_at', null) // Only show non-deleted projects
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as Project[]
    },
  })
}

// Fetch a single project by ID
export function useProject(id: string | number | undefined) {
  return useQuery<ProjectWithClient | null>({
    queryKey: ['projects', id],
    queryFn: async () => {
      if (!id) return null

      // Convert string ID to number if needed
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('id', numericId)
        .is('deleted_at', null) // Only show non-deleted projects
        .single()

      if (error) throw error
      return data as ProjectWithClient
    },
    enabled: !!id,
  })
}

// Create a new project
export function useCreateProject() {

  
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
  })
}

// Update an existing project
export function useUpdateProject() {

  
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
  })
}

// Update just the report notes of a project
export function useUpdateProjectReportNotes() {

  
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
  })
}

// Soft delete a project (mark as deleted)
export function useDeleteProject() {

  
  return useMutation({
    mutationFn: async (projectId: number) => {
      // Use soft delete instead of hard delete
      const { error } = await supabase
        .from('projects')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', projectId)
      
      if (error) throw error
      return projectId
    },
  })
}