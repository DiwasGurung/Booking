'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { useBusinessId } from '@/hooks/useBusinessId'
import { branchApi, type Branch } from '@/lib/api'

interface BranchCtx {
  branches: Branch[]
  limit: number                       // -1 = unlimited
  loading: boolean
  hasMultipleBranches: boolean
  canAddBranches: boolean
  selectedBranchId: string            // 'ALL' or a branch id
  setSelectedBranchId: (id: string) => void
  branchParam: string | undefined     // pass to API calls: undefined means all branches
  refresh: () => Promise<void>
}

const Ctx = createContext<BranchCtx | null>(null)
const KEY = 'selectedBranchId'

export function BranchProvider({ children }: { children: ReactNode }) {
  const { businessId } = useBusinessId()
  const [branches, setBranches] = useState<Branch[]>([])
  const [limit, setLimit] = useState(1)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState('ALL')

  const refresh = useCallback(async () => {
    if (!businessId) return
    const res = await branchApi.list()
    const list = res.data ?? []
    setBranches(list)
    setLimit(res.limit ?? 1)
    setLoading(false)
  }, [businessId])

  useEffect(() => { refresh() }, [refresh])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(KEY) : null
    if (saved) setSelected(saved)
  }, [])

  const hasMultipleBranches = branches.length > 1
  // A stale or removed selection falls back to "all"
  const effective = hasMultipleBranches && branches.some((b) => b.id === selected) ? selected : 'ALL'

  const setSelectedBranchId = (id: string) => {
    setSelected(id)
    localStorage.setItem(KEY, id)
  }

  const value = useMemo<BranchCtx>(() => ({
    branches, limit, loading, hasMultipleBranches,
    canAddBranches: limit === -1 || limit > 1 || branches.length > 1,
    selectedBranchId: effective,
    setSelectedBranchId,
    branchParam: hasMultipleBranches && effective !== 'ALL' ? effective : undefined,
    refresh,
  }), [branches, limit, loading, hasMultipleBranches, effective, refresh])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBranches() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBranches must be used inside BranchProvider')
  return ctx
}