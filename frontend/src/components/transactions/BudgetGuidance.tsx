// No need for React import with automatic JSX transform
import { ProjectItemBudgetInfo } from '../../hooks/useProjectItemTransactions';
import { formatCurrency } from '../../utils/formatters';

interface BudgetGuidanceProps {
  budgetInfo: ProjectItemBudgetInfo | null;
  onApplyRecommended?: (amount: number) => void;
}

export function BudgetGuidance({ budgetInfo, onApplyRecommended }: BudgetGuidanceProps) {
  if (!budgetInfo) {
    return null;
  }

  return (
    <div className="mt-1 text-sm">
      <div className={`p-2 rounded-md ${budgetInfo.isOverBudget ? 'bg-red-50' : 'bg-blue-50'}`}>
        <h4 className="font-semibold">
          Guía presupuestaria: {budgetInfo.itemName}
        </h4>
        
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1">
          <dt className="text-gray-600">Presupuesto cliente:</dt>
          <dd className="font-medium">
            {budgetInfo.clientCost !== null ? formatCurrency(budgetInfo.clientCost) : 'No definido'}
          </dd>
          
          <dt className="text-gray-600">Total gastado:</dt>
          <dd className="font-medium">{formatCurrency(budgetInfo.totalExpenses)}</dd>
          
          {budgetInfo.remainingBudget !== null && (
            <>
              <dt className="text-gray-600">Saldo disponible:</dt>
              <dd className={`font-medium ${budgetInfo.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {formatCurrency(budgetInfo.remainingBudget)}
              </dd>
            </>
          )}
        </dl>
        
        {budgetInfo.recommendedClientFacingAmount !== null && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="font-medium">
                Valor recomendado: {formatCurrency(budgetInfo.recommendedClientFacingAmount)}
              </p>
              {onApplyRecommended && (
                <button
                  type="button"
                  onClick={() => onApplyRecommended(budgetInfo.recommendedClientFacingAmount || 0)}
                  className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded-md transition"
                >
                  Aplicar
                </button>
              )}
            </div>
            {budgetInfo.isOverBudget && (
              <p className="text-xs text-red-600 mt-1">
                ⚠️ Este artículo ha excedido el presupuesto asignado.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}