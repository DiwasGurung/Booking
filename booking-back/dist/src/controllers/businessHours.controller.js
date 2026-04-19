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
}
exports.default = new BusinessHoursController();
