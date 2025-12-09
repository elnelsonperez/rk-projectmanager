import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Transaction } from './useTransactions';
import { ProjectItem } from './useProjectItems';

// Define a type for the budget guidance data
export interface ProjectItemBudgetInfo {
  // Item data
  itemName: string;
  clientCost: number | null;
  estimatedCost: number | null;
  
  // Expense data
  totalExpenses: number;
  remainingBudget: number | null;
  isOverBudget: boolean;
  
  // Recommended value
  recommendedClientFacingAmount: number | null;
}

// Hook to fetch transactions for a specific project item
export function useProjectItemTransactions(
  projectItemId: number | undefined | null,
  projectId: number | undefined | null
) {
  return useQuery({
    // Use a structure that will be properly invalidated by the transaction hooks
    queryKey: ['transactions', 'byProjectItem', projectItemId],
    queryFn: async () => {
      if (!projectItemId || !projectId) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('project_item_id', projectItemId)
        .eq('project_id', projectId);

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!projectItemId && !!projectId,
  });
}

// Hook to compute budget guidance for a project item
export function useProjectItemBudgetGuidance(
  projectItemId: number | undefined | null,
  projectId: number | undefined | null,
  projectItem: ProjectItem | null | undefined,
  currentTransactionId?: number // Optional ID of transaction being edited
): ProjectItemBudgetInfo | null {
  const { data: itemTransactions = [], isLoading } = useProjectItemTransactions(
    projectItemId,
    projectId
  );
  
  if (isLoading || !projectItem || !projectItemId) {
    return null;
  }
  
  // Calculate total expenses for this project item
  // Exclude the transaction being edited to avoid double-counting
  const totalExpenses = itemTransactions.reduce((sum, transaction) => {
    // Skip the transaction being edited
    if (currentTransactionId && transaction.id === currentTransactionId) {
      return sum;
    }
    // Only count positive amounts (expenses)
    return sum + (transaction.amount > 0 ? transaction.amount : 0);
  }, 0);
  
  // Calculate remaining budget
  const remainingBudget = projectItem.client_cost !== null 
    ? projectItem.client_cost - totalExpenses 
    : null;
  
  // Determine if we're over budget
  const isOverBudget = remainingBudget !== null && remainingBudget < 0;
  
  // Calculate recommended client facing amount
  // If this is the first transaction, use the full client cost
  // Otherwise, use the remaining budget
  const recommendedClientFacingAmount = projectItem.client_cost !== null
    ? (itemTransactions.filter(t => !currentTransactionId || t.id !== currentTransactionId).length === 0 
       ? projectItem.client_cost 
       : remainingBudget)
    : null;
  
  return {
    itemName: projectItem.item_name,
    clientCost: projectItem.client_cost,
    estimatedCost: projectItem.estimated_cost,
    totalExpenses,
    remainingBudget,
    isOverBudget,
    recommendedClientFacingAmount: recommendedClientFacingAmount !== null ? Math.max(0, recommendedClientFacingAmount) : null,
  };
}