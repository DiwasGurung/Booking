"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BusinessHoursService = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const luxon_1 = require("luxon");
const BUSINESS_TZ = process.env.BUSINESS_TIME_ZONE || "Asia/Kathmandu";
class BusinessHoursService {
    /**
     * Resolve the branch to operate on and verify it belongs to the business.
     * No branchId given -> the business's main branch.
     * Throws BRANCH_NOT_FOUND if the branch doesn't exist or belongs to another business.
     */
    async resolveBranchId(businessId, branchId) {
        const branch = branchId
            ? await prisma_1.default.branch.findFirst({ where: { id: branchId, businessId }, select: { id: true } })
            : await prisma_1.default.branch.findFirst({ where: { businessId, isMain: true }, select: { id: true } });
        if (!branch)
            throw new Error("BRANCH_NOT_FOUND");
        return branch.id;
    }
    /**
     * Set business hours for a day (per branch)
     */
    async setBusinessHours(data) {
        const branchId = await this.resolveBranchId(data.businessId, data.branchId);
        return prisma_1.default.businessHours.upsert({
            where: { branchId_dayOfWeek: { branchId, dayOfWeek: data.dayOfWeek } },
            update: {
                openTime: data.openTime,
                closeTime: data.closeTime,
                isClosed: data.isClosed || false,
            },
            create: {
                businessId: data.businessId,
                branchId,
                dayOfWeek: data.dayOfWeek,
                openTime: data.openTime,
                closeTime: data.closeTime,
                isClosed: data.isClosed || false,
            },
        });
    }
    /**
     * Get a branch's weekly hours
     */
    async getBusinessHours(businessId, branchId) {
        const resolved = await this.resolveBranchId(businessId, branchId);
        return prisma_1.default.businessHours.findMany({
            where: { businessId, branchId: resolved },
            orderBy: { dayOfWeek: "asc" },
        });
    }
    async getHoursForDay(branchId, dayOfWeek) {
        return prisma_1.default.businessHours.findUnique({
            where: { branchId_dayOfWeek: { branchId, dayOfWeek } },
        });
    }
    /**
     * Update business hours (scoped to the owning business)
     */
    async updateBusinessHours(businessId, id, data) {
        const existing = await prisma_1.default.businessHours.findFirst({ where: { id, businessId } });
        if (!existing)
            throw new Error("HOURS_NOT_FOUND");
        return prisma_1.default.businessHours.update({ where: { id }, data });
    }
    /**
     * Delete business hours (scoped to the owning business)
     */
    async deleteBusinessHours(businessId, id) {
        const existing = await prisma_1.default.businessHours.findFirst({ where: { id, businessId } });
        if (!existing)
            throw new Error("HOURS_NOT_FOUND");
        return prisma_1.default.businessHours.delete({ where: { id } });
    }
    /**
     * Is the branch open right now? Uses the business timezone (not the server's)
     * and respects closed dates.
     */
    async isBusinessOpen(branchId, date = new Date()) {
        const local = luxon_1.DateTime.fromJSDate(date, { zone: BUSINESS_TZ });
        const dayOfWeek = local.weekday - 1; // luxon: 1 = Monday ... 7 = Sunday -> 0 = Monday ... 6 = Sunday
        // Closed dates are stored as UTC midnight of the calendar day
        const closedDay = new Date(`${local.toISODate()}T00:00:00.000Z`);
        const closed = await prisma_1.default.closedDate.findUnique({
            where: { branchId_date: { branchId, date: closedDay } },
            select: { id: true },
        });
        if (closed)
            return false;
        const hours = await this.getHoursForDay(branchId, dayOfWeek);
        if (!hours || hours.isClosed)
            return false;
        const [openHour, openMin] = hours.openTime.split(":").map(Number);
        const [closeHour, closeMin] = hours.closeTime.split(":").map(Number);
        const currentTime = local.hour * 60 + local.minute;
        return currentTime >= openHour * 60 + openMin && currentTime < closeHour * 60 + closeMin;
    }
    /**
     * Add staff time off. A staff member's time off inherits their branch.
     */
    async addTimeOff(data) {
        let branchId = null;
        if (data.staffId) {
            const staff = await prisma_1.default.staff.findFirst({
                where: { id: data.staffId, businessId: data.businessId },
                select: { branchId: true },
            });
            if (!staff)
                throw new Error("STAFF_NOT_FOUND");
            branchId = staff.branchId;
        }
        else if (data.branchId) {
            branchId = await this.resolveBranchId(data.businessId, data.branchId);
        }
        return prisma_1.default.timeOff.create({
            data: {
                businessId: data.businessId,
                staffId: data.staffId,
                branchId,
                startDate: new Date(data.startDate),
                endDate: new Date(data.endDate),
                reason: data.reason,
                type: data.type || "BREAK",
            },
        });
    }
    /**
     * Get time off periods for a business, optionally narrowed to a staff member or branch
     */
    async getTimeOffs(businessId, staffId, branchId) {
        return prisma_1.default.timeOff.findMany({
            where: {
                businessId,
                ...(staffId && { staffId }),
                ...(branchId && { branchId }),
            },
            orderBy: { startDate: "asc" },
        });
    }
    /**
     * Remove time off (scoped to the owning business)
     */
    async removeTimeOff(businessId, timeOffId) {
        const existing = await prisma_1.default.timeOff.findFirst({ where: { id: timeOffId, businessId } });
        if (!existing)
            throw new Error("TIME_OFF_NOT_FOUND");
        return prisma_1.default.timeOff.delete({ where: { id: timeOffId } });
    }
    /**
     * Check if staff is on time off on a date
     */
    async isStaffOnTimeOff(businessId, staffId, date) {
        const timeOff = await prisma_1.default.timeOff.findFirst({
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
     * Get a branch's closed dates
     */
    async getClosedDates(businessId, branchId) {
        const resolved = await this.resolveBranchId(businessId, branchId);
        return prisma_1.default.closedDate.findMany({
            where: { businessId, branchId: resolved },
            orderBy: { date: "asc" },
        });
    }
    async addClosedDate(businessId, data) {
        const branchId = await this.resolveBranchId(businessId, data.branchId);
        // Normalize to midnight UTC of the calendar day to prevent timezone shifts
        const pureDateString = data.date.split("T")[0];
        const dateObj = new Date(`${pureDateString}T00:00:00.000Z`);
        return prisma_1.default.closedDate.upsert({
            where: { branchId_date: { branchId, date: dateObj } },
            update: { reason: data.reason },
            create: { businessId, branchId, date: dateObj, reason: data.reason },
        });
    }
    /**
     * Remove a closed date (scoped to the owning business)
     */
    async removeClosedDate(businessId, closedDateId) {
        const existing = await prisma_1.default.closedDate.findFirst({ where: { id: closedDateId, businessId } });
        if (!existing)
            throw new Error("CLOSED_DATE_NOT_FOUND");
        return prisma_1.default.closedDate.delete({ where: { id: closedDateId } });
    }
}
exports.BusinessHoursService = BusinessHoursService;
exports.default = new BusinessHoursService();
