'use client'

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Loader2, Copy, Check } from "lucide-react"
import { usersApi, businessApi, servicesApi, businessHoursApi } from "@/lib/api"

interface Business {
  id: string
  name: string
  slug?: string | null
  description?: string
  email: string
  phone: string
  website?: string
  category: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  logo?: string
  coverImage?: string
  isVerified: boolean
  isActive: boolean
  rating: number
}

interface Service {
  id: string
  name: string
  description?: string
  price: number
  offerPrice?: number
  duration: number
  image?: string
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

const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

export default function BusinessPage() {
  const router = useRouter()

  const [user, setUser] = useState<{ id: string } | null>(null)
  const [business, setBusiness] = useState<Business | null>(null)
  const [services, setServices] = useState<Service[]>([])
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [loading, setLoading] = useState(true)

  // Editing state
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null)

  // Service form
  const [name, setName] = useState("")
  const [price, setPrice] = useState("")
  const [offerPrice, setOfferPrice] = useState("")
  const [duration, setDuration] = useState("")
  const [description, setDescription] = useState("")
  const [capacity, setCapacity] = useState("1")
  const [isServiceActive, setIsServiceActive] = useState(true)

  // Hours form
  const [dayOfWeek, setDayOfWeek] = useState("0")
  const [openTime, setOpenTime] = useState("09:00")
  const [closeTime, setCloseTime] = useState("17:00")
  const [isClosed, setIsClosed] = useState(false)

  // Booking URL
  const [copied, setCopied] = useState(false)
  const bookingUrl =
    typeof window !== "undefined" && business
      ? `${window.location.origin}/book/${business.slug ?? business.id}`
      : ""

  // Fetch logged-in user from cookie
  useEffect(() => {
    async function fetchUser() {
      const res = await usersApi.getCurrentUser()
      const u = (res.data as any)?.user ?? res.data

      if (!res.success || !u?.id) {
        router.push("/login")
        return
      }
      setUser({ id: u.id })
    }

    fetchUser()
  }, [router])

  // Fetch business for this user
  useEffect(() => {
    if (!user) return
    fetchBusiness()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  useEffect(() => {
    if (business?.id) {
      fetchServices()
      fetchHours()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id])

  async function fetchBusiness() {
    if (!user) return
    const res = await businessApi.getByUserId(user.id)

    if (res.success && res.data) {
      setBusiness(res.data as unknown as Business)
    }
    setLoading(false) // always stop the spinner, even on failure
  }

  async function fetchServices() {
    if (!business?.id) return
    const res = await servicesApi.getBusinessServices(business.id)
    setServices(Array.isArray(res.data) ? (res.data as unknown as Service[]) : [])
  }

  async function fetchHours() {
    if (!business?.id) return
    const res = await businessHoursApi.getBusinessHours(business.id)
    setHours(Array.isArray(res.data) ? (res.data as unknown as BusinessHours[]) : [])
  }

  function handleEditClick(service: Service) {
    setEditingServiceId(service.id)
    setName(service.name)
    setPrice(String(service.price))
    setOfferPrice(service.offerPrice ? String(service.offerPrice) : "")
    setDuration(String(service.duration))
    setDescription(service.description || "")
    setCapacity(String(service.capacity))
    setIsServiceActive(service.isActive)
  }

  function resetServiceForm() {
    setEditingServiceId(null)
    setName("")
    setPrice("")
    setOfferPrice("")
    setDuration("")
    setDescription("")
    setCapacity("1")
    setIsServiceActive(true)
  }

  async function createService(e: React.FormEvent) {
    e.preventDefault()

    const serviceData: any = {
      businessId: business?.id,
      name,
      price: Number(price),
      duration: Number(duration),
      description,
      capacity: Number(capacity),
      isActive: isServiceActive,
    }

    if (offerPrice) {
      serviceData.offerPrice = Number(offerPrice)
    }

    const res = editingServiceId
      ? await servicesApi.update(editingServiceId, serviceData)
      : await servicesApi.create(serviceData)

    if (!res.success) {
      console.error("Failed to save service:", res.error)
      return // keep the form filled so nothing is lost
    }

    resetServiceForm()
    fetchServices()
  }

  async function createHours(e: React.FormEvent) {
    e.preventDefault()

    const res = await businessHoursApi.setBusinessHours({
      businessId: business?.id,
      dayOfWeek: Number(dayOfWeek),
      openTime,
      closeTime,
      isClosed,
    })

    if (res.success) fetchHours()
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl p-6 space-y-8">

        {/* HEADER */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h1 className="text-4xl font-bold">{business?.name}</h1>
            {business?.isVerified && (
              <Badge className="bg-green-600 text-white">Verified</Badge>
            )}
          </div>
        </div>

        {/* BOOKING URL SECTION */}
        <Card>
          <CardHeader>
            <CardTitle>Booking Page URL</CardTitle>
            <CardDescription>
              Share this link with customers so they can book appointments
            </CardDescription>
          </CardHeader>

          <CardContent className="flex gap-2">
            <Input value={bookingUrl} readOnly />

            <Button
              type="button"
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* SERVICES + FORM */}
        <div className="grid gap-6 lg:grid-cols-3">

          {/* FORM */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editingServiceId ? "Edit Service" : "Add Service"}
              </CardTitle>
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
                  required
                />

                <Input
                  type="number"
                  placeholder="Offer Price"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                />

                <Input
                  type="number"
                  placeholder="Duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                />

                <Input
                  type="number"
                  placeholder="Capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                />

                <Textarea
                  placeholder="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />

                <Button type="submit" className="w-full">
                  {editingServiceId ? "Update Service" : "Add Service"}
                </Button>

                {editingServiceId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={resetServiceForm}
                  >
                    Cancel Edit
                  </Button>
                )}

              </form>
            </CardContent>
          </Card>

          {/* SERVICES LIST */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">

              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => handleEditClick(service)}
                  className="border p-3 rounded-lg cursor-pointer hover:bg-secondary/40"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration} min • Capacity {service.capacity}
                      </p>
                    </div>

                    {service.offerPrice ? (
                      <>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            Save {Math.round(((service.price - service.offerPrice) / service.price) * 100)}%
                          </Badge>
                          <Badge variant="secondary" className="text-base line-through text-muted-foreground">
                            ${service.price.toFixed(2)}
                          </Badge>
                        </div>
                        <Badge variant="secondary" className="text-base bg-green-600">
                          ${service.offerPrice.toFixed(2)}
                        </Badge>
                      </>
                    ) : (
                      <Badge variant="secondary" className="text-base">
                        ${service.price.toFixed(2)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}

            </CardContent>
          </Card>

          {/* Business Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Hours</CardTitle>
              <CardDescription>Set your operating hours</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={createHours} className="space-y-4 p-4 rounded-lg bg-secondary/20 border border-border">
                <div className="space-y-2">
                  <Label htmlFor="day-select">Day of Week</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger id="day-select">
                      <SelectValue placeholder="Select a day" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day, i) => (
                        <SelectItem key={i} value={String(i)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label htmlFor="open-time">Opening Time</Label>
                    <Input
                      id="open-time"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close-time">Closing Time</Label>
                    <Input
                      id="close-time"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="closed"
                    checked={isClosed}
                    onCheckedChange={(checked) => setIsClosed(checked as boolean)}
                  />
                  <Label htmlFor="closed" className="font-normal cursor-pointer">
                    Closed on this day
                  </Label>
                </div>

                <Button type="submit" className="w-full">
                  Save Hours
                </Button>
              </form>

              {hours.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hours set yet</p>
              ) : (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Current Hours</h3>
                  <div className="space-y-2">
                    {hours.map((h) => (
                      <div
                        key={h.id}
                        className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                      >
                        <span className="font-medium text-foreground">{days[h.dayOfWeek]}</span>
                        <span className="text-sm text-muted-foreground">
                          {h.isClosed ? "Closed" : `${h.openTime} - ${h.closeTime}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>

      </div>
    </main>
  )
}