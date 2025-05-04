import { create } from 'zustand'
import { Database } from '../types/database.types'

export type Project = Database['public']['Tables']['projects']['Row']

interface ProjectState {
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  currentProject: null,
  setCurrentProject: (project) => set({ currentProject: project }),
}))