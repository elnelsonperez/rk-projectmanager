import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database.types'

// Initialize the Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase URL or Key. Please check your environment variables.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)

// Function to get project report data
export async function getProjectReport(projectId: number) {
  const { data, error } = await supabase
    .rpc('get_project_report', { p_project_id: projectId });

  if (error) throw error;
  return data;
}