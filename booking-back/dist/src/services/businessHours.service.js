"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessHoursService = void 0;
const prisma_js_1 = __importDefault(require("../lib/prisma.js"));
class BusinessHoursService {
    /**
     * Set business hours for a day
     */
    async setBusinessHours(data) {
        return prisma_js_1.default.businessHours.upsert({
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
        return prisma_js_1.default.businessHours.findMany({
            where: { businessId },
            orderBy: { dayOfWeek: "asc" },
        });
    }
    /**
     * Get hours for a specific day
     */
    async getHoursForDay(businessId, dayOfWeek) {
        return prisma_js_1.default.businessHours.findUnique({
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
        return prisma_js_1.default.businessHours.update({
            where: { id },
            data,
        });
    }
    /**
     * Delete business hours
     */
    async deleteBusinessHours(id) {
        return prisma_js_1.default.businessHours.delete({
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
    /**
     * Add staff time off
     */
    async addTimeOff(data) {
        const startDate = new Date(data.startDate);
        const endDate = new Date(data.endDate);
        return prisma_js_1.default.timeOff.create({
            data: {
                businessId: data.businessId,
                staffId: data.staffId,
                startDate,
                endDate,
                reason: data.reason,
                type: data.type || "BREAK",
            },
        });
    }
    /**
     * Get time off periods for a business or staff
     */
    async getTimeOffs(businessId, staffId) {
        return prisma_js_1.default.timeOff.findMany({
            where: {
                businessId,
                ...(staffId && { staffId }),
            },
            orderBy: { startDate: "asc" },
        });
    }
    /**
     * Remove time off
     */
    async removeTimeOff(timeOffId) {
        return prisma_js_1.default.timeOff.delete({
            where: { id: timeOffId },
        });
    }
    /**
     * Check if staff is on time off on a date
     */
    async isStaffOnTimeOff(businessId, staffId, date) {
        const timeOff = await prisma_js_1.default.timeOff.findFirst({
            where: {
                businessId,
                staffId,
                startDate: { lte: date },
                endDate: { gte: date },
            },
        });
        return !!timeOff;
    }
    /**
     * Get all closed dates for a business
     */
    async getClosedDates(businessId) {
        return prisma_js_1.default.closedDate.findMany({
            where: { businessId },
            orderBy: { date: "asc" },
        });
    }
    /**
     * Add a closed date
     */
    async addClosedDate(businessId, data) {
        const dateObj = new Date(data.date);
        return prisma_js_1.default.closedDate.create({
            data: {
                businessId,
                date: dateObj,
                reason: data.reason,
            },
        });
    }
    /**
     * Remove a closed date
     */
    async removeClosedDate(businessId, closedDateId) {
        return prisma_js_1.default.closedDate.delete({
            where: {
                id: closedDateId,
            },
        });
    }
}
exports.BusinessHoursService = BusinessHoursService;
exports.default = new BusinessHoursService();
