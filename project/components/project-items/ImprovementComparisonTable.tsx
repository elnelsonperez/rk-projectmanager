'use client';

import { Check } from 'lucide-react';
import type { ItemComparison } from '../../types/improvements.types';

interface ImprovementComparisonTableProps {
  items: ItemComparison[];
  onToggleAccept: (id: number) => void;
}

export function ImprovementComparisonTable({
  items,
  onToggleAccept,
}: ImprovementComparisonTableProps) {
  // Helper to determine if field changed
  const hasChanged = (original: string, improved: string) => {
    return original !== improved;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 border-b sticky top-0 z-10">
          <tr>
            <th className="w-10 px-3 py-2 text-left font-medium"></th>
            <th className="w-12 px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Nombre Original</th>
            <th className="px-3 py-2 text-left font-medium">Nombre Mejorado</th>
            <th className="px-3 py-2 text-left font-medium">Descripción Original</th>
            <th className="px-3 py-2 text-left font-medium">Descripción Mejorada</th>
            <th className="px-3 py-2 text-left font-medium">Categoría Original</th>
            <th className="px-3 py-2 text-left font-medium">Categoría Mejorada</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map((item) => (
            <tr
              key={item.id}
              className={`hover:bg-muted/30 ${
                item.accepted && item.has_changes ? 'bg-green-50/30' : ''
              } ${!item.has_changes ? 'opacity-60' : ''}`}
            >
              {/* Checkbox */}
              <td className="px-3 py-2">
                {item.has_changes ? (
                  <button
                    onClick={() => onToggleAccept(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      item.accepted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                    }`}
                    aria-label={item.accepted ? 'Rechazar' : 'Aceptar'}
                  >
                    {item.accepted && <Check className="h-3 w-3" />}
                  </button>
                ) : (
                  <div className="w-5 h-5 rounded border-2 border-gray-200 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">-</span>
                  </div>
                )}
              </td>

              {/* ID */}
              <td className="px-3 py-2 text-muted-foreground">
                {item.id}
              </td>

              {/* Name Original */}
              <td className="px-3 py-2">
                <span className={hasChanged(item.original_name, item.improved_name) ? 'text-gray-500' : ''}>
                  {item.original_name}
                </span>
              </td>

              {/* Name Improved */}
              <td className="px-3 py-2">
                <span className={hasChanged(item.original_name, item.improved_name) ? 'font-medium bg-yellow-50 px-1 rounded' : ''}>
                  {item.improved_name}
                </span>
              </td>

              {/* Description Original */}
              <td className="px-3 py-2">
                <span className={hasChanged(item.original_description, item.improved_description) ? 'text-gray-500' : ''}>
                  {item.original_description || <em className="text-gray-400">-</em>}
                </span>
              </td>

              {/* Description Improved */}
              <td className="px-3 py-2">
                <span className={hasChanged(item.original_description, item.improved_description) ? 'font-medium bg-yellow-50 px-1 rounded' : ''}>
                  {item.improved_description || <em className="text-gray-400">-</em>}
                </span>
              </td>

              {/* Category Original */}
              <td className="px-3 py-2">
                <span className={hasChanged(item.original_category, item.improved_category) ? 'text-gray-500' : ''}>
                  {item.original_category}
                </span>
              </td>

              {/* Category Improved */}
              <td className="px-3 py-2">
                <span className={hasChanged(item.original_category, item.improved_category) ? 'font-medium bg-yellow-50 px-1 rounded' : ''}>
                  {item.improved_category}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
