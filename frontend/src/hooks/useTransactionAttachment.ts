import { useState } from 'react';
import { uploadFile, deleteFile } from '../lib/supabase';

export function useTransactionAttachment() {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Upload a file and get its URL
  const handleUpload = async (file: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      // Simple progress simulation (since Supabase doesn't provide upload progress)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress > 90 ? 90 : newProgress;
        });
      }, 200);
      
      // Upload file to "transactions" folder
      const fileUrl = await uploadFile(file, 'transactions');
      
      // Completed
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      return fileUrl;
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Remove a file by URL
  const handleRemove = async (fileUrl: string | null | undefined): Promise<boolean> => {
    if (!fileUrl) return true;
    
    try {
      // Extract the path from the URL
      const url = new URL(fileUrl);
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/rk-projectmanager\/(.+)/);
      
      if (pathMatch && pathMatch[1]) {
        await deleteFile(decodeURIComponent(pathMatch[1]));
      }
      
      return true;
    } catch (error) {
      console.error('Error removing file:', error);
      return false;
    }
  };

  return {
    handleUpload,
    handleRemove,
    isUploading,
    uploadProgress,
    uploadError,
  };
}