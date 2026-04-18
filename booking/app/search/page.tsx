'use client'

import React, { useEffect, useState } from "react"
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Search, MapPin, Phone, Globe, Loader, AlertCircle, Star, Filter, ArrowUpDown } from 'lucide-react'
import { businessApi, type Business } from '@/lib/api'
import { useRoleProtection } from '@/hooks/useRoleProtection'

export default function SearchPage() {
  const router = useRouter()
  const { loading: authLoading } = useRoleProtection({ requiredRole: 'CUSTOMER' })
  const [query, setQuery] = useState('')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  
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

  // Filter and sort businesses when filters change
  useEffect(() => {
    applyFiltersAndSort()
  }, [businesses, query, selectedCategory, selectedRating, sortBy])

  const loadAllBusinesses = async () => {
    try {
      setLoading(true)
      const response = await businessApi.getAll()
      const data = Array.isArray(response.data) ? response.data : (response.data as any)?.businesses || []
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

    // Apply search query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase()
      filtered = filtered.filter(b =>
        b.name.toLowerCase().includes(lowerQuery) ||
        (typeof b.category === 'string' ? b.category.toLowerCase().includes(lowerQuery) : false) ||
        (typeof b.description === 'string' ? b.description.toLowerCase().includes(lowerQuery) : false) ||
        (typeof b.city === 'string' ? b.city.toLowerCase().includes(lowerQuery) : false)
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Browse Businesses</h1>
          <p className="text-lg text-muted-foreground">Discover salons, services, and more in your area</p>
        </div>

        {/* Search Bar */}
        <Card className="border border-border shadow-lg backdrop-blur-sm mb-8">
          <form onSubmit={handleSearch} className="p-6 md:p-8">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name, category, or location..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  className="h-12 pl-10 text-base border-2 border-border focus:border-primary transition-colors"
                />
              </div>
              <Button
                type="submit"
                className="px-8 h-12 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Search
              </Button>
            </div>
          </form>
        </Card>

        {/* Filters and Sorting */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-end">
          {/* Category Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-foreground mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={String(cat)} value={String(cat)}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Rating Filter */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-foreground mb-2">Minimum Rating</label>
            <select
              value={selectedRating}
              onChange={e => setSelectedRating(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="all">All Ratings</option>
              <option value="4.5">4.5+ Stars</option>
              <option value="4">4+ Stars</option>
              <option value="3">3+ Stars</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex-1">
            <label className="block text-sm font-semibold text-foreground mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:border-primary focus:outline-none transition-colors"
            >
              <option value="name">Name (A-Z)</option>
              <option value="rating">Highest Rating</option>
              <option value="newest">Newest</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          {(query || selectedCategory !== 'all' || selectedRating !== 'all') && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="px-6 h-11"
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Results Count */}
        {!loading && (
          <div className="mb-6 text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{filteredBusinesses.length}</span> of{' '}
            <span className="font-semibold text-foreground">{businesses.length}</span> businesses
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading businesses...</p>
            </div>
          </div>
        ) : filteredBusinesses.length === 0 ? (
          <Card className="border border-border shadow-lg p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-foreground mb-2">No Businesses Found</p>
            <p className="text-muted-foreground mb-6">Try adjusting your filters or search terms</p>
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="px-6"
            >
              Clear Filters
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map(business => (
              <Card
                key={business.id}
                className="border border-border shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
              >
                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="mb-3">
                    <h3 className="text-lg font-semibold text-foreground line-clamp-2">{business.name}</h3>
                    <p className="text-xs text-primary font-medium mt-1">{business.category}</p>
                  </div>

                  {/* Rating */}
                  {business.rating && (
                    <div className="flex items-center gap-1 mb-3">
                      {Array.from({ length: 5 }, (_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(business.rating || 0)
                              ? 'fill-primary text-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-xs font-semibold text-foreground">
                        {business.rating.toFixed(1)}
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  {business.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {business.description}
                    </p>
                  )}

                  {/* Contact Info */}
                  <div className="space-y-2 mb-4 text-xs text-muted-foreground py-3 border-t border-border">
                    {business.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {business.address}, {business.city}
                        </span>
                      </div>
                    )}
                    {business.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                        <a href={`tel:${business.phone}`} className="hover:text-primary transition-colors">
                          {business.phone}
                        </a>
                      </div>
                    )}
                    {business.website && (
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                        <a
                          href={business.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate"
                        >
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Button */}
                  <Button
                    onClick={() => router.push(`/book/${business.id}`)}
                    className="w-full h-10 bg-primary text-primary-foreground hover:bg-primary/90 mt-auto"
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
  )
}
