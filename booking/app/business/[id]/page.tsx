import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Phone,
  Globe,
  Star,
  CheckCircle2,
  ChevronLeft,
  Clock,
} from 'lucide-react'
import { businessApi, servicesApi, type Business, type Service } from '@/lib/api'

interface BusinessHour {
  dayOfWeek: number // 0 = Sunday, matching JS Date.getDay() — confirm this matches your backend
  openTime: string
  closeTime: string
  isClosed: boolean
}

type BusinessDetail = Business & {
  hours?: BusinessHour[]
  services?: (Service & { isActive?: boolean })[]
}

interface PageProps {
  params: Promise<{ id: string }>
}

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

async function getBusiness(id: string): Promise<BusinessDetail | null> {
  const res = await businessApi.getPublic(id)
  if (!res.success || !res.data) return null
  return res.data as BusinessDetail
}

async function getServices(businessId: string): Promise<Service[]> {
  const res = await servicesApi.getActiveServices(businessId)
  return Array.isArray(res.data) ? res.data : []
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

function formatTime(time: string) {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return m === 0 ? `${hour12} ${period}` : `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

function getOpenStatus(hours: BusinessHour[] | undefined) {
  if (!hours || hours.length === 0) return null
  const now = new Date()
  const today = hours.find((h) => h.dayOfWeek === now.getDay())
  if (!today || today.isClosed) return { open: false, today }
  const [openH, openM] = today.openTime.split(':').map(Number)
  const [closeH, closeM] = today.closeTime.split(':').map(Number)
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const open = minutesNow >= openH * 60 + openM && minutesNow < closeH * 60 + closeM
  return { open, today }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const business = await getBusiness(id)

  if (!business) {
    return { title: 'Business Not Found' }
  }

  const name = String(business.name)
  const city = business.city ? String(business.city) : ''
  const category = business.category ? String(business.category) : ''
  const description = business.description
    ? String(business.description)
    : `Book an appointment with ${name}${category ? `, a ${category} business` : ''}${city ? ` in ${city}` : ''}. View services, hours, and contact details.`

  const title = `${name}${city ? ` – Book an Appointment in ${city}` : ' – Book an Appointment'}`
  const siteUrl = 'https://appoint-nepal.com'
  const canonical = `/business/${business.id}`
  const logoUrl = typeof business.logo === 'string' ? business.logo : undefined

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${siteUrl}${canonical}`,
      images: logoUrl ? [{ url: logoUrl }] : undefined,
    },
    twitter: {
      card: logoUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: logoUrl ? [logoUrl] : undefined,
    },
  }
}

export async function generateStaticParams() {
  const res = await businessApi.getAll()
  const list: Business[] = Array.isArray(res.data)
    ? res.data
    : Array.isArray((res.data as any)?.businesses)
      ? (res.data as any).businesses
      : []
  return list.map((b) => ({ id: String(b.id) }))
}

export const revalidate = 3600

export default async function PublicBusinessPage({ params }: PageProps) {
  const { id } = await params
  const business = await getBusiness(id)
  if (!business) notFound()

  const services = (business.services ?? []).filter((s) => s.isActive !== false)

  const name = String(business.name)
  const city = business.city ? String(business.city) : ''
  const address = business.address ? String(business.address) : ''
  const category = business.category ? String(business.category) : ''
  const description = business.description ? String(business.description) : ''
  const logoUrl = typeof business.logo === 'string' ? business.logo : undefined
  const coverUrl = typeof business.coverImage === 'string' ? business.coverImage : undefined
  const website = typeof business.website === 'string' ? business.website : undefined
  const rating = typeof business.rating === 'number' && business.rating > 0 ? business.rating : undefined

  const hours = [...(business.hours || [])].sort((a, b) => a.dayOfWeek - b.dayOfWeek)
  const status = getOpenStatus(hours)
  const mapsHref =
  (business as any).mapsUrl ||
  (address || city
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address, city].filter(Boolean).join(', '))}`
    : undefined)

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description: description || undefined,
    image: logoUrl || undefined,
    telephone: business.phone || undefined,
    url: website || undefined,
    address: address || city
      ? { '@type': 'PostalAddress', streetAddress: address || undefined, addressLocality: city || undefined }
      : undefined,
    aggregateRating: rating
      ? { '@type': 'AggregateRating', ratingValue: rating, bestRating: 5 }
      : undefined,
  }

  const tabs = [
    description ? { id: 'overview', label: 'Overview' } : null,
    { id: 'services', label: 'Services' },
    hours.length > 0 ? { id: 'hours', label: 'Hours' } : null,
    mapsHref ? { id: 'location', label: 'Location' } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back navigation */}
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-4">
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to search
        </Link>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-3xl px-4 md:px-8 pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <div
            className="h-28 md:h-36 w-full bg-gradient-to-br from-primary/20 via-primary/5 to-transparent"
            style={
              coverUrl
                ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          />
          <div className="bg-card px-5 md:px-7 pb-6">
            <div className="flex items-end gap-4 -mt-10">
              <div className="h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-primary text-primary-foreground shadow-md ring-4 ring-card flex items-center justify-center overflow-hidden flex-shrink-0">
                {logoUrl ? (
                  <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl md:text-3xl font-semibold">{getInitials(name)}</span>
                )}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">{name}</h1>
                  {business.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {category && (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                      {category}
                    </span>
                  )}
                  {rating && (
                    <span className="inline-flex items-center gap-1 text-sm text-foreground">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                  {status && (
                    <span className={`text-xs font-medium ${status.open ? 'text-primary' : 'text-muted-foreground'}`}>
                      {status.open ? 'Open now' : 'Closed now'}
                    </span>
                  )}
                </div>

                {(address || city) && (
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {[address, city].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <Link
                href={`/book/${business.id}`}
                className="hidden md:inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-5 py-2.5 font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                Book an appointment
              </Link>
            </div>

            {/* Quick actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              {business.phone && (
                
                 <a href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
              {mapsHref && (
                
                 <a href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Directions
                </a>
              )}
              {website && (
                
                   <a href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-foreground hover:bg-secondary/50 transition-colors"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Section tabs */}
      {tabs.length > 1 && (
        <div className="sticky top-0 z-30 mt-6 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-3xl px-4 md:px-8 flex gap-6 overflow-x-auto">
            {tabs.map((t) => (
              
               <a key={t.id}
                href={`#${t.id}`}
                className="whitespace-nowrap py-3 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 md:px-8 py-8 space-y-10">
        {description && (
          <section id="overview" className="scroll-mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-3">Overview</h2>
            <p className="text-muted-foreground leading-relaxed">{description}</p>
          </section>
        )}

        <section id="services" className="scroll-mt-16">
          <h2 className="text-lg font-semibold text-foreground mb-3">Services</h2>
          {services.length === 0 ? (
            <p className="text-sm text-muted-foreground">No services listed yet.</p>
          ) : (
            <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between gap-4 p-4 bg-card">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{s.name}</p>
                    {s.description && (
                      <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">{s.duration} min</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.offerPrice ? (
                      <>
                        <p className="text-xs text-muted-foreground line-through">Rs {s.price.toFixed(0)}</p>
                        <p className="font-semibold text-foreground">Rs {s.offerPrice.toFixed(0)}</p>
                      </>
                    ) : (
                      <p className="font-semibold text-foreground">Rs {s.price.toFixed(0)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {hours.length > 0 && (
          <section id="hours" className="scroll-mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours
            </h2>
            <div className="rounded-xl border border-border overflow-hidden">
              {hours.map((h) => {
                const isToday = h.dayOfWeek === new Date().getDay()
                return (
                  <div
                    key={h.dayOfWeek}
                    className={`flex items-center justify-between px-4 py-2.5 text-sm ${
                      isToday ? 'bg-primary/5 font-medium text-foreground' : 'text-muted-foreground'
                    } ${h.dayOfWeek !== 6 ? 'border-b border-border' : ''}`}
                  >
                    <span>{DAY_LABELS[h.dayOfWeek]}</span>
                    <span>{h.isClosed ? 'Closed' : `${formatTime(h.openTime)} – ${formatTime(h.closeTime)}`}</span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {mapsHref && (
          <section id="location" className="scroll-mt-16">
            <h2 className="text-lg font-semibold text-foreground mb-3">Location</h2>
            <div className="rounded-xl border border-border p-4 bg-card flex items-start justify-between gap-4">
              <p className="text-sm text-muted-foreground">{[address, city].filter(Boolean).join(', ')}</p>
              
               <a href={mapsHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 text-sm font-medium text-primary hover:underline"
              >
                Get directions
              </a>
            </div>
          </section>
        )}
      </div>

      {/* Mobile sticky book bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm p-3 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Link
          href={`/book/${business.id}`}
          className="flex items-center justify-center rounded-lg bg-primary text-primary-foreground py-3 font-medium"
        >
          Book an appointment
        </Link>
      </div>
    </div>
  )
}