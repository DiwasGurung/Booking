'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { servicesApi } from '@/lib/api'
import { Loader, AlertCircle, Edit, Trash2, Plus, Copy, Check } from 'lucide-react'
import { useBusinessId } from '@/hooks/useBusinessId'
import { useSubscriptionUsage } from '@/hooks/useSusbcriptionUsage'

interface Service {
  id: string
  name: string
  description?: string
  price: number
  offerPrice?: number
  duration: number
  isActive: boolean
  capacity: number
}

interface BusinessHours {
  id: string
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function ServicesPage() {
  const router = useRouter()
  const { businessId, loading: fetchingBusinessId, error: businessIdError } = useBusinessId()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [offerPrice, setOfferPrice] = useState('')
  const [duration, setDuration] = useState('')
  const [description, setDescription] = useState('')
  const [capacity, setCapacity] = useState('1')
  const [isServiceActive, setIsServiceActive] = useState(true)
  const bookingUrl = businessId ? `${typeof window !== 'undefined' ? window.location.origin : ''}/book/${businessId}` : ''
  const [isSubmitting, setIsSubmitting] = useState(false)
   const { usage: subscriptionUsage } = useSubscriptionUsage(businessId)


  useEffect(() => {
    if (businessId) {
      loadServices()
    }
  }, [businessId])

  // Redirect to login if business ID error or not found
  useEffect(() => {
    if (!fetchingBusinessId && (businessIdError || !businessId)) {
      router.push('/login')
    }
  }, [fetchingBusinessId, businessIdError, businessId, router])

  const loadServices = async () => {
    if (!businessId) return
    try {
      setLoading(true)
      const response = await servicesApi.getBusinessServices(businessId)
      const rawData = response as any

      // API may return either an array or nested structure: { data: { data: Array } }
      const servicesArray = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData.data)
        ? rawData.data
        : Array.isArray(rawData.data?.data)
        ? rawData.data.data
        : []

      const servicesData = servicesArray.map((service: any) => ({
        id: service.id,
        name: service.name,
        description: service.description,
        price: service.price,
        offerPrice: service.offerPrice,
        duration: service.duration,
        isActive: service.isActive ?? true,
        capacity: service.capacity ?? 1,
      }))

      setServices(servicesData)
      setError(null)
    } catch (err: any) {
      const errorMessage = err?.message || 'Unknown error'
      setError(`Failed to load services: ${errorMessage}`)
      console.error('[v0] Error loading services:', err)
    } finally {
      setLoading(false)
    }
  }


  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id)
    setName(service.name)
    setPrice(String(service.price))
    setOfferPrice(service.offerPrice ? String(service.offerPrice) : '')
    setDuration(String(service.duration))
    setDescription(service.description || '')
    setCapacity(String(service.capacity))
    setIsServiceActive(service.isActive)
  }

  const resetServiceForm = () => {
    setEditingServiceId(null)
    setName('')
    setPrice('')
    setOfferPrice('')
    setDuration('')
    setDescription('')
    setCapacity('1')
    setIsServiceActive(true)
  }

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return
    try {
      await servicesApi.delete(id)
      loadServices()
    } catch (err) {
      setError('Failed to delete service')
      console.error('[v0] Error deleting service:', err)
    }
  }

  const createService = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!businessId || isSubmitting) return
    try {

      setIsSubmitting(true)

      const offerPriceNumber = offerPrice ? Number(offerPrice) : null
      const serviceData: any = {
        businessId,
        name,
        price: Number(price),
        duration: Number(duration),
        description,
        capacity: Number(capacity),
        isActive: isServiceActive,
        offerPrice: offerPriceNumber,
      }

      if (editingServiceId) {
        await servicesApi.update(editingServiceId, serviceData)
      } else {
        await servicesApi.create(serviceData)
      }

      resetServiceForm()
      loadServices()
    } catch (err) {
      setError('Failed to save service')
      console.error('[v0] Error saving service:', err)
    } finally {
      setIsSubmitting(false)
    }
  }
  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading || fetchingBusinessId) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8 flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </main>
      </div>
    )
  }

  if (businessIdError || error) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar userRole="BUSINESS_OWNER" />
        <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{businessIdError || error}</p>
          </div>
        </main>
      </div>
    )
  }

  if (!businessId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">No business found. Please contact support.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar userRole="BUSINESS_OWNER" />

      <main className="md:ml-64 pt-6 px-4 md:px-8 py-8">
        <Breadcrumbs
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Services & Hours' },
          ]}
        />
         {/* Services Usage Card */}
        {subscriptionUsage && (
          <Card className="mb-8 bg-gradient-to-br from-green-50 to-green-50/50 border-green-200">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm">Services Available</CardTitle>
                  <CardDescription className="mt-1">
                    {subscriptionUsage.serviceUnlimited ? 'Unlimited services' : `${subscriptionUsage.serviceCurrent} service available`}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">{subscriptionUsage.serviceCurrent}</p>
                  <p className="text-xs text-muted-foreground">Service{subscriptionUsage.serviceCurrent !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}


        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-destructive">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Services & Hours</h1>
          <p className="text-muted-foreground">Manage your services and business hours</p>
        </div>

        {/* Booking URL Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Booking Page URL</CardTitle>
            <CardDescription>Share this link with customers to book appointments</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Input value={bookingUrl} readOnly className="flex-1" />
            <Button
              type="button"
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Services Section */}
        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* Service Form */}
          <Card>
            <CardHeader>
              <CardTitle>{editingServiceId ? 'Edit Service' : 'Add Service'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={createService} className="space-y-4">
                <Input
                  placeholder="Service name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />

                <Input
                  type="number"
                  placeholder="Price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  step="0.01"
                  required
                />

                <Input
                  type="number"
                  placeholder="Offer Price (optional)"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  step="0.01"
                />

                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />

                {/* <Input
                  type="number"
                  placeholder="Capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                /> */}

                <Textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="active"
                    checked={isServiceActive}
                    onCheckedChange={(checked) => setIsServiceActive(checked as boolean)}
                  />
                  <Label htmlFor="active" className="font-normal cursor-pointer">
                    Active
                  </Label>
                </div>

                <Button type="submit" disabled={ isSubmitting} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  {editingServiceId ? 'Update Service' : 'Add Service'}
                </Button>

                {editingServiceId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={resetServiceForm}
                  >
                    Cancel
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Services List */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Services List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No services yet. Add your first service!</p>
              ) : (
                services.map((service) => (
                  <div
                    key={service.id}
                    className="border border-border p-4 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {service.duration} min • Capacity {service.capacity}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(service)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteService(service.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                      {service.offerPrice ? (
                        <>
                          <Badge variant="destructive" className="text-xs">
                            Save {Math.round(((service.price - service.offerPrice) / service.price) * 100)}%
                          </Badge>
                          <Badge variant="outline" className="line-through">
                            Rs.{service.price.toFixed(2)}
                          </Badge>
                          <Badge className="bg-accent text-accent-foreground">
                            Rs.{service.offerPrice.toFixed(2)}
                          </Badge>
                        </>
                      ) : (
                        <Badge>Rs.{service.price.toFixed(2)}</Badge>
                      )}
                      <Badge variant={service.isActive ? 'default' : 'secondary'}>
                        {service.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-2">{service.description}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>


      </main>
    </div>
  )
}

