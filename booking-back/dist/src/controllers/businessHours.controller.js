"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const businessHours_service_1 = __importDefault(require("../services/businessHours.service"));
class BusinessHoursController {
    /**
     * Set or update business hours for a day
     */
    async set(req, res) {
        try {
            const hours = await businessHours_service_1.default.setBusinessHours(req.body);
            res.status(201).json(hours);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to set business hours", error });
        }
    }
    /**
     * Get all business hours
     */
    async getAll(req, res) {
        try {
            const { businessId } = req.params;
            const hours = await businessHours_service_1.default.getBusinessHours(businessId);
            res.json(hours);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch business hours", error });
        }
    }
    /**
     * Get hours for a specific day
     */
    async getByDay(req, res) {
        try {
            const { businessId, dayOfWeek } = req.params;
            const hours = await businessHours_service_1.default.getHoursForDay(businessId, Number(dayOfWeek));
            if (!hours) {
                return res.status(404).json({ message: "Business hours not found" });
            }
            res.json(hours);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch business hours", error });
        }
    }
    /**
     * Update business hours by ID
     */
    async update(req, res) {
        try {
            const { id } = req.params;
            const hours = await businessHours_service_1.default.updateBusinessHours(id, req.body);
            res.json(hours);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update business hours", error });
        }
    }
    /**
     * Delete business hours
     */
    async delete(req, res) {
        try {
            const { id } = req.params;
            const hours = await businessHours_service_1.default.deleteBusinessHours(id);
            res.json(hours);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to delete business hours", error });
        }
    }
    /**
     * Check if business is open now
     */
    async isOpen(req, res) {
        try {
            const { businessId } = req.params;
            const open = await businessHours_service_1.default.isBusinessOpen(businessId);
            res.json({ isOpen: open });
        }
        catch (error) {
            res.status(500).json({ message: "Failed to check business status", error });
        }
    }
    /**
     * Add staff time off
     */
    async addTimeOff(req, res) {
        try {
            const { businessId } = req.params;
            const { staffId, startDate, endDate, reason, type } = req.body;
            if (!startDate || !endDate) {
                return res.status(400).json({ message: "Start date and end date are required" });
            }
            const timeOff = await businessHours_service_1.default.addTimeOff({
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
    }
    /**
     * Get time off for a business or staff
     */
    async getTimeOffs(req, res) {
        try {
            const { businessId } = req.params;
            const { staffId } = req.query;
            const timeOffs = await businessHours_service_1.default.getTimeOffs(businessId, staffId);
            res.json({ success: true, data: timeOffs });
        }
        catch (error) {
            console.error("[BusinessHours] Error fetching time offs:", error);
            res.status(500).json({ message: "Failed to fetch time offs", error: error.message });
        }
    }
    /**
     * Remove time off
     */
    async removeTimeOff(req, res) {
        try {
            const { timeOffId } = req.params;
            const timeOff = await businessHours_service_1.default.removeTimeOff(timeOffId);
            res.json({ success: true, data: timeOff });
        }
        catch (error) {
            console.error("[BusinessHours] Error removing time off:", error);
            res.status(500).json({ message: "Failed to remove time off", error: error.message });
        }
    }
    /**
     * Get all closed dates for a business
     */
    async getClosedDates(req, res) {
        try {
            const { businessId } = req.params;
            const closedDates = await businessHours_service_1.default.getClosedDates(businessId);
            res.json({ success: true, data: closedDates });
        }
        catch (error) {
            console.error("[BusinessHours] Error fetching closed dates:", error);
            res.status(500).json({ message: "Failed to fetch closed dates", error: error.message });
        }
    }
    /**
     * Add a closed date
     */
    async addClosedDate(req, res) {
        try {
            const { businessId } = req.params;
            const { date, reason } = req.body;
            if (!date) {
                return res.status(400).json({ message: "Date is required" });
            }
            const closedDate = await businessHours_service_1.default.addClosedDate(businessId, { date, reason });
            res.status(201).json({ success: true, data: closedDate });
        }
        catch (error) {
            console.error("[BusinessHours] Error adding closed date:", error);
            res.status(500).json({ message: "Failed to add closed date", error: error.message });
        }
    }
    /**
     * Remove a closed date
     */
    async removeClosedDate(req, res) {
        try {
            const { businessId, dateId } = req.params;
            const closedDate = await businessHours_service_1.default.removeClosedDate(businessId, dateId);
            res.json({ success: true, data: closedDate });
        }
        catch (error) {
            console.error("[BusinessHours] Error removing closed date:", error);
            res.status(500).json({ message: "Failed to remove closed date", error: error.message });
        }
    }
}
exports.default = new BusinessHoursController();
