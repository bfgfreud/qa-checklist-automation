'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create client inside component to avoid shared state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,              // Data is immediately stale (prevents flickering)
        gcTime: 5 * 60 * 1000,     // Keep in cache for 5 min (for back navigation)
        refetchOnWindowFocus: false,
        refetchOnMount: true,      // Always refetch when component mounts
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
