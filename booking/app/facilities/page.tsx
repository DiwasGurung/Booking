"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { toast } from "sonner" 

type Facility = {
  id: string
  name: string
  description: string
  category: string
  city: string
  price: number
  rating: number
  image?: string
}

export default function FacilitiesPage() {
  const [search, setSearch] = useState("")
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [filteredFacilities, setFilteredFacilities] = useState<Facility[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // fetch facilities from backend
  const fetchFacilities = async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/facilities") // create this API route in backend
      const data = await res.json()
      setFacilities(data)
      setFilteredFacilities(data)
    } catch (err) {
      toast.error("Failed to load facilities")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchFacilities()
  }, [])

  // filter facilities by search term
  useEffect(() => {
    if (!search) {
      setFilteredFacilities(facilities)
    } else {
      const filtered = facilities.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase()) ||
        f.city.toLowerCase().includes(search.toLowerCase()) ||
        f.category.toLowerCase().includes(search.toLowerCase())
      )
      setFilteredFacilities(filtered)
    }
  }, [search, facilities])

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Facilities</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name, city, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button
          onClick={() => setSearch("")}
          className="mt-3 md:mt-0 h-10"
          variant="secondary"
        >
          Clear
        </Button>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground">Loading facilities...</p>
      ) : filteredFacilities.length === 0 ? (
        <p className="text-center text-muted-foreground">No facilities found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((facility) => (
            <Card key={facility.id} className="p-4 flex flex-col">
              {facility.image && (
                <img
                  src={facility.image}
                  alt={facility.name}
                  className="w-full h-40 object-cover rounded-md mb-3"
                />
              )}
              <h3 className="text-lg font-bold">{facility.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">{facility.category}</p>
              <p className="text-sm mb-2">{facility.city}</p>
              <p className="text-sm font-medium mb-2">${facility.price}</p>
              <p className="text-sm">Rating: {facility.rating || "N/A"}</p>
              <Button
                className="mt-auto"
                onClick={() => toast(`Booking ${facility.name} clicked`)}
              >
                Book Now
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
