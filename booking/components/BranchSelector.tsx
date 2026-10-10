'use client'

import { Building2 } from 'lucide-react'
import { useBranches } from '@/context/branchContext' // adjust path

export function BranchSelector({ className = '' }: { className?: string }) {
  const { branches, hasMultipleBranches, selectedBranchId, setSelectedBranchId, loading } = useBranches()

  if (loading || !hasMultipleBranches) return null

  return (
    <div className={`relative ${className}`}>
      <Building2 className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <select
        aria-label="Filter by branch"
        value={selectedBranchId}
        onChange={(e) => setSelectedBranchId(e.target.value)}
        className="h-10 w-full min-w-[180px] pl-9 pr-3 rounded-md border border-border bg-background text-sm text-foreground"
      >
        <option value="ALL">All branches</option>
        {branches
          .filter((b) => b.isActive)
          .map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
              {b.isMain ? ' (Main)' : ''}
            </option>
          ))}
      </select>
    </div>
  )
}