"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.entityResolvers = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
exports.entityResolvers = {
    USER: {
        getDestination: async (id) => (await prisma_1.default.user.findUnique({ where: { id } }))?.phone ?? null,
        isAlreadyVerified: async (id) => !!(await prisma_1.default.user.findUnique({ where: { id } }))?.isPhoneVerified,
        markVerified: async (id) => {
            await prisma_1.default.user.update({ where: { id }, data: { isPhoneVerified: true } });
        },
    },
    STAFF: {
        getDestination: async (id) => (await prisma_1.default.staff.findUnique({ where: { id } }))?.phone ?? null,
        isAlreadyVerified: async (id) => !!(await prisma_1.default.staff.findUnique({ where: { id } }))?.isPhoneVerified,
        markVerified: async (id) => {
            await prisma_1.default.staff.update({ where: { id }, data: { isPhoneVerified: true } });
        },
    },
    BUSINESS: {
        getDestination: async (id) => (await prisma_1.default.business.findUnique({ where: { id } }))?.phone ?? null,
        isAlreadyVerified: async (id) => !!(await prisma_1.default.business.findUnique({ where: { id } }))?.isPhoneVerified,
        markVerified: async (id) => {
            await prisma_1.default.business.update({ where: { id }, data: { isPhoneVerified: true } });
        },
    },
    BOOKING: {
        getDestination: async (id) => (await prisma_1.default.booking.findUnique({ where: { id } }))?.customerPhone ?? null,
        isAlreadyVerified: async (id) => !!(await prisma_1.default.booking.findUnique({ where: { id } }))?.isPhoneVerified,
        markVerified: async (id) => {
            // Verifying a booking's phone does two things: (1) confirms THIS
            // booking — flips it from UNVERIFIED to CONFIRMED, and (2) remembers
            // the verification on the customer/user so every FUTURE booking from
            // this same person skips the OTP step entirely (one-time verification).
            const booking = await prisma_1.default.booking.update({
                where: { id },
                data: {
                    isPhoneVerified: true,
                    status: 'CONFIRMED',
                },
            });
            if (booking.customerId) {
                await prisma_1.default.customer.update({ where: { id: booking.customerId }, data: { isPhoneVerified: true } });
            }
            if (booking.userId) {
                await prisma_1.default.user.update({ where: { id: booking.userId }, data: { isPhoneVerified: true } });
            }
        },
        // Booking OTPs count against the owning business's SMS quota — everything
        // else (USER/STAFF/BUSINESS) is account infrastructure and stays ungated.
        getBusinessId: async (id) => (await prisma_1.default.booking.findUnique({ where: { id } }))?.businessId,
    },
};
