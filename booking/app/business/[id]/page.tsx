import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Fraunces, Inter } from 'next/font/google'
import {
  MapPin,
  Phone,
  Globe,
  Star,
  CheckCircle2,
  ChevronLeft,
  Clock,
  ArrowUpRight,
  CalendarCheck,
} from 'lucide-react'
import { businessApi, servicesApi, type Business, type Service } from '@/lib/api'
import { OpenStatus } from '@/components/OpenStatus'
import { HoursTable } from '@/components/HoursTable'
import { BusinessMap } from '@/components/BusinessMap'

const fraunces = Fraunces({ subsets: ['latin'], weight: ['400', '500', '600'] })
const inter = Inter({ subsets: ['latin'], weight: ['400', '500', '600'] })

interface BusinessHour {
  dayOfWeek: number
  openTime: string
  closeTime: string
  isClosed: boolean
}

type BusinessDetail = Business & {
  hours?: BusinessHour[]
  services?: (Service & { isActive?: boolean })[]
  latitude?: number | string | null
  longitude?: number | string | null
}

interface PageProps {
  params: Promise<{ id: string }>
}

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

function toCoord(v: unknown, min: number, max: number): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) && n >= min && n <= max ? n : null
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

  const lat = toCoord(business.latitude, -90, 90)
  const lng = toCoord(business.longitude, -180, 180)
  const hasCoords = lat !== null && lng !== null

  const mapsHref = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : address || city
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([name, address, city].filter(Boolean).join(', '))}`
      : undefined

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
    geo: hasCoords ? { '@type': 'GeoCoordinates', latitude: lat, longitude: lng } : undefined,
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
    <div className={`${inter.className} min-h-screen bg-background text-foreground pb-28 md:pb-0`}>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back navigation */}
      <div className="mx-auto max-w-5xl px-4 md:px-8 pt-5">
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to search
        </Link>
      </div>

      {/* Hero */}
      <div className="mx-auto max-w-5xl px-4 md:px-8 mt-4">
        <div className="relative overflow-hidden rounded-2xl bg-foreground">
          <div
            className="relative h-56 md:h-72 w-full"
            style={
              coverUrl
                ? { backgroundImage: `url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : undefined
            }
          >
            {!coverUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-foreground to-foreground" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/80 to-transparent" />
          </div>

          <div className="relative px-5 md:px-9 pb-7 -mt-16 md:-mt-20">
            <div className="h-24 w-24 md:h-28 md:w-28 rounded-2xl bg-primary text-primary-foreground ring-4 ring-foreground shadow-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
              ) : (
                <span className={`${fraunces.className} text-3xl font-medium`}>{getInitials(name)}</span>
              )}
            </div>

            <div className="mt-5 flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className={`${fraunces.className} text-3xl md:text-4xl font-medium text-background leading-tight`}>
                    {name}
                  </h1>
                  {business.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Verified
                    </span>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-background/70">
                  {category && <span>{category}</span>}
                  {rating && (
                    <span className="inline-flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                      {rating.toFixed(1)}
                    </span>
                  )}
                  {hours.length > 0 && <OpenStatus hours={hours} />}
                </div>

                {(address || city) && (
                  <p className="mt-3 flex items-start gap-1.5 text-sm text-background/70">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {[address, city].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>

              <Link
                href={`/book/${business.id}`}
                className="hidden md:inline-flex items-center gap-2 rounded-lg bg-primary text-primary-foreground px-5 py-3 font-medium hover:bg-primary/90 transition-colors flex-shrink-0"
              >
                <CalendarCheck className="h-4 w-4" />
                Book an appointment
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {business.phone && (
                
                 <a href={`tel:${business.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-background/20 px-3 py-1.5 text-sm text-background/80 hover:bg-background/10 hover:text-background transition-colors"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </a>
              )}
              {mapsHref && (
                
                <a  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-background/20 px-3 py-1.5 text-sm text-background/80 hover:bg-background/10 hover:text-background transition-colors"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Directions
                </a>
              )}
              {website && (
                
                 <a href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-background/20 px-3 py-1.5 text-sm text-background/80 hover:bg-background/10 hover:text-background transition-colors"
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
        <div className="sticky top-0 z-30 mt-8 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="mx-auto max-w-5xl px-4 md:px-8 flex gap-7 overflow-x-auto">
            {tabs.map((t) => (
              
               <a key={t.id}
                href={`#${t.id}`}
                className="whitespace-nowrap py-3.5 text-sm text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
              >
                {t.label}
              </a>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 md:px-8 py-10">
        <div className="md:grid md:grid-cols-[280px_1fr] md:gap-12">
          {/* Sticky quick-facts panel */}
          <aside className="hidden md:block">
            <div className="sticky top-24 space-y-5">
              {(address || city || business.phone || website) && (
                <div className="rounded-xl border border-border p-5 space-y-4">
                  {(address || city) && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                      <p className="text-sm text-muted-foreground">{[address, city].filter(Boolean).join(', ')}</p>
                    </div>
                  )}
                  {business.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      
                      <a  href={`tel:${business.phone}`}
                        className="text-sm text-foreground hover:text-primary transition-colors"
                      >
                        {business.phone}
                      </a>
                    </div>
                  )}
                  {website && (
                    <div className="flex items-center gap-3">
                      <Globe className="h-4 w-4 text-primary shrink-0" />
                      
                       <a href={website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground hover:text-primary transition-colors truncate"
                      >
                        {website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
              )}
              <Link
                href={`/book/${business.id}`}
                className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-medium hover:bg-primary/90 transition-colors"
              >
                <CalendarCheck className="h-4 w-4" />
                Book an appointment
              </Link>
            </div>
          </aside>

          {/* Flowing content */}
          <div className="space-y-12">
            {description && (
              <section id="overview" className="scroll-mt-24">
                <h2 className={`${fraunces.className} text-xl font-medium text-foreground mb-3`}>Overview</h2>
                <p className="max-w-[62ch] text-muted-foreground leading-relaxed">{description}</p>
              </section>
            )}

            <section id="services" className="scroll-mt-24">
              <h2 className={`${fraunces.className} text-xl font-medium text-foreground mb-5`}>Services</h2>
              {services.length === 0 ? (
                <p className="text-sm text-muted-foreground">No services listed yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {services.map((s) => (
                    <div key={s.id} className="py-4">
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <p className="font-medium text-foreground">{s.name}</p>
                        <span className="min-w-[1.5rem] flex-1 border-b border-dotted border-border" />
                        <p className="font-medium text-primary flex-shrink-0">
                          Rs {(s.offerPrice ?? s.price).toFixed(0)}
                        </p>
                      </div>
                      {s.offerPrice && (
                        <p className="text-xs text-muted-foreground line-through">Rs {s.price.toFixed(0)}</p>
                      )}
                      {s.description && (
                        <p className="mt-1.5 max-w-[56ch] text-sm text-muted-foreground line-clamp-2">{s.description}</p>
                      )}
                      <p className="mt-1 text-xs text-muted-foreground">{s.duration} min</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {hours.length > 0 && (
              <section id="hours" className="scroll-mt-24">
                <h2 className={`${fraunces.className} flex items-center gap-2 text-xl font-medium text-foreground mb-5`}>
                  <Clock className="h-4 w-4" />
                  Hours
                </h2>
                <HoursTable hours={hours} />
              </section>
            )}

            {mapsHref && (
              <section id="location" className="scroll-mt-24">
                <h2 className={`${fraunces.className} text-xl font-medium text-foreground mb-5`}>Location</h2>
                <div className="space-y-3">
                  {hasCoords && <BusinessMap lat={lat!} lng={lng!} />}
                  <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
                    <p className="text-sm text-muted-foreground">{[address, city].filter(Boolean).join(', ')}</p>
                    
                     <a href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 flex-shrink-0 text-sm font-medium text-primary hover:underline"
                    >
                      Get directions <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>
      </div>

      {/* Mobile sticky book bar */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm p-3 md:hidden"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
      >
        <Link
          href={`/book/${business.id}`}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 font-medium hover:bg-primary/90 transition-colors"
        >
          <CalendarCheck className="h-4 w-4" />
          Book an appointment
        </Link>
      </div>
    </div>
  )
}
