"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    setBusinessHours(data) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    /**
     * Get business hours
     */
    getBusinessHours(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.businessHours.findMany({
                where: { businessId },
                orderBy: { dayOfWeek: "asc" },
            });
        });
    }
    /**
     * Get hours for a specific day
     */
    getHoursForDay(businessId, dayOfWeek) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.businessHours.findUnique({
                where: {
                    businessId_dayOfWeek: {
                        businessId,
                        dayOfWeek,
                    },
                },
            });
        });
    }
    /**
     * Update business hours
     */
    updateBusinessHours(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.businessHours.update({
                where: { id },
                data,
            });
        });
    }
    /**
     * Delete business hours
     */
    deleteBusinessHours(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.businessHours.delete({
                where: { id },
            });
        });
    }
    /**
     * Check if business is open
     */
    isBusinessOpen(businessId_1) {
        return __awaiter(this, arguments, void 0, function* (businessId, date = new Date()) {
            const dayOfWeek = date.getDay();
            const hours = yield this.getHoursForDay(businessId, dayOfWeek === 0 ? 6 : dayOfWeek - 1);
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
        });
    }
    /**
     * Add staff time off
     */
    addTimeOff(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const startDate = new Date(data.startDate);
            const endDate = new Date(data.endDate);
            return prisma_1.default.timeOff.create({
                data: {
                    businessId: data.businessId,
                    staffId: data.staffId,
                    startDate,
                    endDate,
                    reason: data.reason,
                    type: data.type || "BREAK",
                },
            });
        });
    }
    /**
     * Get time off periods for a business or staff
     */
    getTimeOffs(businessId, staffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.timeOff.findMany({
                where: Object.assign({ businessId }, (staffId && { staffId })),
                orderBy: { startDate: "asc" },
            });
        });
    }
    /**
     * Remove time off
     */
    removeTimeOff(timeOffId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.timeOff.delete({
                where: { id: timeOffId },
            });
        });
    }
    /**
     * Check if staff is on time off on a date
     */
    isStaffOnTimeOff(businessId, staffId, date) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeOff = yield prisma_1.default.timeOff.findFirst({
                where: {
                    businessId,
                    staffId,
                    startDate: { lte: date },
                    endDate: { gte: date },
                },
            });
            return !!timeOff;
        });
    }
    /**
     * Get all closed dates for a business
     */
    getClosedDates(businessId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.closedDate.findMany({
                where: { businessId },
                orderBy: { date: "asc" },
            });
        });
    }
    /**
     * Add a closed date
     */
    addClosedDate(businessId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const dateObj = new Date(data.date);
            return prisma_1.default.closedDate.create({
                data: {
                    businessId,
                    date: dateObj,
                    reason: data.reason,
                },
            });
        });
    }
    /**
     * Remove a closed date
     */
    removeClosedDate(businessId, closedDateId) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma_1.default.closedDate.delete({
                where: {
                    id: closedDateId,
                },
            });
        });
    }
}
exports.BusinessHoursService = BusinessHoursService;
exports.default = new BusinessHoursService();
