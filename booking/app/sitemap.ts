import type { MetadataRoute } from 'next'
import { businessApi } from '@/lib/api'

const siteUrl = 'https://appoint-nepal.com'

const staticPages = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/search', priority: 0.8, changeFrequency: 'daily' as const },
  { path: '/register-business', priority: 0.6, changeFrequency: 'monthly' as const },
  { path: '/help', priority: 0.3, changeFrequency: 'monthly' as const },
  { path: '/terms', priority: 0.2, changeFrequency: 'yearly' as const },
  { path: '/privacy', priority: 0.2, changeFrequency: 'yearly' as const },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const res = await businessApi.getAll()
  const list = Array.isArray(res.data)
    ? res.data
    : Array.isArray((res.data as any)?.businesses)
      ? (res.data as any).businesses
      : []

  return [
    ...staticPages.map((p) => ({
      url: `${siteUrl}${p.path}`,
      changeFrequency: p.changeFrequency,
      priority: p.priority,
    })),
    ...list.map((b: any) => ({
      url: `${siteUrl}/business/${b.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]
}