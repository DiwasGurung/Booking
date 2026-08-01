'use client'

import React, { useEffect, useState } from "react"
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/authContext'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, MapPin, Phone, Globe, Loader, AlertCircle, Star, X } from 'lucide-react'
import { businessApi, type Business } from '@/lib/api'
import { useRoleProtection } from '@/hooks/useRoleProtection'

export default function SearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshUser } = useAuth()
  const { loading: authLoading } = useRoleProtection({ requiredRole: 'CUSTOMER' })
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedRating, setSelectedRating] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')
  
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

  // Filter and sort businesses when filters change
  useEffect(() => {
    applyFiltersAndSort()
  }, [businesses, query, selectedCategory, selectedRating, sortBy])

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

  const applyFiltersAndSort = () => {
    let filtered = [...businesses]

    const normalizeField = (value: unknown) => {
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
        return String(value).toLowerCase()
      }
      return ''
    }

    // Apply search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(b =>
        normalizeField(b.name).includes(lowerQuery) ||
        normalizeField(b.category).includes(lowerQuery) ||
        normalizeField(b.description).includes(lowerQuery) ||
        normalizeField(b.city).includes(lowerQuery)
      )
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(b => b.category === selectedCategory)
    }

    // Apply rating filter
    if (selectedRating !== 'all') {
      const minRating = parseFloat(selectedRating)
      filtered = filtered.filter(b => (b.rating || 0) >= minRating)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'newest':
          return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        default:
          return 0
      }
    })

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
    setSelectedRating('all')
    setSortBy('name')
    setSearched(false)
    setShowFilters(false)
  }

  const hasActiveFilters = query || selectedCategory !== 'all' || selectedRating !== 'all'

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30">
      <div className="w-full">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="px-4 md:px-8 py-4 md:py-6">
            <h1 className="text-2xl md:text-4xl font-bold text-foreground mb-1">Browse Businesses</h1>
            <p className="text-sm md:text-lg text-muted-foreground">Discover salons, services, and more</p>
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

          {/* Mobile Filter Toggle */}
          <div className="md:hidden mb-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex-1 h-10 text-sm"
            >
              {showFilters ? '✕ Hide Filters' : '⚙ Show Filters'}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="flex-1 h-10 text-sm"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Filters and Sorting */}
          <div className={`mb-6 md:mb-8 transition-all duration-300 ${
            showFilters ? 'block' : 'hidden md:block'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">
              {/* Category Filter */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-foreground mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={String(cat)} value={String(cat)}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-foreground mb-2">Rating</label>
                <select
                  value={selectedRating}
                  onChange={e => setSelectedRating(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="all">All Ratings</option>
                  <option value="4.5">4.5+</option>
                  <option value="4">4.0+</option>
                  <option value="3">3.0+</option>
                </select>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-xs md:text-sm font-semibold text-foreground mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 md:px-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="rating">Highest Rating</option>
                  <option value="newest">Newest</option>
                </select>
              </div>

              {/* Clear Filters Button - Desktop */}
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={handleClearFilters}
                  className="hidden md:block px-4 h-10 text-sm"
                >
                  Clear Filters
                </Button>
              )}
            </div>
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
              <p className="text-sm md:text-base text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="px-4 md:px-6 text-sm md:text-base"
              >
                Clear Filters
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredBusinesses.map(business => (
                <Card
                  key={business.id}
                  className="border border-border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="p-4 md:p-6 flex-1 flex flex-col">
                    {/* Logo */}
                    {typeof business.logo === 'string' && business.logo && (
                      <div className="mb-3 md:mb-4 flex justify-center">
                        <div className="w-16 md:w-20 h-16 md:h-20 bg-muted rounded-lg flex items-center justify-center border border-border overflow-hidden">
                          <img 
                            src={business.logo} 
                            alt={business.name} 
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      </div>
                    )}

                    {/* Header */}
                    <div className="mb-2 md:mb-3">
                      <h3 className="text-base md:text-lg font-semibold text-foreground line-clamp-2">{business.name}</h3>
                      <p className="text-xs md:text-sm text-primary font-medium mt-1">{business.category}</p>
                    </div>

                    {/* Rating */}
                    {business.rating && (
                      <div className="flex items-center gap-1 mb-2 md:mb-3">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`w-3 md:w-3.5 h-3 md:h-3.5 ${
                              i < Math.round(business.rating || 0)
                                ? 'fill-primary text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ))}
                        <span className="ml-1 text-xs md:text-sm font-semibold text-foreground">
                          {business.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {/* Description */}
                    {business.description && (
                      <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4 line-clamp-2">
                        {business.description}
                      </p>
                    )}

                    {/* Contact Info */}
                    <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4 text-xs md:text-sm text-muted-foreground py-2 md:py-3 border-t border-border">
                      {business.address && (
                        <div className="flex items-start gap-2">
                          <MapPin className="w-3 md:w-3.5 h-3 md:h-3.5 flex-shrink-0 mt-0.5" />
                          <span className="line-clamp-2">
                            {business.address}, {business.city}
                          </span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3 md:w-3.5 h-3 md:h-3.5 flex-shrink-0" />
                          <a href={`tel:${business.phone}`} className="hover:text-primary transition-colors truncate">
                            {business.phone}
                          </a>
                        </div>
                      )}
                      {business.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-3 md:w-3.5 h-3 md:h-3.5 flex-shrink-0" />
                          <a
                            href={business.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate text-xs md:text-sm"
                          >
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Button */}
                    <Button
                      onClick={() => router.push(`/book/${business.id}`)}
                      className="w-full h-9 md:h-10 bg-primary text-primary-foreground hover:bg-primary/90 mt-auto text-sm md:text-base"
                    >
                      Book Appointment
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
