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

// Bucket name for file uploads
export const STORAGE_BUCKET = 'rk-projectmanager';

// Function to upload a file to Supabase Storage
export async function uploadFile(file: File, folder: string): Promise<string> {
  const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file);

  if (error) throw error;

  // Get the public URL
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

// Function to get file URL from path
export function getFileUrl(filePath: string): string {
  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

// Function to delete a file from storage
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([filePath]);
  
  if (error) throw error;
}