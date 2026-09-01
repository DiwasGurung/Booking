'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Star, MapPin, Phone, Mail, Clock, ArrowLeft, Heart, Share2 } from 'lucide-react'
import { businessApi, servicesApi } from '@/lib/api'
import type { Business as ApiBusiness } from '@/lib/api'

interface Business extends ApiBusiness {
  logo: any
  reviewCount: number
  address: string
  city: string
  phone: string
  email: string
}

export default function BusinessDetailPage() {
  const params = useParams()
  const router = useRouter()
  const businessId = params.businessId as string

  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFavorite, setIsFavorite] = useState(false)

  useEffect(() => {
    loadBusinessDetails()
  }, [businessId])

  const loadBusinessDetails = async () => {
    try {
      setLoading(true)
      const [businessRes, servicesRes] = await Promise.all([
        businessApi.getBusinessById(businessId),
        servicesApi.getBusinessServices(businessId),
      ])

      const businessData = businessRes.data ? {
        ...businessRes.data,
        logo: businessRes.data.logo || null,
        address: String(businessRes.data.address || ''),
        city: String(businessRes.data.city || ''),
      } : null
      setBusiness(businessData as Business)
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : (servicesRes.data as any)?.services || [])
      setError(null)
    } catch (err) {
      setError('Failed to load business details')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (error || !business) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <Button variant="outline" className="mb-6 bg-transparent" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="border border-border shadow-lg p-8 text-center">
            <p className="text-lg font-semibold text-foreground">{error || 'Business not found'}</p>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/30 p-4 md:p-8">
      <div className="mx-auto max-w-5xl">
        <Button variant="outline" className="mb-6 bg-transparent" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Search
        </Button>

        <Card className="border border-border shadow-lg p-8 mb-6">
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="w-full md:w-48 h-48 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
              {business.logo ? (
                <img src={business.logo} alt={business.name} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <div className="text-6xl font-bold text-primary/30">{business.name.charAt(0)}</div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-4xl font-bold text-foreground mb-2">{business.name}</h1>
                  <p className="text-muted-foreground mb-4">{business.description}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="ghost" onClick={() => setIsFavorite(!isFavorite)}>
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                  </Button>
                  <Button size="icon" variant="ghost">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-4">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(business.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-foreground">{business.rating || 'N/A'}</span>
                <span className="text-sm text-muted-foreground">({business.reviewCount || 0} reviews)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{business.address}, {business.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  <a href={`tel:${business.phone}`} className="text-sm text-primary hover:underline">
                    {business.phone}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href={`mailto:${business.email}`} className="text-sm text-primary hover:underline">
                    {business.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-secondary/20 rounded-lg">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">Open 9:00 AM - 6:00 PM</span>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="services" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="space-y-4">
            {services.length === 0 ? (
              <Card className="border border-border shadow-lg p-8 text-center">
                <p className="text-muted-foreground">No services available</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                  <Card key={service.id} className="border border-border shadow-lg p-6 hover:shadow-xl transition">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-lg text-foreground">{service.name}</h3>
                      <Badge className="bg-primary text-primary-foreground">${service.price}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{service.description}</p>
                    <div className="flex justify-between items-center text-sm text-muted-foreground">
                      <span>{service.duration} mins</span>
                      <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                        Book Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card className="border border-border shadow-lg p-6">
              <p className="text-muted-foreground text-center">Reviews coming soon</p>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-4">
            <Card className="border border-border shadow-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">About {business.name}</h3>
              <p className="text-foreground mb-6">{business.description}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-foreground mb-3">Contact Information</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground">Email: <a href={`mailto:${business.email}`} className="text-primary hover:underline">{business.email}</a></p>
                    <p className="text-foreground">Phone: <a href={`tel:${business.phone}`} className="text-primary hover:underline">{business.phone}</a></p>
                    <p className="text-foreground">Address: {business.address}, {business.city}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-foreground mb-3">Business Hours</h4>
                  <div className="space-y-2 text-sm">
                    <p className="text-foreground">Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p className="text-foreground">Saturday: 10:00 AM - 4:00 PM</p>
                    <p className="text-foreground">Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
