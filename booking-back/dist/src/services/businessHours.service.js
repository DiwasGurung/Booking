"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessHoursService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
class BusinessHoursService {
    /**
     * Set business hours for a day
     */
    async setBusinessHours(data) {
        return prisma_1.default.businessHours.upsert({
            where: {
                businessId_dayOfWeek: {
                    businessId: data.businessId,
                    dayOfWeek: data.dayOfWeek,
                },
            },
            update: {
                openTime: data.openTime,
                closeTime: data.closeTime,
                isClosed: data.isClosed || false,
            },
            create: {
                businessId: data.businessId,
                dayOfWeek: data.dayOfWeek,
                openTime: data.openTime,
                closeTime: data.closeTime,
                isClosed: data.isClosed || false,
            },
        });
    }
    /**
     * Get business hours
     */
    async getBusinessHours(businessId) {
        return prisma_1.default.businessHours.findMany({
            where: { businessId },
            orderBy: { dayOfWeek: "asc" },
        });
    }
    /**
     * Get hours for a specific day
     */
    async getHoursForDay(businessId, dayOfWeek) {
        return prisma_1.default.businessHours.findUnique({
            where: {
                businessId_dayOfWeek: {
                    businessId,
                    dayOfWeek,
                },
            },
        });
    }
    /**
     * Update business hours
     */
    async updateBusinessHours(id, data) {
        return prisma_1.default.businessHours.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete business hours
     */
    async deleteBusinessHours(id) {
        return prisma_1.default.businessHours.delete({
            where: { id },
        });
    }
    /**
     * Check if business is open
     */
    async isBusinessOpen(businessId, date = new Date()) {
        const dayOfWeek = date.getDay();
        const hours = await this.getHoursForDay(businessId, dayOfWeek === 0 ? 6 : dayOfWeek - 1);
        if (!hours || hours.isClosed)
            return false;
        const [openHour, openMin] = hours.openTime.split(":").map(Number);
        const [closeHour, closeMin] = hours.closeTime.split(":").map(Number);
        const currentHour = date.getHours();
        const currentMin = date.getMinutes();
        const currentTime = currentHour * 60 + currentMin;
        const openTime = openHour * 60 + openMin;
        const closeTime = closeHour * 60 + closeMin;
        return currentTime >= openTime && currentTime < closeTime;
    }
}
exports.BusinessHoursService = BusinessHoursService;
exports.default = new BusinessHoursService();
