import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, Phone, Globe, Star, Building2 } from 'lucide-react'
import { businessApi, servicesApi, type Business, type Service } from '@/lib/api'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getBusiness(id: string): Promise<Business | null> {
  const res = await businessApi.getBusinessById(id)
  if (!res.success || !res.data) return null
  return res.data
}

async function getServices(businessId: string): Promise<Service[]> {
  const res = await servicesApi.getActiveServices(businessId)
  return Array.isArray(res.data) ? res.data : []
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

// Pre-render known businesses at build time; new ones still render on-demand
export async function generateStaticParams() {
  const res = await businessApi.getAll()
  const list: Business[] = Array.isArray(res.data)
    ? res.data
    : Array.isArray((res.data as any)?.businesses)
      ? (res.data as any).businesses
      : []
  return list.map((b) => ({ id: String(b.id) }))
}

export const revalidate = 3600 // re-check for updates hourly (ISR)

export default async function PublicBusinessPage({ params }: PageProps) {
  const { id } = await params
  const business = await getBusiness(id)
  if (!business) notFound()

  const services = await getServices(business.id)

  const name = String(business.name)
  const city = business.city ? String(business.city) : ''
  const address = business.address ? String(business.address) : ''
  const category = business.category ? String(business.category) : ''
  const description = business.description ? String(business.description) : ''
  const logoUrl = typeof business.logo === 'string' ? business.logo : undefined
  const website = typeof business.website === 'string' ? business.website : undefined
  const rating = typeof business.rating === 'number' ? business.rating : undefined

  const jsonLd: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description: description || undefined,
    image: logoUrl || undefined,
    telephone: business.phone || undefined,
    url: website || undefined,
    address: address || city
      ? {
          '@type': 'PostalAddress',
          streetAddress: address || undefined,
          addressLocality: city || undefined,
        }
      : undefined,
    aggregateRating: rating
      ? { '@type': 'AggregateRating', ratingValue: rating, bestRating: 5 }
      : undefined,
  }

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-3xl px-4 md:px-8 py-8 md:py-12">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoUrl ? (
              <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
            ) : (
              <Building2 className="w-9 h-9 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{name}</h1>
            {category && <p className="mt-1 text-sm font-medium text-primary">{category}</p>}
            {rating ? (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Star className="w-4 h-4 fill-primary text-primary" />
                {rating.toFixed(1)}
              </div>
            ) : null}
          </div>
        </div>

        {description && (
          <p className="mt-6 text-muted-foreground leading-6">{description}</p>
        )}

        <div className="mt-6 space-y-3 border-t border-border pt-6 text-sm text-muted-foreground">
          {(address || city) && (
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{[address, city].filter(Boolean).join(', ')}</span>
            </div>
          )}
          {business.phone && (
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 shrink-0 text-primary" />
              <a href={`tel:${business.phone}`} className="hover:text-primary">{business.phone}</a>
            </div>
          )}
          {website && (
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 shrink-0 text-primary" />
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Visit website
              </a>
            </div>
          )}
        </div>

        {services.length > 0 && (
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-foreground mb-4">Services</h2>
            <div className="space-y-3">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium text-foreground">{s.name}</p>
                    {s.description && <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>}
                    <p className="text-xs text-muted-foreground mt-1">{s.duration} min</p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {s.offerPrice ? `$${s.offerPrice.toFixed(2)}` : `$${s.price.toFixed(2)}`}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <Link
          href={`/book/${business.id}`}
          className="mt-10 inline-block rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 transition-colors"
        >
          Book an appointment
        </Link>
      </div>
    </div>
  )
}