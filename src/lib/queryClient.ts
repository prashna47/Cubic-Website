import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error) => {
        const status = (error as { response?: { status?: number } }).response
          ?.status
        return !(status && status >= 400 && status < 500) && failureCount < 1
      },
      refetchOnWindowFocus: false,
    },
  },
})
