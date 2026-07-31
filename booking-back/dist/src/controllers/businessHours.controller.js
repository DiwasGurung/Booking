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
const businessHours_service_1 = __importDefault(require("../services/businessHours.service"));
class BusinessHoursController {
    /**
     * Set or update business hours for a day
     */
    set(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const hours = yield businessHours_service_1.default.setBusinessHours(req.body);
                res.status(201).json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to set business hours", error });
            }
        });
    }
    /**
     * Get all business hours
     */
    getAll(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const hours = yield businessHours_service_1.default.getBusinessHours(businessId);
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch business hours", error });
            }
        });
    }
    /**
     * Get hours for a specific day
     */
    getByDay(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId, dayOfWeek } = req.params;
                const hours = yield businessHours_service_1.default.getHoursForDay(businessId, Number(dayOfWeek));
                if (!hours) {
                    return res.status(404).json({ message: "Business hours not found" });
                }
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to fetch business hours", error });
            }
        });
    }
    /**
     * Update business hours by ID
     */
    update(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const hours = yield businessHours_service_1.default.updateBusinessHours(id, req.body);
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to update business hours", error });
            }
        });
    }
    /**
     * Delete business hours
     */
    delete(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { id } = req.params;
                const hours = yield businessHours_service_1.default.deleteBusinessHours(id);
                res.json(hours);
            }
            catch (error) {
                res.status(500).json({ message: "Failed to delete business hours", error });
            }
        });
    }
    /**
     * Check if business is open now
     */
    isOpen(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const open = yield businessHours_service_1.default.isBusinessOpen(businessId);
                res.json({ isOpen: open });
            }
            catch (error) {
                res.status(500).json({ message: "Failed to check business status", error });
            }
        });
    }
    /**
     * Add staff time off
     */
    addTimeOff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const { staffId, startDate, endDate, reason, type } = req.body;
                if (!startDate || !endDate) {
                    return res.status(400).json({ message: "Start date and end date are required" });
                }
                const timeOff = yield businessHours_service_1.default.addTimeOff({
                    businessId: businessId,
                    staffId,
                    startDate,
                    endDate,
                    reason,
                    type,
                });
                res.status(201).json({ success: true, data: timeOff });
            }
            catch (error) {
                console.error("[BusinessHours] Error adding time off:", error);
                res.status(500).json({ message: "Failed to add time off", error: error.message });
            }
        });
    }
    /**
     * Get time off for a business or staff
     */
    getTimeOffs(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const { staffId } = req.query;
                const timeOffs = yield businessHours_service_1.default.getTimeOffs(businessId, staffId);
                res.json({ success: true, data: timeOffs });
            }
            catch (error) {
                console.error("[BusinessHours] Error fetching time offs:", error);
                res.status(500).json({ message: "Failed to fetch time offs", error: error.message });
            }
        });
    }
    /**
     * Remove time off
     */
    removeTimeOff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { timeOffId } = req.params;
                const timeOff = yield businessHours_service_1.default.removeTimeOff(timeOffId);
                res.json({ success: true, data: timeOff });
            }
            catch (error) {
                console.error("[BusinessHours] Error removing time off:", error);
                res.status(500).json({ message: "Failed to remove time off", error: error.message });
            }
        });
    }
    /**
     * Get all closed dates for a business
     */
    getClosedDates(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const closedDates = yield businessHours_service_1.default.getClosedDates(businessId);
                res.json({ success: true, data: closedDates });
            }
            catch (error) {
                console.error("[BusinessHours] Error fetching closed dates:", error);
                res.status(500).json({ message: "Failed to fetch closed dates", error: error.message });
            }
        });
    }
    /**
     * Add a closed date
     */
    addClosedDate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId } = req.params;
                const { date, reason } = req.body;
                if (!date) {
                    return res.status(400).json({ message: "Date is required" });
                }
                const closedDate = yield businessHours_service_1.default.addClosedDate(businessId, { date, reason });
                res.status(201).json({ success: true, data: closedDate });
            }
            catch (error) {
                console.error("[BusinessHours] Error adding closed date:", error);
                res.status(500).json({ message: "Failed to add closed date", error: error.message });
            }
        });
    }
    /**
     * Remove a closed date
     */
    removeClosedDate(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { businessId, dateId } = req.params;
                const closedDate = yield businessHours_service_1.default.removeClosedDate(businessId, dateId);
                res.json({ success: true, data: closedDate });
            }
            catch (error) {
                console.error("[BusinessHours] Error removing closed date:", error);
                res.status(500).json({ message: "Failed to remove closed date", error: error.message });
            }
        });
    }
}
exports.default = new BusinessHoursController();
