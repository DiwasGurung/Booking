'use client'

import React, { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, MapPin, Phone, Globe, Loader, AlertCircle, Building2 } from 'lucide-react'
import { businessApi, type Business } from '@/lib/api'
import { useRoleProtection } from '@/hooks/useRoleProtection'

function SearchPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const { loading: authLoading } = useRoleProtection({ requiredRole: 'CUSTOMER' })
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  
  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = new Set(businesses.map(b => b.category).filter(Boolean))
    return Array.from(cats).sort()
  }, [businesses])

  // Load all businesses on mount
  useEffect(() => {
    loadAllBusinesses()
  }, [])

  // Refresh auth if coming from Google OAuth callback
  useEffect(() => {
    const authRefresh = searchParams.get('authRefresh')
    if (authRefresh === 'true') {
      console.log('[v0] Auth refresh triggered from OAuth callback')
      refreshUser()
      // Remove the parameter from URL
      router.replace('/search')
    }
  }, [searchParams, refreshUser, router])

  // Filter businesses when the search or category changes.
  useEffect(() => {
    applyFilters()
  }, [businesses, query, selectedCategory])

  const loadAllBusinesses = async () => {
    try {
      setLoading(true)
      const response = await businessApi.getAll()
      const responseData = response?.data as Business[] | { businesses?: Business[] } | undefined
      const data = Array.isArray(responseData)
        ? responseData
        : Array.isArray(responseData?.businesses)
          ? responseData.businesses
          : []
      setBusinesses(data)
      setSearched(false)
    } catch (error) {
      console.error('[v0] Failed to load businesses:', error)
      setBusinesses([])
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...businesses]

    // Apply search query
    if (query.trim()) {
      const lowerQuery = query.trim().toLowerCase()
      const text = (value: unknown) => String(value ?? '').toLowerCase()
      filtered = filtered.filter(b =>
        text(b.name).includes(lowerQuery) ||
        text(b.category).includes(lowerQuery) ||
        text(b.description).includes(lowerQuery) ||
        text(b.city).includes(lowerQuery) ||
        text(b.address).includes(lowerQuery)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(b => b.category === selectedCategory)
    }

    setFilteredBusinesses(filtered)
    if (query.trim()) {
      setSearched(true)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearched(true)
  }

  const handleClearFilters = () => {
    setQuery('')
    setSelectedCategory('all')
    setSearched(false)
  }

  const hasActiveFilters = Boolean(query.trim()) || selectedCategory !== 'all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 md:px-8 py-4 md:py-6">
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.18em] text-primary">Appointment directory</p>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-4xl">Find the right business for your next appointment</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">Compare the essentials, then book directly with a business that fits your needs.</p>
          </div>
        </div>

        <div className="px-4 md:px-8 py-4 md:py-8 mx-auto max-w-7xl w-full">
          {/* Search Bar */}
          <Card className="border border-border shadow-lg backdrop-blur-sm mb-4 md:mb-8">
            <form onSubmit={handleSearch} className="p-4 md:p-6">
              <div className="flex gap-2 md:gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 md:w-5 h-4 md:h-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search name, category..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    className="h-10 md:h-12 pl-9 md:pl-10 text-sm md:text-base border-2 border-border focus:border-primary transition-colors"
                  />
                </div>
                <Button
                  type="submit"
                  className="px-4 md:px-8 h-10 md:h-12 bg-primary text-primary-foreground hover:bg-primary/90 text-sm md:text-base"
                >
                  Search
                </Button>
              </div>
            </form>
          </Card>

          {/* Category filter */}
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-xs">
              <label htmlFor="category" className="mb-2 block text-sm font-medium text-foreground">Browse by category</label>
              <select
                id="category"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              >
                <option value="all">All categories</option>
                {categories.map((cat) => <option key={String(cat)} value={String(cat)}>{String(cat)}</option>)}
              </select>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={handleClearFilters} className="self-start sm:self-end">
                Clear search
              </Button>
            )}
          </div>

          {/* Results Count */}
          {!loading && (
            <div className="mb-4 md:mb-6 text-xs md:text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{filteredBusinesses.length}</span> of{' '}
              <span className="font-semibold text-foreground">{businesses.length}</span> businesses
            </div>
          )}

          {/* Results Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center">
                <Loader className="w-8 md:w-10 h-8 md:h-10 animate-spin text-primary mx-auto mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">Loading businesses...</p>
              </div>
            </div>
          ) : filteredBusinesses.length === 0 ? (
            <Card className="border border-border shadow-lg p-6 md:p-12 text-center">
              <AlertCircle className="w-10 md:w-12 h-10 md:h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg md:text-xl font-semibold text-foreground mb-2">No Businesses Found</p>
              <p className="mb-6 text-sm text-muted-foreground">Try a different business name, category, or location.</p>
              <Button variant="outline" onClick={handleClearFilters} className="px-4 md:px-6 text-sm md:text-base">
                Clear search
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredBusinesses.map(business => (
                <Card key={business.id} className="group flex flex-col overflow-hidden border-border bg-card shadow-sm transition-shadow hover:shadow-md">
                  <div className="flex flex-1 flex-col p-5 md:p-6">
                    <div className="mb-5 flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                        {business.logo ? (
                          <img src={typeof business.logo === 'string' ? business.logo : ''} alt={`${business.name} logo`} className="h-full w-full object-contain p-1" />
                        ) : (
                          <Building2 className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-lg font-semibold text-foreground">{business.name}</h3>
                        <p className="mt-1 text-sm font-medium text-primary">{business.category || 'Appointment services'}</p>
                      </div>
                    </div>

                    <p className="mb-5 min-h-12 text-sm leading-6 text-muted-foreground line-clamp-2">
                      {business.description || 'Book an appointment directly with this local business.'}
                    </p>

                    <div className="mb-6 space-y-3 border-t border-border pt-4 text-sm text-muted-foreground">
                      {business.address || business.city ? (
                        <div className="flex items-start gap-3">
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span className="line-clamp-2">{[business.address, business.city].filter(Boolean).join(', ')}</span>
                        </div>
                      ) : null}
                      {business.phone ? (
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 shrink-0 text-primary" />
                          <a href={`tel:${business.phone}`} className="truncate hover:text-primary">{business.phone}</a>
                        </div>
                      ) : null}
                      {business.website ? (
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 shrink-0 text-primary" />
                          <a href={business.website} target="_blank" rel="noopener noreferrer" className="truncate text-primary hover:underline">Visit website</a>
                        </div>
                      ) : null}
                    </div>

                    <Button onClick={() => router.push(`/book/${business.id}`)} className="mt-auto w-full">
                      View availability
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 flex items-center justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div>}>
      <SearchPageContent />
    </Suspense>
  )
}
