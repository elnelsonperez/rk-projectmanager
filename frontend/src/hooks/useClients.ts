import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { Database } from '../types/database.types'

export type Client = Database['public']['Tables']['clients']['Row']
export type ClientInput = Database['public']['Tables']['clients']['Insert']

// Fetch all clients
export function useClients() {
  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      if (error) throw error
      return data as Client[]
    },
  })
}

// Fetch a single client by ID
export function useClient(id: string | number | undefined) {
  return useQuery({
    queryKey: ['clients', id],
    queryFn: async () => {
      if (!id) return null
      
      // Convert string ID to number if needed
      const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', numericId)
        .single()

      if (error) throw error
      return data as Client
    },
    enabled: !!id,
  })
}

// Create a new client
export function useCreateClient() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (newClient: ClientInput) => {
      const { data, error } = await supabase
        .from('clients')
        .insert(newClient)
        .select()
        .single()

      if (error) throw error
      return data as Client
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}