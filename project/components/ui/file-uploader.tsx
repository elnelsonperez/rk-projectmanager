import React, { useState, useRef } from 'react';
import { Download, File, Paperclip, Trash2, Upload } from 'lucide-react';
import { Button } from './button';

interface FileUploaderProps {
  onFileSelected: (file: File | null) => void;
  initialFileUrl?: string | null;
  onRemoveFile?: () => void;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export function FileUploader({
  onFileSelected,
  initialFileUrl = null,
  onRemoveFile,
  isUploading = false,
  uploadProgress = 0,
  error = null,
  accept = "application/pdf,image/*",
  label = "Adjuntar archivo",
  disabled = false
}: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine if we have an existing file (either selected or from props)
  const hasFile = !!file || !!initialFileUrl;
  
  // Get file name from URL if available
  const getFileNameFromUrl = (url: string): string => {
    try {
      // Try to extract filename from URL
      const urlParts = new URL(url).pathname.split('/');
      const encodedFileName = urlParts[urlParts.length - 1];
      // Remove any timestamp prefix like "1620158400000_"
      const fileName = decodeURIComponent(encodedFileName).replace(/^\d+_/, '');
      return fileName || 'archivo';
    } catch {
      return 'archivo';
    }
  };
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Create preview URL for images
      if (selectedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }
      
      onFileSelected(selectedFile);
    }
  };
  
  // Clear selected file
  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setFile(null);
    setPreviewUrl(null);
    onFileSelected(null);
    
    if (onRemoveFile && initialFileUrl) {
      onRemoveFile();
    }
  };
  
  // Open file in new tab
  const handleViewFile = () => {
    if (initialFileUrl) {
      window.open(initialFileUrl, '_blank');
    } else if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };
  
  /* 
  // Download file - not currently used but kept for future use
  const handleDownloadFile = () => {
    if (initialFileUrl) {
      const link = document.createElement('a');
      link.href = initialFileUrl;
      link.download = getFileNameFromUrl(initialFileUrl);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  */
  
  // Trigger file selection dialog
  const handleClickUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || isUploading) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles[0]) {
      const droppedFile = droppedFiles[0];
      setFile(droppedFile);

      // Create preview URL for images
      if (droppedFile.type.startsWith('image/')) {
        const url = URL.createObjectURL(droppedFile);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null);
      }

      onFileSelected(droppedFile);
    }
  };
  
  // Determine filename to display
  const displayFileName = file 
    ? file.name 
    : initialFileUrl 
      ? getFileNameFromUrl(initialFileUrl)
      : '';
      
  // Determine if the file is an image
  const isImage = file 
    ? file.type.startsWith('image/') 
    : initialFileUrl 
      ? initialFileUrl.match(/\.(jpe?g|png|gif|bmp|webp|svg)$/i) !== null
      : false;
  
  return (
    <div className="space-y-2">
      {label && <label className="block font-medium text-sm">{label}</label>}

      <div
        className={`border rounded-md p-3 bg-background transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50 border-2'
            : 'border-input'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Hidden file input */}
        <input
          type="file"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          disabled={disabled || isUploading}
        />

        {/* File uploader UI */}
        {!hasFile ? (
          // Upload button when no file selected
          <div className="text-center py-2 sm:py-4">
            {/* Icon only visible on larger screens */}
            <div className={`hidden sm:flex mx-auto w-10 h-10 rounded-full items-center justify-center mb-2 ${
              isDragging ? 'bg-blue-100' : 'bg-muted/50'
            }`}>
              <Paperclip className={`h-5 w-5 ${isDragging ? 'text-blue-600' : 'text-muted-foreground'}`} />
            </div>
            {/* Reduced text on mobile */}
            <p className={`text-xs sm:text-sm mb-2 sm:mb-3 ${
              isDragging ? 'text-blue-600 font-medium' : 'text-muted-foreground'
            }`}>
              <span className="hidden sm:inline">
                {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un archivo aquí o haz clic para seleccionarlo'}
              </span>
              <span className="sm:hidden">Selecciona un archivo</span>
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClickUpload}
              disabled={disabled || isUploading}
              className="mx-auto"
            >
              <Upload className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Seleccionar Archivo</span>
            </Button>
          </div>
        ) : (
          // File preview when file selected - more compact on mobile
          <div>
            {/* File information */}
            <div className="flex items-center p-1 sm:p-2 bg-muted/20 rounded-md mb-2">
              {/* Smaller preview on mobile */}
              <div className="mr-2 sm:mr-3 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 rounded-md bg-muted/30 flex items-center justify-center">
                {isImage && previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : isImage && initialFileUrl ? (
                  <img 
                    src={initialFileUrl} 
                    alt="Preview" 
                    className="h-full w-full object-cover rounded-md"
                  />
                ) : (
                  <File className="h-4 w-4 sm:h-5 sm:w-5 text-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate" title={displayFileName}>
                  {displayFileName}
                </p>
                {file && (
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                )}
              </div>
              
              <div className="flex space-x-1">
                {(initialFileUrl || previewUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 sm:h-7 sm:w-7 p-0"
                    onClick={handleViewFile}
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 sm:h-7 sm:w-7 p-0 text-destructive hover:text-destructive"
                  onClick={handleClearFile}
                  disabled={disabled || isUploading}
                >
                  <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
            
            {/* Upload progress */}
            {isUploading && (
              <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                <div 
                  className="bg-primary h-1.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
            
            {/* Change file button - icon only on mobile */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClickUpload}
              disabled={disabled || isUploading}
              className="w-full text-xs"
            >
              <Upload className="h-3 w-3 sm:hidden mr-1" />
              <span className="sm:inline">Cambiar Archivo</span>
            </Button>
          </div>
        )}
        
        {/* Error message */}
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    </div>
  );
}