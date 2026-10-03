import  prisma  from '../lib/prisma'

export const RESERVED_SLUGS = new Set([
  'admin', 'api', 'app', 'book', 'dashboard', 'login', 'logout', 'register',
  'signup', 'subscription', 'settings', 'payments', 'static', 'www', 'support',
  'help', 'about', 'contact', 'terms', 'privacy',
])

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')   // strip accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '')
}

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateSlug(slug: string): string | null {
  if (slug.length < 3 || slug.length > 40) return 'Slug must be 3-40 characters'
  if (!SLUG_REGEX.test(slug)) return 'Use lowercase letters, numbers and single hyphens only'
  if (RESERVED_SLUGS.has(slug)) return 'This slug is reserved'
  return null
}

export async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  let base = slugify(name)
  if (base.length < 3 || RESERVED_SLUGS.has(base)) base = `${base || 'business'}-booking`

  let slug = base
  let i = 1
  while (true) {
    const existing = await prisma.business.findUnique({ where: { slug } })
    if (!existing || existing.id === excludeId) return slug
    i += 1
    slug = `${base}-${i}`
  }
}