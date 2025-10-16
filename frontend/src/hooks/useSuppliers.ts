import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'

export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type SupplierInput = Database['public']['Tables']['suppliers']['Insert']

// Fetch all suppliers
export function useSuppliers() {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Supplier[]
    },
  })
}

// Fetch a single supplier by ID
export function useSupplier(id: string | number | undefined) {
  return useQuery({
    queryKey: ['suppliers', id],
    queryFn: async () => {
      if (!id) return null

      // Convert string ID to number if needed
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', numericId)
        .single()

      if (error) throw error
      return data as Supplier
    },
    enabled: !!id,
  })
}

// Create a new supplier
export function useCreateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (newSupplier: SupplierInput) => {
      const { data, error } = await supabase
        .from('suppliers')
        .insert(newSupplier)
        .select()
        .single()

      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

// Update an existing supplier
export function useUpdateSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Supplier> & { id: number }) => {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data as Supplier
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}

// Delete a supplier
export function useDeleteSupplier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id)

      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] })
    },
  })
}
