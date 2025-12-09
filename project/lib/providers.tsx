'use client';

import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        mutationCache: new MutationCache({
          onSuccess: () => {
            // Invalidate all queries on successful mutation
            queryClient.invalidateQueries();
          },
        }),
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60 * 5, // 5 minutes
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
