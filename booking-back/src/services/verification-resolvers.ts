import  prisma  from '../lib/prisma'
import { VerifyEntityType } from './phone-verification.service'

export interface EntityResolver {
  /** Phone number to send the OTP to, or null if the entity has none on file. */
  getDestination: (entityId: string) => Promise<string | null>
  isAlreadyVerified: (entityId: string) => Promise<boolean>
  markVerified: (entityId: string) => Promise<void>
  /** Only defined for entity types tied to a business's paid SMS quota. */
  getBusinessId?: (entityId: string) => Promise<string | undefined>
}

export const entityResolvers: Record<VerifyEntityType, EntityResolver> = {
  USER: {
    getDestination: async (id) => (await prisma.user.findUnique({ where: { id } }))?.phone ?? null,
    isAlreadyVerified: async (id) => !!(await prisma.user.findUnique({ where: { id } }))?.isPhoneVerified,
    markVerified: async (id) => {
      await prisma.user.update({ where: { id }, data: { isPhoneVerified: true } })
    },
  },

  STAFF: {
    getDestination: async (id) => (await prisma.staff.findUnique({ where: { id } }))?.phone ?? null,
    isAlreadyVerified: async (id) => !!(await prisma.staff.findUnique({ where: { id } }))?.isPhoneVerified,
    markVerified: async (id) => {
      await prisma.staff.update({ where: { id }, data: { isPhoneVerified: true } })
    },
  },

  BUSINESS: {
    getDestination: async (id) => (await prisma.business.findUnique({ where: { id } }))?.phone ?? null,
    isAlreadyVerified: async (id) => !!(await prisma.business.findUnique({ where: { id } }))?.isPhoneVerified,
    markVerified: async (id) => {
      await prisma.business.update({ where: { id }, data: { isPhoneVerified: true } })
    },
  },

  BOOKING: {
    getDestination: async (id) => (await prisma.booking.findUnique({ where: { id } }))?.customerPhone ?? null,
    isAlreadyVerified: async (id) => !!(await prisma.booking.findUnique({ where: { id } }))?.isPhoneVerified,
    markVerified: async (id) => {
      const booking = await prisma.booking.update({ where: { id }, data: { isPhoneVerified: true } })
      if (booking.customerId) {
        await prisma.customer.update({ where: { id: booking.customerId }, data: { isPhoneVerified: true } })
      }
    },
    // Booking OTPs count against the owning business's SMS quota — everything
    // else (USER/STAFF/BUSINESS) is account infrastructure and stays ungated.
    getBusinessId: async (id) => (await prisma.booking.findUnique({ where: { id } }))?.businessId,
  },
}