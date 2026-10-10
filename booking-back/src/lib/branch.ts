import { Prisma } from '@prisma/client'

type BusinessLike = {
  id: string
  phone: string
  address: string
  city: string
  state: string
  latitude?: number | null
  longitude?: number | null
}

/**
 * Creates the business's Main branch from its profile details.
 * Accepts a transaction client so it can run inside the same transaction
 * that creates the business. Idempotent: does nothing if a main branch exists.
 */
export async function createMainBranch(
  db: Prisma.TransactionClient,
  business: BusinessLike,
  name = 'Main Branch'
) {
  const existing = await db.branch.findFirst({
    where: { businessId: business.id, isMain: true },
    select: { id: true },
  })
  if (existing) return existing

  return db.branch.create({
    data: {
      businessId: business.id,
      name,
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      latitude: business.latitude ?? null,
      longitude: business.longitude ?? null,
      isMain: true,
    },
  })
}

/**
 * Keeps the Main branch in sync with the business profile while the business
 * has a single branch. Call it from the settings/update-business flow.
 */
export async function syncMainBranchIfSingle(
  db: Prisma.TransactionClient,
  business: BusinessLike
) {
  const count = await db.branch.count({ where: { businessId: business.id } })
  if (count !== 1) return
  await db.branch.updateMany({
    where: { businessId: business.id, isMain: true },
    data: {
      phone: business.phone,
      address: business.address,
      city: business.city,
      state: business.state,
      latitude: business.latitude ?? null,
      longitude: business.longitude ?? null,
    },
  })
}

import prisma from './prisma'

/** Validates a branchId for a business, or falls back to the main branch. */
export async function resolveBranchId(businessId: string, branchId?: string | null): Promise<string> {
  if (branchId) {
    const b = await prisma.branch.findFirst({ where: { id: branchId, businessId, isActive: true }, select: { id: true } })
    if (!b) throw new Error('Branch not found')
    return b.id
  }
  const main = await prisma.branch.findFirst({ where: { businessId, isMain: true }, select: { id: true } })
  if (!main) throw new Error('Business has no main branch')
  return main.id
}

/** Name/address/phone to show customers. The branch name is added only when the business has 2+ branches. */
export async function getBranchDisplay(
  branchId: string | null | undefined,
  business: { name: string; phone?: string | null; address?: string | null }
) {
  const fallback = { name: business.name, phone: business.phone ?? null, address: business.address ?? null }
  if (!branchId) return fallback
  const branch = await prisma.branch.findUnique({
    where: { id: branchId },
    include: { business: { select: { _count: { select: { branches: true } } } } },
  })
  if (!branch) return fallback
  const multi = branch.business._count.branches > 1
  return {
    name: multi ? `${business.name} - ${branch.name}` : business.name,
    phone: branch.phone ?? business.phone ?? null,
    address: [branch.address, branch.city].filter(Boolean).join(', ') || business.address || null,
  }

  
}

const toSlug = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'branch'

export async function generateBranchSlug(db: Prisma.TransactionClient | typeof prisma, businessId: string, name: string) {
  const base = toSlug(name)
  let slug = base
  for (let i = 2; await db.branch.findFirst({ where: { businessId, slug }, select: { id: true } }); i++) {
    slug = `${base}-${i}`
  }
  return slug
}