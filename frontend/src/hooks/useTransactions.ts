import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'

export type Transaction = Database['public']['Tables']['transactions']['Row']
type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'] & { id: number }

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', data.project_id] })
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['transactions', data.project_id] })
      queryClient.invalidateQueries({ queryKey: ['transactions', 'detail', data.id] })
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
    onSuccess: ({ projectId }) => {
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['transactions', projectId] })
      }
    },
  })
}