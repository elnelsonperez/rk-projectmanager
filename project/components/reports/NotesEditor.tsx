import React, { useState } from 'react';
import Editor from 'react-simple-wysiwyg';

interface NotesEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const NotesEditor: React.FC<NotesEditorProps> = ({ value, onChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const toggleNotes = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className="mb-6 border rounded-md overflow-hidden">
      <button 
        onClick={toggleNotes}
        className="w-full px-4 py-3 text-left bg-gray-50 hover:bg-gray-100 flex justify-between items-center"
      >
        <div>
          <h3 className="text-lg font-medium">Notas para el Reporte</h3>
          {value && !isExpanded && (
            <p className="text-sm text-gray-500">Hay contenido de notas guardado</p>
          )}
        </div>
        <svg 
          className={`h-5 w-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="p-4">
          <Editor 
            value={value} 
            onChange={(e) => onChange(e.target.value)}
            containerProps={{
              style: {
                height: '200px', 
                border: '1px solid #ddd',
                borderRadius: '0.375rem'
              }
            }}
          />
          <p className="text-sm text-gray-500 mt-1">
            Use el editor para dar formato al texto. El contenido HTML será mostrado en el reporte.
          </p>
        </div>
      )}
    </div>
  );
};

export default NotesEditor;