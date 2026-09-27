import type { MetadataRoute } from 'next'
import { businessApi } from '@/lib/api'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://appoint-nepal.com'
  let businesses: any[] = []
  try {
    const res = await businessApi.getAll()
    const data: any = res?.data
    businesses = Array.isArray(data) ? data : data?.businesses ?? []
  } catch {}

  return [
    { url: `${base}/search`, changeFrequency: 'daily', priority: 0.8 },
    ...businesses.map((b) => ({
      url: `${base}/business/${b.id}`,
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    })),
  ]
}