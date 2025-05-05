import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'

// Extended Transaction type with attachment_url
export type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  attachment_url?: string | null
}

// Extended Insert type with attachment_url
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'] & {
  attachment_url?: string | null
}

// Extended Update type with attachment_url
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'] & { 
  id: number;
  attachment_url?: string | null 
}

// Fetch transactions for a specific project
export function useTransactions(projectId: number | undefined | null) {
  return useQuery({
    queryKey: ['transactions', projectId],
    queryFn: async () => {
      if (!projectId) return []
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*, project_items(item_name)')
        .eq('project_id', projectId)
        .order('date', { ascending: false })

      if (error) throw error
      return data as (Transaction & { project_items: { item_name: string } | null })[]
    },
    enabled: !!projectId,
  })
}

// Calculate total income for a project (negative amount transactions)
export function useProjectIncome(projectId: number | undefined | null) {
  return useQuery({
    queryKey: ['transactions', 'income', projectId],
    queryFn: async () => {
      if (!projectId) return 0
      
      const { data, error } = await supabase
        .from('transactions')
        .select('amount')
        .eq('project_id', projectId)
        .lt('amount', 0) // Only negative amounts (income)

      if (error) throw error
      
      // Calculate total income (convert negative values to positive for display)
      const totalIncome = data.reduce((sum, transaction) => {
        return sum + Math.abs(transaction.amount)
      }, 0)
      
      return totalIncome
    },
    enabled: !!projectId,
  })
}

// Fetch a single transaction
export function useTransaction(id: number | undefined) {
  return useQuery({
    queryKey: ['transactions', 'detail', id],
    queryFn: async () => {
      if (!id) return null
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*, project_items(item_name)')
        .eq('id', id)
        .single()

      if (error) throw error
      return data as (Transaction & { project_items: { item_name: string } | null })
    },
    enabled: !!id,
  })
}

// Create a new transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newTransaction: TransactionInsert) => {
      const { data, error } = await supabase
        .from('transactions')
        .insert(newTransaction)
        .select()
        .single()

      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// Update an existing transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: TransactionUpdate) => {
      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Transaction
    },
    onSuccess: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}

// Delete a transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: number; projectId: number | null }) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error
      return { id, projectId }
    },
    onSuccess: () => {
      // Invalidate all transaction queries
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
    },
  })
}