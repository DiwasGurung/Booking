// branch.controller.ts
import { Request, Response } from 'express'
import prisma from '../lib/prisma'

async function getOwnedBusiness(req: Request) {
  const userId = (req as any).userId
  if (!userId) return null
  return prisma.business.findUnique({
    where: { userId },
    include: { subscription: { include: { plan: true } }, _count: { select: { branches: true } } },
  })
}

class BranchController {

    async publicList(req: Request, res: Response) {
  const businessId = req.params.businessId as string
  const branches = await prisma.branch.findMany({
    where: { businessId, isActive: true },
    orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    select: { id: true, name: true, address: true, city: true, phone: true, latitude: true, longitude: true, isMain: true },
  })
  res.json({ success: true, data: branches })
}
  async list(req: Request, res: Response) {
    const business = await getOwnedBusiness(req)
    if (!business) return res.status(403).json({ success: false, message: 'No business found' })
    const branches = await prisma.branch.findMany({
      where: { businessId: business.id },
      orderBy: [{ isMain: 'desc' }, { createdAt: 'asc' }],
    })
    res.json({
      success: true,
      data: branches,
      limit: business.subscription?.plan?.maxBranches ?? 1,
    })
  }

  async create(req: Request, res: Response) {
    try {
      const business = await getOwnedBusiness(req)
      if (!business) return res.status(403).json({ success: false, message: 'No business found' })

      const limit = business.subscription?.plan?.maxBranches ?? 1
      if (limit !== -1 && business._count.branches >= limit) {
        return res.status(403).json({
          success: false,
          error: 'BRANCH_LIMIT_EXCEEDED',
          message: `Your plan allows ${limit} branch${limit === 1 ? '' : 'es'}. Upgrade to add more.`,
        })
      }

      const { name, phone, address, city, state, latitude, longitude } = req.body
      if (!name || !address || !city) {
        return res.status(400).json({ success: false, message: 'name, address and city are required' })
      }

      const branch = await prisma.branch.create({
        data: { businessId: business.id, name, phone, address, city, state, latitude, longitude },
      })
      res.status(201).json({ success: true, data: branch })
    } catch (e: any) {
      res.status(500).json({ success: false, message: e.message })
    }
  }

  async update(req: Request, res: Response) {
    const business = await getOwnedBusiness(req)
    if (!business) return res.status(403).json({ success: false, message: 'No business found' })

    const id = req.params.id as string
    const existing = await prisma.branch.findFirst({ where: { id, businessId: business.id } })
    if (!existing) return res.status(404).json({ success: false, message: 'Branch not found' })

    const { name, phone, address, city, state, latitude, longitude, isActive } = req.body
    const branch = await prisma.branch.update({
      where: { id },
      data: { name, phone, address, city, state, latitude, longitude, isActive },
    })
    res.json({ success: true, data: branch })
  }

  async remove(req: Request, res: Response) {
    const business = await getOwnedBusiness(req)
    if (!business) return res.status(403).json({ success: false, message: 'No business found' })

    const id = req.params.id as string
    const branch = await prisma.branch.findFirst({ where: { id, businessId: business.id } })
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' })
    if (branch.isMain) return res.status(400).json({ success: false, message: 'The main branch cannot be deleted' })

    const upcoming = await prisma.booking.count({
      where: { branchId: id, startTime: { gt: new Date() }, status: { in: ['CONFIRMED', 'PENDING', 'UNVERIFIED'] } },
    })
    if (upcoming > 0) {
      return res.status(409).json({
        success: false,
        message: `This branch has ${upcoming} upcoming booking(s). Cancel or move them first, or deactivate the branch instead.`,
      })
    }

    await prisma.branch.delete({ where: { id } })
    res.json({ success: true })
  }
}

export default new BranchController()