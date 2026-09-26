import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

const MIN_SPIN_MS = 800

/**
 * Manual refresh for a sheet-backed query. Always re-reads the sheet (skipping
 * the server cache) and keeps the icon spinning for a minimum time, so the
 * button visibly responds even when nothing has changed.
 */
export function useSheetRefresh(queryKey: string, path: string) {
  const queryClient = useQueryClient()
  const [spinning, setSpinning] = useState(false)
  // Bumps after each refresh; used as a React key to replay the list's entrance.
  const [refreshCount, setRefreshCount] = useState(0)

  const refresh = async () => {
    if (spinning) return
    setSpinning(true)
    const minDelay = new Promise((r) => setTimeout(r, MIN_SPIN_MS))
    try {
      const [res] = await Promise.all([
        api.get(path, { params: { fresh: 1 } }),
        minDelay,
      ])
      queryClient.setQueryData([queryKey], res.data)
    } catch {
      await minDelay
      await queryClient.invalidateQueries({ queryKey: [queryKey] })
    } finally {
      setSpinning(false)
      setRefreshCount((n) => n + 1)
    }
  }

  return { refresh, spinning, refreshCount }
}
