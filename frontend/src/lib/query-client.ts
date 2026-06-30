import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000, // 5 minutes
      gcTime: 10 * 60_000,
      retry: (failureCount, error: unknown) => {
        // Ne pas réessayer les erreurs 4xx (sauf 401 géré par l'intercepteur Axios)
        if ((error as { response?: { status?: number } })?.response?.status &&
            ((error as { response?: { status?: number } }).response!.status ?? 0) < 500) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
